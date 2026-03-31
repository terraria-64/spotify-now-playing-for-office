import { getRequestContext } from "@cloudflare/next-on-pages";
import type { KVNamespace } from "@cloudflare/workers-types";

export const runtime = "edge";

// パスワード不要でアクセス状態を返すAPI
export async function GET() {
  try {
    const { env } = getRequestContext();
    const kv = (env as unknown as { ACCESS_STORE: KVNamespace }).ACCESS_STORE;
    const value = await kv.get("access_open");
    return Response.json({ open: value !== "false" });
  } catch {
    // KVが取得できない場合（ローカル開発時など）はオープンとして扱う
    return Response.json({ open: true });
  }
}
