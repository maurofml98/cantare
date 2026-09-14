import { createServerFn } from "@tanstack/react-start";
import { btoa } from "node:buffer";
import { z } from "zod";

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: SpotifyToken | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('Spotify credentials missing from process.env');
    throw new Error('Spotify credentials not found');
  }

  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Spotify Auth Error:', errorData);
    throw new Error('Erro de autenticação no Spotify');
  }

  const data = await response.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60000, // 1 minute buffer
  };

  return cachedToken.access_token;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
  duration_ms: number;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

export const searchSpotifyTracks = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string() }))
  .handler(async ({ data: { query } }): Promise<SpotifyTrack[]> => {
    return withRetry(async () => {
      try {
        const token = await getAccessToken();
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=BR&limit=10`; // Spotify rejeita limit > 10 ("Invalid limit")

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`Spotify ${response.status}: ${body.slice(0, 200)}`);
        }

        const data = await response.json();
        return data.tracks.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          artist: item.artists?.[0]?.name || 'Artista Desconhecido',
          albumImageUrl: item.album?.images?.[1]?.url || item.album?.images?.[0]?.url || '',
          duration_ms: item.duration_ms,
        }));
      } catch (error) {
        console.error('Spotify Search Tracks Exception:', error);
        throw error;
      }
    });
  });
