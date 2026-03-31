"use client";

import { useState, useEffect, useCallback } from "react";
import type { SpotifyTrack } from "@/types/spotify";
import SearchResults from "./SearchResults";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setTracks([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json() as { tracks?: SpotifyTrack[] };
        setTracks(data.tracks ?? []);
      }
    } catch {
      // ネットワークエラーは無視
    } finally {
      setLoading(false);
    }
  }, []);

  // 入力後300msのデバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="flex flex-col gap-2">
      {/* 検索インプット */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="曲名やアーティスト名で検索..."
          className="w-full pl-10 pr-4 py-3 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl
            border border-zinc-700 focus:outline-none focus:border-green-500 transition-colors text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setTracks([]);
            }}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 検索結果 */}
      {tracks.length > 0 && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 px-2 py-1 max-h-96 overflow-y-auto">
          <SearchResults tracks={tracks} />
        </div>
      )}
    </div>
  );
}
