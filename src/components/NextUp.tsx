"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { SpotifyTrack } from "@/types/spotify";

// キュー先頭の曲を3秒ごとにポーリングして表示する
export default function NextUp() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    const fetchNextUp = async () => {
      try {
        const res = await fetch("/api/queue");
        if (!res.ok) return;
        const data = await res.json() as { nextTrack: SpotifyTrack | null };
        setTrack(data.nextTrack);
      } catch {
        // エラー時は何も表示しない
      }
    };

    fetchNextUp();
    const interval = setInterval(fetchNextUp, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!track) return null;

  const artwork = track.album.images[1]?.url ?? track.album.images[0]?.url;
  const artists = track.artists.map((a) => a.name).join(", ");

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Next Up
      </h2>
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 flex items-center gap-4">
        {/* アートワーク */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-700">
          {artwork && (
            <Image
              src={artwork}
              alt={track.album.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          )}
        </div>

        {/* 曲情報 */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{track.name}</p>
          <p className="text-zinc-400 text-xs truncate">{artists}</p>
        </div>
      </div>
    </section>
  );
}
