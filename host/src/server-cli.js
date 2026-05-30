import { createHostBridgeServer } from './http-server.js';

const host = '127.0.0.1';
const port = Number.parseInt(process.env.TELLMELIGHT_PORT ?? '8787', 10);
const server = createHostBridgeServer();

server.listen(port, host, () => {
  console.log(`TellMeLight Host Bridge listening on http://${host}:${port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
