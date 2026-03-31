// Cloudflare Workers の環境変数とKVバインディングの型定義
declare global {
  interface CloudflareEnv {
    ACCESS_STORE: KVNamespace;
  }
}

export {};
