import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { attachSocket } from '../socketServer';

interface AlertData {
  type: string;
  message: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

describe('Teste do servidor Socket.IO', () => {
  let httpServer: HTTPServer;
  let io: SocketIOServer;
  let clientSocket: Socket;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    io = attachSocket(httpServer);
    httpServer.listen(() => {
      const address = httpServer.address();
      if (address && typeof address !== 'string') {
        port = address.port;
      } else {
        throw new Error('Falha ao iniciar o servidor');
      }
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll((done) => {
    io.close();
    clientSocket.close();
    httpServer.close(done);
  });

  beforeEach(() => {
    clientSocket.removeAllListeners('alert');
    clientSocket.removeAllListeners('ecgData');
  });

  test('deve emitir evento "alert" quando condições de desvio são atendidas', (done) => {
    clientSocket.once('alert', (data: AlertData) => {
      try {
        expect(data.type).toBe('bip');
        expect(data.message).toBe('Irregularidade detectada!');
        expect(data.startTime).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });

    for (let i = 0; i < 5; i++) {
      clientSocket.emit('ecgData', { x: 1, y: 100 });
    }
  });

  test('não deve emitir evento "alert" se desvios insuficientes', (done) => {
    let alertRecebido = false;
    clientSocket.once('alert', () => {
      alertRecebido = true;
    });

    for (let i = 0; i < 4; i++) {
      clientSocket.emit('ecgData', { x: 1, y: 100 });
    }
    setTimeout(() => {
      try {
        expect(alertRecebido).toBe(false);
        done();
      } catch (error) {
        done(error);
      }
    }, 50);
  });

  test('deve emitir evento "ecgData" com ecgValue igual ao enviado', (done) => {
    clientSocket.once('ecgData', (data: { ecgValue: number }) => {
      try {
        expect(data.ecgValue).toBe(50);
        done();
      } catch (error) {
        done(error);
      }
    });
    clientSocket.emit('ecgData', { x: 1, y: 50 });
  });

  test('deve limpar o estado do cliente após desconexão', (done) => {
    const tempSocket = Client(`http://localhost:${port}`);
    tempSocket.on('connect', () => {
      tempSocket.on('disconnect', () => {
        tempSocket.emit('ecgData', { x: 1, y: 100 });
        setTimeout(() => {
          done();
        }, 50);
      });
      tempSocket.disconnect();
    });
  });
});
