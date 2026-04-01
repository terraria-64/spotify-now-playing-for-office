import { getAccessToken, spotifyErrorResponse } from "@/lib/spotify";
import type { SpotifyArtist, SpotifyTrack } from "@/types/spotify";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get("artistId");

  if (!artistId) {
    return Response.json({ tracks: [] });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${accessToken}` };

  // 関連アーティストを取得
  const relatedRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
    { headers }
  );
  if (!relatedRes.ok) {
    if (relatedRes.status === 429) return spotifyErrorResponse(relatedRes);
    return Response.json({ tracks: [] });
  }

  const relatedData = await relatedRes.json() as { artists: SpotifyArtist[] };
  // 上位3アーティストを選択
  const targetArtists = relatedData.artists.slice(0, 3);

  // 各アーティストのトップトラックを並行取得し、先頭1曲を抽出
  const results = await Promise.all(
    targetArtists.map(async (artist) => {
      const res = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=JP`,
        { headers }
      );
      if (!res.ok) return null;
      const data = await res.json() as { tracks: SpotifyTrack[] };
      return data.tracks[0] ?? null;
    })
  );

  const tracks = results.filter((t): t is SpotifyTrack => t !== null);

  return Response.json({ tracks });
}
