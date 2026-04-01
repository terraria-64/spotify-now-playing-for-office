import { getAccessToken, spotifyErrorResponse } from "@/lib/spotify";

export const runtime = "edge";

// 現在の再生音量を取得する
export async function GET() {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  const response = await fetch("https://api.spotify.com/v1/me/player", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return spotifyErrorResponse(response);
  }

  // 再生中でない場合は204が返る
  if (response.status === 204) {
    return Response.json({ volume: null });
  }

  const data = await response.json() as { device?: { volume_percent?: number } };
  return Response.json({ volume: data.device?.volume_percent ?? null });
}

export async function PUT(request: Request) {
  const { volume } = await request.json() as { volume: number };

  if (typeof volume !== "number" || volume < 0 || volume > 100) {
    return Response.json({ error: "volume は 0〜100 の数値で指定してください" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // 204 No Content は成功
  if (response.status === 204) {
    return Response.json({ success: true });
  }

  if (!response.ok) {
    if (response.status === 429) return spotifyErrorResponse(response);
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    return Response.json(
      { error: error?.error?.message ?? "Spotify API error" },
      { status: response.status }
    );
  }

  return Response.json({ success: true });
}
