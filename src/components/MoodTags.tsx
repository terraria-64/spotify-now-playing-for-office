"use client";

import { useState, useEffect } from "react";

// ムードタグのプリセット定義
const MOOD_TAGS = [
  { label: "JAZZY",       tag: "jazzy" },
  { label: "SOULFUL",     tag: "soulful" },
  { label: "BOOM BAP",    tag: "boom bap" },
  { label: "FUNKY",       tag: "funky" },
  { label: "NEO SOUL",    tag: "neo soul" },
  { label: "J-INDIE",     tag: "japanese indie" },
  { label: "LO-FI",       tag: "lo-fi" },
  { label: "CHILLHOP",    tag: "chillhop" },
  { label: "R&B",         tag: "r&b" },
  { label: "HOUSE",       tag: "house" },
  { label: "TECHNO",      tag: "techno" },
  { label: "AMBIENT",     tag: "ambient" },
  { label: "INDIE ROCK",  tag: "indie rock" },
  { label: "HIP HOP",     tag: "hip hop" },
  { label: "BOSSA NOVA",  tag: "bossa nova" },
  { label: "REGGAE",      tag: "reggae" },
  { label: "DRUM & BASS", tag: "drum and bass" },
  { label: "FOLK",        tag: "folk" },
  { label: "PUNK",        tag: "punk" },
  { label: "VAPORWAVE",   tag: "vaporwave" },
];

interface MoodTagsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoodTags({ isOpen, onClose }: MoodTagsProps) {
  // モーダルの表示アニメーション状態
  const [isVisible, setIsVisible] = useState(false);
  const [loadingTag, setLoadingTag] = useState<string | null>(null);
  const [successTag, setSuccessTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // isOpen が true になったらアニメーション開始
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [isOpen]);

  // アニメーションしながら閉じる
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 280);
  };

  const play = async (label: string, tag: string) => {
    setLoadingTag(label);
    setError(null);

    try {
      const res = await fetch("/api/play-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });
      const json = await res.json() as { success?: boolean; artist?: string; error?: string };

      if (res.ok && json.success) {
        setLoadingTag(null);
        setSuccessTag(label);
        // 成功アニメーションを見せてからモーダルを閉じる
        setTimeout(() => handleClose(), 700);
      } else {
        setLoadingTag(null);
        setError(json.error ?? "エラーが発生しました");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setLoadingTag(null);
      setError("ネットワークエラー");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    // バックドロップ
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center pb-10 px-4 transition-all duration-300 ${
        isVisible ? "bg-black/70 backdrop-blur-sm" : "bg-transparent backdrop-blur-none"
      }`}
      onClick={handleClose}
    >
      {/* モーダルパネル（下から滑り上がる） */}
      <div
        className={`w-full max-w-sm bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-5 transition-all duration-300 ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-6 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Cast Your Mood
          </h3>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* タググリッド */}
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map(({ label, tag }) => {
            const isLoading = loadingTag === label;
            const isSuccess = successTag === label;

            return (
              <button
                key={tag}
                onClick={() => play(label, tag)}
                disabled={loadingTag !== null}
                style={isSuccess ? { boxShadow: "0 0 20px rgba(34, 197, 94, 0.7)" } : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide
                  transition-all duration-200 disabled:cursor-not-allowed active:scale-95 ${
                  isSuccess
                    ? "bg-green-500 text-black scale-110"
                    : isLoading
                    ? "bg-zinc-700 text-zinc-400"
                    : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600"
                }`}
              >
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : isSuccess ? (
                  // 成功チェックアイコン
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  // ダイヤ型アイコン
                  <svg className="w-2.5 h-2.5 opacity-40" fill="currentColor" viewBox="0 0 10 10">
                    <polygon points="5,0 10,5 5,10 0,5" />
                  </svg>
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
