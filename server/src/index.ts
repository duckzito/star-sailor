import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import http from 'http';
import path from 'path';
import { SERVER_PORT } from '@star-sailor/shared';
import { GameRoom } from './rooms/GameRoom';

const PORT = parseInt(process.env.PORT || String(SERVER_PORT), 10);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
});

gameServer.define('coop', GameRoom);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// In production, serve the built client as static files
if (isProduction) {
  // In Docker: /app/client (set via CLIENT_DIR)
  // Locally:   <project>/client/dist
  const clientDist = process.env.CLIENT_DIR || path.resolve(__dirname, '../../client/dist');

  // Hashed assets get long cache; index.html must not be cached
  app.use(express.static(clientDist, { maxAge: '1d', etag: true, index: false }));

  // SPA fallback — skip Colyseus and API paths
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/matchmake') || req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Star Sailor server listening on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});
