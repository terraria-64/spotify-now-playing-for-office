# Spotify Now Playing — アプリ概要

## 概要

Spotifyで現在再生中の曲をリアルタイム表示し、来場者がキューに曲を追加できるWebアプリ。
イベント・配信などで「その場にいる人が曲をリクエストできる」シナリオを想定している。

管理者がアクセスのオン/オフを切り替えられるため、開放・非公開を状況に応じて制御できる。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js（App Router） |
| ランタイム | Cloudflare Pages（Edge Runtime） |
| KVストア | Cloudflare KV（`ACCESS_STORE`） |
| 外部API | Spotify Web API |
| スタイリング | Tailwind CSS |
| フォント | Geist Sans |
| デプロイ | Vercel / Cloudflare Pages |

---

## ページ一覧

| パス | 概要 |
|------|------|
| `/` | メインページ。再生中の曲表示 + 曲検索・キュー追加 |
| `/admin` | 管理者パネル。パスワード認証後にアクセス公開/非公開を切り替え |
| `/closed` | アクセス制限中に表示されるページ |
| `/setup` | 初回セットアップページ（オーナーが一度だけ実行） |

---

## APIエンドポイント一覧

### `GET /api/now-playing`
Spotify APIから現在再生中のトラック情報を取得して返す。

- 再生中でない場合: `{ isPlaying: false }`
- ポッドキャスト等（トラック以外）はスキップ
- レスポンス型: `NowPlayingResponse`

### `GET /api/search?q={クエリ}`
Spotify APIでトラックを検索する。

- クエリが空の場合は空配列を返す
- レスポンス型: `{ tracks: SpotifyTrack[] }`

### `POST /api/queue`
指定したSpotify URIのトラックをキューに追加する。

- リクエストボディ: `{ uri: string }`
- 成功時: `{ success: true }`

### `POST /api/admin/toggle`
アクセス状態を切り替える（パスワード保護）。

- リクエストボディ: `{ password: string, open: boolean }`
- Cloudflare KVの `access_open` キーを更新

### `GET /api/admin/toggle?password={パスワード}`
現在のアクセス状態を取得する。

- レスポンス: `{ open: boolean }`

### `GET /api/setup/login`
Spotify OAuthフローを開始する。以下のスコープを要求する。

- `user-read-currently-playing`
- `user-read-playback-state`
- `user-modify-playback-state`

### `GET /api/setup/callback`
SpotifyからのOAuthコールバックを受け取り、リフレッシュトークンをHTMLで表示する。

---

## 主要コンポーネント

### `NowPlaying`
再生中の曲をリアルタイム表示するクライアントコンポーネント。

- 3秒ごとに `/api/now-playing` をポーリング
- アートワーク画像・曲名・アーティスト名・アルバム名を表示
- 再生進捗バーを表示（`mm:ss` 形式）
- 再生中でない場合はプレースホルダーを表示

### `SearchBar`
曲名・アーティスト名での検索フォーム。

- 入力後300msのデバウンス処理
- 検索中はスピナーを表示
- クリアボタンで入力リセット
- 検索結果を `SearchResults` に渡す

### `SearchResults`
検索結果リストを表示し、各曲をキューに追加できるコンポーネント。

---

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `SPOTIFY_CLIENT_ID` | Spotify Developer ConsoleのクライアントID |
| `SPOTIFY_CLIENT_SECRET` | Spotifyのクライアントシークレット |
| `SPOTIFY_REFRESH_TOKEN` | セットアップで取得したリフレッシュトークン |
| `NEXTAUTH_URL` | アプリのベースURL（OAuthコールバックURIに使用） |
| `ADMIN_PASSWORD` | 管理者パネルのパスワード |

---

## アクセス制御の仕組み

Middlewareがすべてのリクエストを検査し、Cloudflare KVの `access_open` キーを参照する。

```
access_open = "false" → /closed にリダイレクト
access_open = "true" または未設定 → 通過（公開）
```

以下のパスはMiddlewareの対象外（常にアクセス可）：
- `/closed`
- `/admin`
- `/api/admin`

ローカル開発時（KVが取得できない場合）は常に公開扱いとなる。

---

## セットアップ手順（初回）

1. Spotify Developer Consoleでアプリを作成し、`Client ID` と `Client Secret` を取得
2. `.env.local` に `SPOTIFY_CLIENT_ID`・`SPOTIFY_CLIENT_SECRET`・`NEXTAUTH_URL` を設定
3. `/setup` にアクセスして「Spotifyで認証する」をクリック
4. 認証後に表示されたリフレッシュトークンを `.env.local` の `SPOTIFY_REFRESH_TOKEN` にコピー
5. サーバーを再起動

---

## 認証フロー（Spotify）

```
/setup → /api/setup/login → Spotify OAuth認証 → /api/setup/callback
                                                         ↓
                                          リフレッシュトークンをHTMLで表示
```

通常のAPI呼び出し時は `getAccessToken()` がリフレッシュトークンからアクセストークンを都度取得する（Edge Runtime対応、`btoa` を使用）。
