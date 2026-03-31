// アクセス制限中に表示するページ
export default function ClosedPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-zinc-400 text-sm">現在アクセスできません</p>
      </div>
    </main>
  );
}
