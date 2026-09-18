"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "connecting" | "waiting" | "flashed" | "results";

interface RoundResult {
  name: string;
  ms: number;
}

interface LeaderboardEntry {
  name: string;
  wins: number;
}

export function Game() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastResults, setLastResults] = useState<{
    results: RoundResult[];
    winner: string | null;
  } | null>(null);
  const [falseStart, setFalseStart] = useState(false);
  const [myName, setMyName] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("reaction-game-name");
    if (saved) setName(saved);
  }, []);

  useEffect(() => {
    if (!joined) return;

    let cancelled = false;
    let ws: WebSocket;

    const connect = () => {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(
        `${proto}://${window.location.host}/game/ws?name=${encodeURIComponent(myName)}`,
      );
      wsRef.current = ws;

      ws.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "hello") {
          setPhase(data.phase);
          setLeaderboard(data.leaderboard);
        } else if (data.type === "waiting") {
          setPhase("waiting");
          setLastResults(null);
        } else if (data.type === "flash") {
          setPhase("flashed");
        } else if (data.type === "results") {
          setPhase("results");
          setLastResults({ results: data.results, winner: data.winner });
          setLeaderboard(data.leaderboard);
        } else if (data.type === "falseStart") {
          setFalseStart(true);
          setTimeout(() => setFalseStart(false), 800);
        }
      });

      ws.addEventListener("close", () => {
        if (!cancelled) setTimeout(connect, 1000);
      });
    };

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [joined, myName]);

  const click = () => {
    wsRef.current?.send(JSON.stringify({ type: "click" }));
  };

  const join = () => {
    const trimmed = name.trim() || `Player${Math.floor(Math.random() * 1000)}`;
    window.localStorage.setItem("reaction-game-name", trimmed);
    setMyName(trimmed);
    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="joinScreen">
        <p className="eyebrow">RedwoodSDK on celld</p>
        <h1 className="title">Reaction</h1>
        <p className="subtitle">
          A light flashes at the exact same instant for everyone here right
          now — the moment is timed by a Durable Object alarm running on a
          self-hosted celld node, not your browser's clock. First click
          after the flash wins the round.
        </p>
        <input
          className="input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          maxLength={24}
        />
        <button className="button" onClick={join}>
          Join the game
        </button>
      </div>
    );
  }

  return (
    <div className="gameLayout">
      <button
        className={`arena arena-${falseStart ? "falseStart" : phase}`}
        onClick={click}
        disabled={phase === "connecting" || phase === "results"}
      >
        {falseStart && <span className="arenaText">Too soon!</span>}
        {!falseStart && phase === "connecting" && (
          <span className="arenaText">Connecting…</span>
        )}
        {!falseStart && phase === "waiting" && (
          <span className="arenaText">Get ready…</span>
        )}
        {!falseStart && phase === "flashed" && (
          <span className="arenaText">CLICK!</span>
        )}
        {!falseStart && phase === "results" && lastResults && (
          <div className="resultsBox">
            <span className="arenaText">
              {lastResults.winner ? `${lastResults.winner} wins!` : "No one clicked"}
            </span>
            <ol className="resultsList">
              {lastResults.results.slice(0, 5).map((r, i) => (
                <li key={i}>
                  {r.name} — {r.ms}ms
                </li>
              ))}
            </ol>
          </div>
        )}
      </button>

      <aside className="leaderboard">
        <h2 className="leaderboardTitle">Leaderboard</h2>
        <ol className="leaderboardList">
          {leaderboard.length === 0 && (
            <li className="empty">No wins yet — be first.</li>
          )}
          {leaderboard.map((entry, i) => (
            <li key={i} className={entry.name === myName ? "me" : undefined}>
              <span>{entry.name}</span>
              <span>{entry.wins}</span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
