import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

interface ClientState {
  deviationBuffer: boolean[];
  alertActive: boolean;
  startTime: Date | null;
}

function calculateECGBaseline(x: number): number {
  return (
    -0.06366 +
    0.12613 * Math.cos((Math.PI * x) / 500) +
    0.12258 * Math.cos((Math.PI * x) / 250) +
    0.01593 * Math.sin((Math.PI * x) / 500) +
    0.03147 * Math.sin((Math.PI * x) / 250)
  );
}

export function attachSocket(server: HTTPServer): SocketIOServer {
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

  return io;
}
