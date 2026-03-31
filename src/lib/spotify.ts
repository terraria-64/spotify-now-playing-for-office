// リフレッシュトークンを使ってアクセストークンを取得する（Edge Runtime対応）
export async function getAccessToken(): Promise<string> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Spotify環境変数が設定されていません");
  }

  // Edge RuntimeではBufferが使えないためbtoaで代替
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`トークンのリフレッシュに失敗: ${JSON.stringify(err)}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}
