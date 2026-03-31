"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import type { NowPlayingResponse } from "@/types/spotify";

// 音量プリセットの定義
const VOLUME_PRESETS = [
  { label: "Low", value: 45 },
  { label: "Med", value: 65 },
  { label: "High", value: 75 },
] as const;

// 再生時間をmm:ss形式にフォーマットする
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function NowPlaying() {
  const [data, setData] = useState<NowPlayingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // 現在選択中の音量プリセット値
  const [activeVolume, setActiveVolume] = useState<number | null>(null);

  // 音量を設定する
  const setVolume = useCallback(async (volume: number) => {
    try {
      await fetch("/api/volume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume }),
      });
      setActiveVolume(volume);
    } catch {
      // ネットワークエラーは無視
    }
  }, []);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch("/api/now-playing");
      if (res.ok) {
        const json = await res.json() as NowPlayingResponse;
        setData(json);
      }
    } catch {
      // ネットワークエラーは無視
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    // 3秒ごとにポーリング
    const interval = setInterval(fetchNowPlaying, 3000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.isPlaying || !data.track) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
        <svg className="w-16 h-16 mb-3 opacity-30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
        </svg>
        <p className="text-sm">再生中の曲はありません</p>
      </div>
    );
  }

  const { track, progress_ms } = data;
  const artwork = track.album.images[0]?.url;
  const progressPercent = progress_ms
    ? (progress_ms / track.duration_ms) * 100
    : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* アートワーク */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {artwork ? (
          <Image
            src={artwork}
            alt={track.album.name}
            fill
            className="object-cover"
            sizes="256px"
            priority
          />
        ) : (
          <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
            <svg className="w-16 h-16 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 14a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* 曲情報 */}
      <div className="text-center">
        <p className="text-white text-xl font-bold leading-tight">{track.name}</p>
        <p className="text-zinc-400 text-sm mt-1">
          {track.artists.map((artist, i) => (
            <span key={artist.id}>
              {i > 0 && ", "}
              <a
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline transition-colors"
              >
                {artist.name}
              </a>
            </span>
          ))}
        </p>
        <p className="text-zinc-500 text-xs mt-0.5">
          <a
            href={track.album.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white hover:underline transition-colors"
          >
            {track.album.name}
          </a>
        </p>
      </div>

      {/* プログレスバー */}
      {progress_ms !== undefined && (
        <div className="w-full max-w-xs">
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>{formatDuration(progress_ms)}</span>
            <span>{formatDuration(track.duration_ms)}</span>
          </div>
        </div>
      )}

      {/* 音量調節ボタン */}
      <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
      </div>
      <div className="flex gap-2">
        {VOLUME_PRESETS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setVolume(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeVolume === value
                ? "bg-green-500 text-black"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
