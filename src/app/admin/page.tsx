"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);

  // パスワードで認証して現在の状態を取得
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/toggle?password=${encodeURIComponent(password)}`);
      const data = await res.json() as { error?: string; open?: boolean };

      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }

      setIsOpen(data.open ?? null);
      setAuthed(true);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // アクセス状態を切り替える
  const handleToggle = async (next: boolean) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, open: next }),
      });
      const data = await res.json() as { error?: string; open?: boolean };

      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }

      setIsOpen(data.open ?? null);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="w-full max-w-sm px-4 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <h1 className="font-semibold text-sm text-zinc-300">管理者パネル</h1>
        </div>

        {!authed ? (
          // パスワード入力フォーム
          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理者パスワード"
              className="w-full px-4 py-3 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl
                border border-zinc-700 focus:outline-none focus:border-green-500 transition-colors text-sm"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50
                text-black font-semibold rounded-xl transition-colors"
            >
              {loading ? "確認中..." : "ログイン"}
            </button>
          </form>
        ) : (
          // トグルUI
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 flex flex-col gap-6">
            {/* 現在の状態表示 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">アクセス状態</span>
              <span className={`text-sm font-semibold ${isOpen ? "text-green-400" : "text-red-400"}`}>
                {isOpen ? "公開中" : "非公開"}
              </span>
            </div>

            {/* トグルボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => handleToggle(true)}
                disabled={loading || isOpen === true}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors
                  bg-green-500 hover:bg-green-400 text-black
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                公開する
              </button>
              <button
                onClick={() => handleToggle(false)}
                disabled={loading || isOpen === false}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors
                  bg-zinc-700 hover:bg-zinc-600 text-white
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                非公開にする
              </button>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
