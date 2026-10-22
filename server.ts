import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { ensureDefaultBoards } from "./src/lib/server/migrate-legacy-state";
import { registerBoardSocketHandlers } from "./src/lib/server/scoreboard-runtime";
import { getDatabase } from "./src/lib/server/database";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  getDatabase();
  await ensureDefaultBoards();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["polling"],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  registerBoardSocketHandlers(io);

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\nPort ${port} is already in use. Stop the other process or run:\n` +
          `  PowerShell: Get-NetTCPConnection -LocalPort ${port} | Select OwningProcess\n` +
          `  Then: Stop-Process -Id <PID> -Force\n` +
          `  Or: $env:PORT="3001"; npm run dev\n`,
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Control: http://${hostname}:${port}/control`);
    console.log(`> Overlay: http://${hostname}:${port}/overlay/{boardId}`);
  });
});
