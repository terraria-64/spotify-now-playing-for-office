import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { KVNamespace } from "@cloudflare/workers-types";

// アクセス制御の対象外パス
const BYPASS_PATHS = ["/closed", "/admin", "/api/admin", "/api/access", "/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 対象外パスはスキップ
  if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // KVからアクセス状態を取得
  try {
    const { env } = getRequestContext();
    const kv = (env as unknown as { ACCESS_STORE: KVNamespace }).ACCESS_STORE;
    const value = await kv.get("access_open");

    if (value === "false") {
      return NextResponse.redirect(new URL("/closed", request.url));
    }
  } catch {
    // KVが取得できない場合（ローカル開発時など）はオープンとして扱う
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
