import { getAccessToken } from "@/lib/spotify";

export const runtime = "edge";

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
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    return Response.json(
      { error: error?.error?.message ?? "Spotify API error" },
      { status: response.status }
    );
  }

  return Response.json({ success: true });
}
