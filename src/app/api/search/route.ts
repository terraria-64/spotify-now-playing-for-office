import { getAccessToken } from "@/lib/spotify";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim() === "") {
    return Response.json({ tracks: [] });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  const params = new URLSearchParams({
    q: query,
    type: "track",
  });

  const response = await fetch(
    `https://api.spotify.com/v1/search?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    return Response.json({ error: "Spotify API error" }, { status: response.status });
  }

  const data = await response.json() as { tracks: { items: unknown[] } };

  return Response.json({ tracks: data.tracks.items });
}
