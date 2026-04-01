import { getRequestContext } from "@cloudflare/next-on-pages";
import type { KVNamespace } from "@cloudflare/workers-types";
import { getAccessToken, spotifyErrorResponse } from "@/lib/spotify";

export const runtime = "edge";

// キューの先頭トラックを取得する
export async function GET() {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    return Response.json({ error: "トークンの取得に失敗しました" }, { status: 500 });
  }

  const response = await fetch("https://api.spotify.com/v1/me/player/queue", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 429) return spotifyErrorResponse(response);
    return Response.json({ nextTrack: null });
  }

  const data = await response.json() as { queue?: unknown[] };
  const nextTrack = (data.queue && data.queue.length > 0) ? data.queue[0] : null;

  return Response.json({ nextTrack });
}

export async function POST(request: Request) {
  // アクセスが閉じている場合はキュー追加を拒否する
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
    if (response.status === 429) return spotifyErrorResponse(response);
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
    return Response.json(
      { error: error?.error?.message ?? "Spotify API error" },
      { status: response.status }
    );
  }

  return Response.json({ success: true });
}
