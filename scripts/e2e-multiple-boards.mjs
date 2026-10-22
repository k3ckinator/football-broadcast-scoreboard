/**
 * End-to-end check: scoreboard-auth + football-broadcast-scoreboard (remote boards).
 * Run with auth on :4000 and app on :3000 (AUTH_API_URL set).
 */
import { io } from "socket.io-client";

const APP = process.env.E2E_APP_URL ?? "http://localhost:3000";
const AUTH = process.env.E2E_AUTH_URL ?? "http://localhost:4000";
const SERVICE_KEY = process.env.SCOREBOARD_SERVICE_KEY?.trim() ?? "";

let cookieJar = "";

function mergeCookies(setCookies) {
  if (!setCookies?.length) return;
  const map = new Map(
    cookieJar
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf("=");
        return [p.slice(0, i), p.slice(i + 1)];
      }),
  );
  for (const raw of setCookies) {
    const part = raw.split(";")[0];
    const i = part.indexOf("=");
    map.set(part.slice(0, i), part.slice(i + 1));
  }
  cookieJar = [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function appFetch(path, init = {}) {
  const headers = new Headers(init.headers ?? {});
  if (cookieJar) headers.set("Cookie", cookieJar);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${APP}${path}`, { ...init, headers });
  mergeCookies(typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : []);
  return res;
}

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("OK:", msg);
}

async function main() {
  const health = await fetch(`${AUTH}/health`);
  if (!health.ok) fail(`auth health ${health.status}`);
  ok("auth /health");

  const statusRes = await fetch(`${APP}/api/auth/status`);
  const status = await statusRes.json();
  if (!status.authEnabled || status.mode !== "accounts") {
    fail(`expected accounts auth, got ${JSON.stringify(status)}`);
  }
  ok("app auth mode accounts");

  const email = `e2e-${Date.now()}@example.com`;
  const password = "e2e-secret-12";

  const reg = await appFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      displayName: "E2E User",
    }),
  });
  if (!reg.ok) {
    const err = await reg.text();
    fail(`register ${reg.status}: ${err}`);
  }
  ok("register via app");

  const listRes = await appFetch("/api/boards");
  if (!listRes.ok) fail(`GET /api/boards ${listRes.status}`);
  const list = await listRes.json();
  if (!Array.isArray(list.boards)) fail("boards list shape");
  ok(`boards list (${list.boards.length} boards)`);

  const createRes = await appFetch("/api/boards", {
    method: "POST",
    body: JSON.stringify({ name: "E2E Board" }),
  });
  if (createRes.status !== 201) {
    fail(`POST /api/boards ${createRes.status}: ${await createRes.text()}`);
  }
  const created = await createRes.json();
  const boardId = created.board?.id;
  if (!boardId) fail("no board id");
  ok(`created board ${boardId}`);

  const publicBoard = await fetch(`${AUTH}/boards/${boardId}`);
  if (!publicBoard.ok) fail(`auth GET board ${publicBoard.status}`);
  const pub = await publicBoard.json();
  const homeScoreBefore = pub.board?.state?.home?.score ?? 0;
  ok("public GET board on auth");

  const socket = io(APP, {
    transports: ["polling"],
    reconnection: false,
    timeout: 15_000,
  });

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("socket connect timeout")), 15_000);
    socket.on("connect", () => {
      clearTimeout(t);
      resolve();
    });
    socket.on("connect_error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
  ok("socket connected");

  const fullState = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("state:full timeout")), 10_000);
    socket.once("state:full", (state) => {
      clearTimeout(t);
      resolve(state);
    });
    socket.emit("board:join", boardId);
  });
  if (fullState?.home?.score !== homeScoreBefore) {
    fail(`unexpected initial score ${fullState?.home?.score}`);
  }
  ok("socket board:join + state:full");

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("score patch timeout")), 10_000);
    socket.once("state:full", (state) => {
      clearTimeout(t);
      resolve(state);
    });
    socket.emit("score:delta", { teamId: "home", delta: 3 });
  });
  ok("socket score:delta (+3 home)");

  socket.close();

  if (!SERVICE_KEY) {
    console.warn(
      "WARN: SCOREBOARD_SERVICE_KEY not set — skipping persist check (set in app + auth env)",
    );
    console.log("\nE2E partial success (live socket only).");
    return;
  }

  await new Promise((r) => setTimeout(r, 800));

  const after = await fetch(`${AUTH}/boards/${boardId}`);
  const afterJson = await after.json();
  const homeAfter = afterJson.board?.state?.home?.score;
  const expected = homeScoreBefore + 3;
  if (homeAfter !== expected) {
    fail(`persist expected home ${expected}, got ${homeAfter}`);
  }
  ok(`persist to auth (home score ${homeAfter})`);

  const rename = await appFetch(`/api/boards/${boardId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: "E2E Renamed" }),
  });
  if (!rename.ok) fail(`rename ${rename.status}`);
  ok("rename via app API");

  const del = await appFetch(`/api/boards/${boardId}`, { method: "DELETE" });
  if (!del.ok) fail(`delete ${del.status}`);
  ok("delete board");

  const gone = await fetch(`${AUTH}/boards/${boardId}`);
  if (gone.status !== 404) fail(`board should 404, got ${gone.status}`);
  ok("board removed on auth");

  console.log("\nE2E passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
