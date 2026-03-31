export const runtime = "edge";

// Spotifyからのコールバックを受け取り、リフレッシュトークンを表示する
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return new Response(renderHtml("エラー", `<p class="error">認証がキャンセルされました: ${error ?? "不明なエラー"}</p>`), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/setup/callback`;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    return new Response(renderHtml("エラー", `<p class="error">トークン取得に失敗しました</p>`), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const data = await response.json() as { refresh_token: string };
  const refreshToken: string = data.refresh_token;

  return new Response(
    renderHtml(
      "セットアップ完了",
      `
      <p>以下のリフレッシュトークンを <code>.env.local</code> にコピーしてください。</p>
      <div class="token-box">
        <code id="token">${refreshToken}</code>
        <button onclick="navigator.clipboard.writeText('${refreshToken}').then(() => this.textContent = 'コピー済！')">コピー</button>
      </div>
      <div class="env">
        <p><strong>.env.local に追記する内容：</strong></p>
        <pre>SPOTIFY_REFRESH_TOKEN=${refreshToken}</pre>
      </div>
      <p class="note">追記後、サーバーを再起動してください。</p>
    `
    ),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function renderHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title} — Spotify Now Playing</title>
  <style>
    body { font-family: sans-serif; background: #09090b; color: #fff; max-width: 600px; margin: 80px auto; padding: 0 24px; }
    h1 { color: #22c55e; font-size: 1.4rem; margin-bottom: 24px; }
    .token-box { display: flex; gap: 12px; align-items: center; background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .token-box code { flex: 1; word-break: break-all; font-size: 0.75rem; color: #a1a1aa; }
    button { background: #22c55e; color: #000; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; white-space: nowrap; }
    .env pre { background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 16px; font-size: 0.75rem; word-break: break-all; white-space: pre-wrap; color: #a1a1aa; }
    .note { color: #71717a; font-size: 0.875rem; }
    .error { color: #f87171; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`;
}
