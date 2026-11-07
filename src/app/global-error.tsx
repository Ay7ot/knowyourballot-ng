"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en-NG">
      <body style={{ margin: 0, background: "#eef1ec", color: "#12171a", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 16px" }}>
          <p
            style={{
              color: "#0b6a46",
              fontSize: 12,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ fontSize: 32, margin: "8px 0" }}>This page didn&apos;t load</h1>
          <p style={{ color: "#56615c" }}>Try again, or go back to the home page.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "8px 16px",
              borderRadius: 999,
              background: "#12171a",
              color: "#fff",
              border: 0,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
