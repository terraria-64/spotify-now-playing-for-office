import { getAccessToken } from "@/lib/spotify";

export const runtime = "edge";

// Last.fm から類似アーティストを取得する
async function getSimilarArtists(artistName: string): Promise<string[]> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error("LASTFM_API_KEY が設定されていません");

  const params = new URLSearchParams({
    method: "artist.getSimilar",
    artist: artistName,
    api_key: apiKey,
    format: "json",
    limit: "20",
  });

  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
  if (!res.ok) throw new Error("Last.fm APIの呼び出しに失敗しました");

  const data = await res.json() as {
    similarartists?: { artist?: { name: string }[] };
  };

  return data.similarartists?.artist?.map((a) => a.name) ?? [];
}

// Spotify でアーティストIDを検索する
async function searchArtistId(
  artistName: string,
  accessToken: string
): Promise<{ id: string; name: string } | null> {
  const params = new URLSearchParams({
    q: artistName,
    type: "artist",
    limit: "1",
  });

  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    artists?: { items?: { id: string; name: string }[] };
  };

  const artist = data.artists?.items?.[0];
  if (!artist) return null;

  return { id: artist.id, name: artist.name };
}

// 類似アーティストをコンテキストとして再生する
export async function POST(request: Request) {
  const { artistName } = await request.json() as { artistName: string };

  if (!artistName) {
    return Response.json({ error: "artistName は必須です" }, { status: 400 });
  }

  // 類似アーティストを取得
  let similarArtists: string[];
  try {
    similarArtists = await getSimilarArtists(artistName);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Last.fm エラー" },
      { status: 500 }
    );
  }

  if (similarArtists.length === 0) {
    return Response.json(
      { error: "類似アーティストが見つかりませんでした" },
      { status: 404 }
    );
  }

  // ランダムで1アーティストを選択
  const picked = similarArtists[Math.floor(Math.random() * similarArtists.length)];

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  // Spotify でアーティストIDを取得
  const found = await searchArtistId(picked, accessToken);
  if (!found) {
    return Response.json(
      { error: `${picked} が Spotify で見つかりませんでした` },
      { status: 404 }
    );
  }

  // アーティストコンテキストで再生（連続再生される）
  const playRes = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ context_uri: `spotify:artist:${found.id}` }),
  });

  if (playRes.status !== 204 && !playRes.ok) {
    const err = await playRes.json().catch(() => ({})) as { error?: { message?: string } };
    return Response.json(
      { error: err?.error?.message ?? "Spotify 再生エラー" },
      { status: playRes.status }
    );
  }

  return Response.json({
    success: true,
    artist: found.name,
  });
}
