import { redirect } from "next/navigation";

export const runtime = "edge";

// Spotify OAuth認証を開始する
export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/setup/callback`;

  if (!clientId) {
    return Response.json(
      { error: "SPOTIFY_CLIENT_ID が設定されていません" },
      { status: 500 }
    );
  }

  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
  });

  redirect(`https://accounts.spotify.com/authorize?${params}`);
}
