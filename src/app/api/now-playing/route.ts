import { getAccessToken, spotifyErrorResponse } from "@/lib/spotify";

export const runtime = "edge";
import type { NowPlayingResponse } from "@/types/spotify";

export async function GET() {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // 再生中の曲がない場合
  if (response.status === 204 || response.status === 404) {
    const result: NowPlayingResponse = { isPlaying: false };
    return Response.json(result);
  }

  if (!response.ok) {
    return spotifyErrorResponse(response);
  }

  const data = await response.json() as {
    currently_playing_type: string;
    is_playing: boolean;
    item: unknown;
    progress_ms: number;
  };

  // 曲以外（ポッドキャストなど）はスキップ
  if (data.currently_playing_type !== "track" || !data.item) {
    const result: NowPlayingResponse = { isPlaying: false };
    return Response.json(result);
  }

  const result: NowPlayingResponse = {
    isPlaying: data.is_playing,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    track: data.item as any,
    progress_ms: data.progress_ms,
  };

  return Response.json(result);
}
