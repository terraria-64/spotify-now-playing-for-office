"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { SpotifyTrack, NowPlayingResponse } from "@/types/spotify";

// キューへの追加状態を管理する型
type QueueStatus = "idle" | "loading" | "success" | "error";

export default function Recommendations() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState<Record<string, QueueStatus>>({});
  // 最後に取得したトラックIDを保持し、曲が変わったときだけ再取得する
  const lastTrackIdRef = useRef<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      const npRes = await fetch("/api/now-playing");
      if (!npRes.ok) return;

      const np = await npRes.json() as NowPlayingResponse;
      if (!np.isPlaying || !np.track) return;

      // 同じ曲が再生中なら再取得しない
      if (np.track.id === lastTrackIdRef.current) return;
      lastTrackIdRef.current = np.track.id;

      const artistId = np.track.artists[0]?.id;
      if (!artistId) return;

      const params = new URLSearchParams({ artistId });
      const recRes = await fetch(`/api/recommendations?${params}`);
      if (!recRes.ok) return;

      const data = await recRes.json() as { tracks: SpotifyTrack[] };
      setTracks(data.tracks);
    } catch {
      // ネットワークエラーは無視
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
    // 15秒ごとに曲の変化を確認
    const interval = setInterval(fetchRecommendations, 15000);
    return () => clearInterval(interval);
  }, [fetchRecommendations]);

  // キューに追加する
  const addToQueue = async (track: SpotifyTrack) => {
    setStatusMap((prev) => ({ ...prev, [track.id]: "loading" }));
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: track.uri }),
      });
      const next = res.ok ? "success" : "error";
      setStatusMap((prev) => ({ ...prev, [track.id]: next }));
      setTimeout(() => {
        setStatusMap((prev) => ({ ...prev, [track.id]: "idle" }));
      }, 2000);
    } catch {
      setStatusMap((prev) => ({ ...prev, [track.id]: "error" }));
      setTimeout(() => {
        setStatusMap((prev) => ({ ...prev, [track.id]: "idle" }));
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
                disabled:cursor-not-allowed hover:bg-zinc-700 active:scale-95"
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
