"use client";

import { useState, useEffect } from "react";
import NowPlaying from "@/components/NowPlaying";
import SearchBar from "@/components/SearchBar";
import NextUp from "@/components/NextUp";

// 色未取得時のデフォルト背景色
const DEFAULT_COLORS = ["#1a0a2e", "#0a1a2e", "#0a2010"];

// ログイン不要のメインページ（アクセス制御はMiddlewareで実施）
export default function HomePage() {
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  // アクセス開放状態（nullは未取得）
  const [accessOpen, setAccessOpen] = useState<boolean | null>(null);

  // アクセス状態を取得する
  useEffect(() => {
    fetch("/api/access")
      .then((res) => res.json() as Promise<{ open: boolean }>)
      .then((data) => setAccessOpen(data.open))
      .catch(() => setAccessOpen(true));
  }, []);

  return (
    <main className="relative min-h-screen text-white">
      {/* アートワーク色を使った動的背景 */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-zinc-950">
        <div
          className="blob-1 absolute rounded-full"
          style={{
            width: "80vw",
            height: "80vw",
            top: "-30vw",
            left: "-20vw",
            background: `radial-gradient(circle, ${colors[0] ?? DEFAULT_COLORS[0]} 0%, transparent 70%)`,
            filter: "blur(48px)",
            opacity: 0.55,
            transition: "background 2.5s ease",
          }}
        />
        <div
          className="blob-2 absolute rounded-full"
          style={{
            width: "70vw",
            height: "70vw",
            bottom: "-20vw",
            right: "-15vw",
            background: `radial-gradient(circle, ${colors[1] ?? DEFAULT_COLORS[1]} 0%, transparent 70%)`,
            filter: "blur(48px)",
            opacity: 0.5,
            transition: "background 2.5s ease",
          }}
        />
        <div
          className="blob-3 absolute rounded-full"
          style={{
            width: "55vw",
            height: "55vw",
            top: "45%",
            left: "25%",
            background: `radial-gradient(circle, ${colors[2] ?? DEFAULT_COLORS[2]} 0%, transparent 70%)`,
            filter: "blur(64px)",
            opacity: 0.4,
            transition: "background 2.5s ease",
          }}
        />
      </div>

      <div className="max-w-sm mx-auto px-4 pt-12 pb-16 flex flex-col gap-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-2">
          <svg
            className="w-6 h-6 text-green-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <span className="font-semibold text-sm text-zinc-300 uppercase tracking-wider">
            Now Spinning
          </span>
        </div>

        {/* 再生中の曲 */}
        <section className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/60">
          <NowPlaying onColorsChange={setColors} />
        </section>

        {/* 次の曲 */}
        <NextUp />

        {/* 曲検索 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            CALL YOUR SHOT
          </h2>
          {accessOpen === false ? (
            <div className="w-full py-4 px-4 bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-zinc-800/60 text-center text-zinc-500 text-sm">
              現在リクエストは受け付けていません
            </div>
          ) : (
            <SearchBar />
          )}
        </section>
      </div>
    </main>
  );
}
