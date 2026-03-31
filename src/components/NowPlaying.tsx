"use client";

import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import type { NowPlayingResponse } from "@/types/spotify";
import MoodTags from "./MoodTags";

// アートワーク画像から3色をCanvasでサンプリングする
function extractColors(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve([]); return; }
      ctx.drawImage(img, 0, 0, 50, 50);
      // 左上・右上・下中央の3点をサンプリング
      const points: [number, number][] = [[8, 8], [42, 8], [25, 42]];
      const colors = points.map(([x, y]) => {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return `rgb(${d[0]},${d[1]},${d[2]})`;
      });
      resolve(colors);
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

// 音量プリセットの定義
const VOLUME_PRESETS: { label: string; value: number; icon: ReactNode }[] = [
  {
    label: "Chill",
    value: 45,
    // 月アイコン（静かな雰囲気）
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    label: "Vibe",
    value: 65,
    // 音符アイコン（ノリノリ）
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
        <circle cx="18" cy="16" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Bang",
    value: 75,
    // 雷アイコン（爆音）
    icon: (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

// 再生時間をmm:ss形式にフォーマットする
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface NowPlayingProps {
  onColorsChange?: (colors: string[]) => void;
  accessOpen?: boolean | null;
}

// 類似アーティスト再生の状態
type SimilarStatus = "idle" | "loading" | "success" | "error";

export default function NowPlaying({ onColorsChange, accessOpen }: NowPlayingProps) {
  const [data, setData] = useState<NowPlayingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // 現在選択中の音量プリセット値
  const [activeVolume, setActiveVolume] = useState<number | null>(null);
  // 類似アーティスト再生の状態と結果メッセージ
  const [similarStatus, setSimilarStatus] = useState<SimilarStatus>("idle");
  const [similarMessage, setSimilarMessage] = useState("");
  // WHAT'S THE VIBE? パネルの開閉状態
  const [isVibeOpen, setIsVibeOpen] = useState(false);
  // シェアボタンのフィードバック状態
  const [shared, setShared] = useState(false);

  // マウント時に現在の音量を取得して最も近いプリセットをハイライトする
  useEffect(() => {
    if (accessOpen === false) return;
    fetch("/api/volume")
      .then((res) => res.json() as Promise<{ volume: number | null }>)
      .then(({ volume }) => {
        if (volume === null) return;
        const closest = VOLUME_PRESETS.reduce((prev, curr) =>
          Math.abs(curr.value - volume) < Math.abs(prev.value - volume) ? curr : prev
        );
        setActiveVolume(closest.value);
      })
      .catch(() => {});
  }, [accessOpen]);

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

  // 類似アーティストの曲を再生する
  const playSimilar = useCallback(async (artistName: string) => {
    setSimilarStatus("loading");
    setSimilarMessage("");
    try {
      const res = await fetch("/api/play-similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName }),
      });
      const json = await res.json() as { success?: boolean; artist?: string; error?: string };
      if (res.ok && json.success) {
        setSimilarStatus("success");
        setSimilarMessage(json.artist ?? "");
        setTimeout(() => setSimilarStatus("idle"), 4000);
      } else {
        setSimilarStatus("error");
        setSimilarMessage(json.error ?? "エラーが発生しました");
        setTimeout(() => setSimilarStatus("idle"), 3000);
      }
    } catch {
      setSimilarStatus("error");
      setSimilarMessage("ネットワークエラー");
      setTimeout(() => setSimilarStatus("idle"), 3000);
    }
  }, []);

  // 曲のSpotifyリンクをシェアまたはクリップボードにコピーする
  const handleShare = useCallback(async () => {
    if (!data?.track) return;
    const url = `https://open.spotify.com/track/${data.track.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: data.track.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // キャンセルや失敗は無視
    }
  }, [data?.track]);

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
    // accessOpen === false の場合はSpotifyへのリクエストを送らない
    if (accessOpen === false) {
      setLoading(false);
      return;
    }
    fetchNowPlaying();
    // 12秒ごとにポーリング
    const interval = setInterval(fetchNowPlaying, 12000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying, accessOpen]);

  // アートワーク変化時に背景色を抽出して親に通知
  const artwork = data?.track?.album.images[0]?.url;
  useEffect(() => {
    if (!artwork || !onColorsChange) return;
    extractColors(artwork).then((colors) => {
      if (colors.length > 0) onColorsChange(colors);
    });
  }, [artwork, onColorsChange]);

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
  const progressPercent = progress_ms
    ? (progress_ms / track.duration_ms) * 100
    : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* アートワーク */}
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
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
        {/* シェアボタン */}
        <button
          onClick={handleShare}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/60 transition-all active:scale-90"
        >
          {shared ? (
            // コピー完了チェックアイコン
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            // シェアアイコン
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          )}
        </button>
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

      {/* 類似アーティスト再生ボタン */}
      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <button
          onClick={() => playSimilar(track.artists[0].name)}
          disabled={similarStatus === "loading"}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all ${
            similarStatus === "success"
              ? "bg-green-500/20 border border-green-500/40 text-green-400"
              : similarStatus === "error"
              ? "bg-red-500/20 border border-red-500/40 text-red-400"
              : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 active:scale-95"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {similarStatus === "loading" ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            // シャッフル矢印アイコン
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6" />
            </svg>
          )}
          <span>
            {similarStatus === "success"
              ? similarMessage
              : similarStatus === "error"
              ? similarMessage
              : "FLIP IT"}
          </span>
        </button>

        {/* WHAT'S THE VIBE? トグル */}
        <button
          onClick={() => setIsVibeOpen(true)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 6 10">
            <path d="M0 0l6 5-6 5V0z" />
          </svg>
          CAST YOUR MOOD
        </button>
      </div>

      {/* ムードタグモーダル */}
      <MoodTags isOpen={isVibeOpen} onClose={() => setIsVibeOpen(false)} />

      {/* 音量調節ボタン */}
      <div className="flex flex-col items-center gap-2">
      {/* 左が小音量・右が大音量を示すバーアイコン */}
      <svg className="w-8 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 32 16">
        <rect x="0" y="10" width="6" height="6" rx="1" />
        <rect x="13" y="5" width="6" height="11" rx="1" />
        <rect x="26" y="0" width="6" height="16" rx="1" />
      </svg>
      <div className="flex gap-2">
        {VOLUME_PRESETS.map(({ label, value, icon }) => (
          <button
            key={value}
            onClick={() => setVolume(value)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeVolume === value
                ? "bg-green-500 text-black"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
