import { getRequestContext } from "@cloudflare/next-on-pages";
import type { KVNamespace } from "@cloudflare/workers-types";

export const runtime = "edge";

// KVネームスペースを取得するヘルパー
function getKV() {
  const { env } = getRequestContext();
  return (env as unknown as { ACCESS_STORE: KVNamespace }).ACCESS_STORE;
}

// アクセス状態を切り替えるAPI（パスワード保護）
export async function POST(request: Request) {
  const { password, open } = await request.json() as { password: string; open: boolean };

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "パスワードが違います" }, { status: 401 });
  }

  if (typeof open !== "boolean") {
    return Response.json({ error: "open は boolean で指定してください" }, { status: 400 });
  }

  await getKV().put("access_open", open ? "true" : "false");

  return Response.json({ success: true, open });
}

// 現在のアクセス状態を取得するAPI
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "パスワードが違います" }, { status: 401 });
  }

  const value = await getKV().get("access_open");

  // 値がない場合はデフォルトでオープン
  const open = value !== "false";

  return Response.json({ open });
}
