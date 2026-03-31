"use client";

import { useState } from "react";
import Image from "next/image";
import type { SpotifyTrack } from "@/types/spotify";

interface SearchResultsProps {
  tracks: SpotifyTrack[];
}

// キューへの追加状態を管理する型
type QueueStatus = "idle" | "loading" | "success" | "error";

export default function SearchResults({ tracks }: SearchResultsProps) {
  // 各トラックのキュー追加状態を管理
  const [statusMap, setStatusMap] = useState<Record<string, QueueStatus>>({});

  const addToQueue = async (track: SpotifyTrack) => {
    setStatusMap((prev) => ({ ...prev, [track.id]: "loading" }));

    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: track.uri }),
      });

      if (res.ok) {
        setStatusMap((prev) => ({ ...prev, [track.id]: "success" }));
        // 2秒後に状態をリセット
        setTimeout(() => {
          setStatusMap((prev) => ({ ...prev, [track.id]: "idle" }));
        }, 2000);
      } else {
        setStatusMap((prev) => ({ ...prev, [track.id]: "error" }));
        setTimeout(() => {
          setStatusMap((prev) => ({ ...prev, [track.id]: "idle" }));
        }, 2000);
      }
    } catch {
      setStatusMap((prev) => ({ ...prev, [track.id]: "error" }));
      setTimeout(() => {
        setStatusMap((prev) => ({ ...prev, [track.id]: "idle" }));
      }, 2000);
    }
  };

  if (tracks.length === 0) return null;

  return (
    <ul className="divide-y divide-zinc-800">
      {tracks.map((track) => {
        const artwork = track.album.images[2]?.url ?? track.album.images[0]?.url;
        const artists = track.artists.map((a) => a.name).join(", ");
        const status = statusMap[track.id] ?? "idle";

        return (
          <li
            key={track.id}
            className="flex items-center gap-3 py-2.5 px-1 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            {/* アートワーク */}
            <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-700">
              {artwork && (
                <Image
                  src={artwork}
                  alt={track.album.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              )}
            </div>

            {/* 曲情報 */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{track.name}</p>
              <p className="text-zinc-400 text-xs truncate">{artists}</p>
            </div>

            {/* キュー追加ボタン */}
            <button
              onClick={() => addToQueue(track)}
              disabled={status === "loading" || status === "success"}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all
                disabled:cursor-not-allowed
                hover:bg-zinc-700 active:scale-95"
              title="キューに追加"
            >
              {status === "loading" && (
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              )}
              {status === "success" && (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {status === "error" && (
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {status === "idle" && (
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
