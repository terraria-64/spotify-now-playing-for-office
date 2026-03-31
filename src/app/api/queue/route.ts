import { getAccessToken } from "@/lib/spotify";

export const runtime = "edge";

export async function POST(request: Request) {
  const { uri } = await request.json() as { uri: string };

  if (!uri) {
    return Response.json({ error: "URI is required" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  const response = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
    {
      method: "POST",
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
