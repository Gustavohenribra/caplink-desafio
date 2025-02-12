import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { calculateECGBaseline } from '@/lib/ecgCalculator';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

interface ClientState {
  deviationBuffer: boolean[];
  alertActive: boolean;
  startTime: Date | null;
}

app.prepare().then(() => {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server);

  const clients = new Map<string, ClientState>();

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    clients.set(socket.id, {
      deviationBuffer: [],
      alertActive: false,
      startTime: null,
    });

    socket.on('ecgData', (data: { x: number; y: number }) => {
      const state = clients.get(socket.id);
      if (!state) return;

      const baseline = calculateECGBaseline(data.x);
      const deviation = Math.abs(data.y - baseline);
      const percentDeviation = (deviation / Math.abs(baseline)) * 100 || 0;
      const isDeviating = percentDeviation >= 20;

      state.deviationBuffer.push(isDeviating);
      if (state.deviationBuffer.length > 60) state.deviationBuffer.shift();

      const deviationCount = state.deviationBuffer.filter(Boolean).length;

      if (deviationCount >= 5 && !state.alertActive) {
        state.alertActive = true;
        state.startTime = new Date();
        io.to(socket.id).emit('alert', {
          type: 'bip',
          message: 'Irregularidade detectada!',
          startTime: state.startTime.toISOString(),
        });
      } else if (deviationCount < 5 && state.alertActive) {
        state.alertActive = false;
        const endTime = new Date();
        io.to(socket.id).emit('alert', {
          type: 'bipbip',
          message: 'Ritmo normalizado',
          endTime: endTime.toISOString(),
          duration: (endTime.getTime() - (state.startTime?.getTime() || 0)) / 1000,
        });
        state.startTime = null;
      }

      socket.emit('ecgData', { ecgValue: data.y });
    });

    socket.on('disconnect', () => {
      clients.delete(socket.id);
      console.log('Cliente desconectado:', socket.id);
    });
  });

  server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
  });
});
