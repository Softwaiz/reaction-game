import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { DurableObject, env } from "cloudflare:workers";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

export type AppContext = {};

type Phase = "waiting" | "flashed" | "results";

interface RoundResult {
  name: string;
  ms: number;
}

interface LeaderboardEntry {
  name: string;
  wins: number;
}

const WAIT_MIN_MS = 2000;
const WAIT_MAX_MS = 6000;
const ROUND_TIMEOUT_MS = 5000;
const CLICK_GRACE_MS = 300;
const RESULTS_PAUSE_MS = 4000;

export class GameRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }

    const url = new URL(request.url);
    const name = (url.searchParams.get("name") || "Anonymous").slice(0, 24);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ name });

    const phase = (await this.ctx.storage.get<Phase>("phase")) ?? "waiting";
    server.send(
      JSON.stringify({
        type: "hello",
        phase,
        leaderboard: await this.leaderboard(),
      }),
    );

    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.scheduleNextRound();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    let data: { type?: string };
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }
    if (data.type !== "click") return;

    const phase = (await this.ctx.storage.get<Phase>("phase")) ?? "waiting";
    const attachment = ws.deserializeAttachment() as { name: string } | null;
    const name = attachment?.name ?? "Anonymous";

    if (phase !== "flashed") {
      if (phase === "waiting") {
        ws.send(JSON.stringify({ type: "falseStart" }));
      }
      return;
    }

    const clicks = (await this.ctx.storage.get<RoundResult[]>("clicks")) ?? [];
    if (clicks.some((c) => c.name === name)) return;

    const flashTime = (await this.ctx.storage.get<number>("flashTime")) ?? Date.now();
    clicks.push({ name, ms: Date.now() - flashTime });
    await this.ctx.storage.put("clicks", clicks);

    if (clicks.length === 1) {
      await this.ctx.storage.setAlarm(Date.now() + CLICK_GRACE_MS);
    }
  }

  async alarm() {
    const phase = (await this.ctx.storage.get<Phase>("phase")) ?? "waiting";

    if (phase === "waiting") {
      const flashTime = Date.now();
      await this.ctx.storage.put<Phase>("phase", "flashed");
      await this.ctx.storage.put("flashTime", flashTime);
      await this.ctx.storage.put("clicks", []);
      this.broadcast({ type: "flash", serverTime: flashTime });
      await this.ctx.storage.setAlarm(Date.now() + ROUND_TIMEOUT_MS);
      return;
    }

    if (phase === "flashed") {
      const clicks = (await this.ctx.storage.get<RoundResult[]>("clicks")) ?? [];
      clicks.sort((a, b) => a.ms - b.ms);
      const winner = clicks[0]?.name ?? null;

      if (winner) {
        const leaderboard =
          (await this.ctx.storage.get<Record<string, number>>("wins")) ?? {};
        leaderboard[winner] = (leaderboard[winner] ?? 0) + 1;
        await this.ctx.storage.put("wins", leaderboard);
      }

      await this.ctx.storage.put<Phase>("phase", "results");
      this.broadcast({
        type: "results",
        results: clicks,
        winner,
        leaderboard: await this.leaderboard(),
      });
      await this.ctx.storage.setAlarm(Date.now() + RESULTS_PAUSE_MS);
      return;
    }

    await this.scheduleNextRound();
  }

  private async scheduleNextRound() {
    await this.ctx.storage.put<Phase>("phase", "waiting");
    this.broadcast({ type: "waiting" });
    const delay = WAIT_MIN_MS + Math.random() * (WAIT_MAX_MS - WAIT_MIN_MS);
    await this.ctx.storage.setAlarm(Date.now() + delay);
  }

  private async leaderboard(): Promise<LeaderboardEntry[]> {
    const wins = (await this.ctx.storage.get<Record<string, number>>("wins")) ?? {};
    return Object.entries(wins)
      .map(([name, wins]) => ({ name, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);
  }

  private broadcast(data: unknown) {
    const message = JSON.stringify(data);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(message);
      } catch {
        // socket is gone; hibernation API will drop it
      }
    }
  }
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  route("/game/ws", async ({ request }) => {
    const id = env.GAME.idFromName("global");
    return env.GAME.get(id).fetch(request);
  }),
  render(Document, [route("/", Home)]),
]);
