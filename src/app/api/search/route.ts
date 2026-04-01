import { getRequestContext } from "@cloudflare/next-on-pages";
import type { KVNamespace } from "@cloudflare/workers-types";
import { getAccessToken, spotifyErrorResponse } from "@/lib/spotify";

export const runtime = "edge";

export async function GET(request: Request) {
  // アクセスが閉じている場合は検索を拒否する
  try {
    const { env } = getRequestContext();
    const kv = (env as unknown as { ACCESS_STORE: KVNamespace }).ACCESS_STORE;
    const value = await kv.get("access_open");
    if (value === "false") {
      return Response.json({ error: "現在リクエストは受け付けていません" }, { status: 403 });
    }
  } catch {
    // KVが取得できない場合はオープンとして扱う
  }

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
    return spotifyErrorResponse(response);
  }

  const data = await response.json() as { tracks: { items: unknown[] } };

  return Response.json({ tracks: data.tracks.items });
}
