// セットアップページ：オーナーが一度だけ実行してリフレッシュトークンを取得する
export default function SetupPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 px-4 text-center max-w-sm">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
          <svg className="w-9 h-9 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">初回セットアップ</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Spotifyアカウントで認証して、リフレッシュトークンを取得します。
            これはオーナーが一度だけ実行する作業です。
          </p>
        </div>

        <ol className="text-left text-sm text-zinc-400 space-y-2 w-full bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">1.</span>
            <span>下のボタンをクリックしてSpotifyで認証</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">2.</span>
            <span>表示されたリフレッシュトークンを <code className="text-zinc-300">.env.local</code> にコピー</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-500 font-bold">3.</span>
            <span>サーバーを再起動すれば完了</span>
          </li>
        </ol>

        <a
          href="/api/setup/login"
          className="flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-semibold
            px-8 py-3 rounded-full transition-colors shadow-lg shadow-green-500/20 active:scale-95"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Spotifyで認証する
        </a>
      </div>
    </main>
  );
}
