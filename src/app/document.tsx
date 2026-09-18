export const Document: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Reaction — RedwoodSDK on celld</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=optional"
        precedence="first"
      />
      <link rel="modulepreload" href="/src/client.tsx" />
      <style>{`
        :root {
          --bg: #15130f;
          --panel: #1f1c17;
          --line: #34302a;
          --ink: #f4eedf;
          --ink-soft: #a89f8f;
          --orange: #f47238;
          --orange-light: #ffad48;
          --green: #3ec46d;
          --red: #e0503a;
          --font-playfair: "Playfair Display", serif;
          --font-noto: "Noto Sans", sans-serif;
        }
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body { background: var(--bg); margin: 0; padding: 0; font-family: var(--font-noto); color: var(--ink); }

        .joinScreen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem 1.5rem;
          gap: 1rem;
          max-width: 480px;
          margin: 0 auto;
        }
        .eyebrow { font-size: 0.85rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--orange); font-weight: 700; margin: 0; }
        .title { font-family: var(--font-playfair); font-size: 3.5rem; margin: 0; }
        .subtitle { color: var(--ink-soft); font-size: 1.05rem; line-height: 1.5; margin: 0 0 1rem; }
        .input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--ink);
          font-size: 1rem;
          font-family: var(--font-noto);
        }
        .input:focus { outline: 2px solid var(--orange-light); outline-offset: 1px; }
        .button {
          background: var(--orange);
          color: #1a1a1a;
          border: none;
          border-radius: 8px;
          padding: 0.85rem 1.5rem;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
        }
        .button:hover { background: var(--orange-light); }

        .gameLayout {
          display: flex;
          min-height: 100vh;
          gap: 0;
        }
        @media (max-width: 800px) {
          .gameLayout { flex-direction: column; }
        }

        .arena {
          flex: 1;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-playfair);
          font-size: 3rem;
          font-weight: bold;
          color: var(--ink);
          cursor: pointer;
          transition: background-color 80ms ease-out;
          padding: 2rem;
        }
        .arena:disabled { cursor: default; }
        .arena-connecting, .arena-waiting { background: var(--panel); }
        .arena-flashed { background: var(--green); color: #0e2415; }
        .arena-falseStart { background: var(--red); color: #2a0a05; }
        .arena-results { background: var(--panel); }

        .arenaText { text-align: center; }

        .resultsBox { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .resultsList {
          list-style: decimal;
          text-align: left;
          font-family: var(--font-noto);
          font-size: 1.1rem;
          font-weight: 400;
          color: var(--ink-soft);
          font-variant-numeric: tabular-nums;
        }

        .leaderboard {
          width: 280px;
          flex-shrink: 0;
          background: var(--panel);
          border-left: 1px solid var(--line);
          padding: 2rem 1.5rem;
        }
        @media (max-width: 800px) {
          .leaderboard { width: auto; border-left: none; border-top: 1px solid var(--line); }
        }
        .leaderboardTitle { font-family: var(--font-playfair); font-size: 1.4rem; margin: 0 0 1rem; }
        .leaderboardList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .leaderboardList li { display: flex; justify-content: space-between; font-size: 1rem; padding: 0.4rem 0; border-bottom: 1px solid var(--line); font-variant-numeric: tabular-nums; }
        .leaderboardList li.me { color: var(--orange-light); font-weight: 700; }
        .empty { color: var(--ink-soft); font-style: italic; border-bottom: none !important; }
      `}</style>
    </head>
    <body>
      {children}
      <script>import("/src/client.tsx")</script>
    </body>
  </html>
);
