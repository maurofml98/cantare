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

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
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

export const searchSpotifyPlaylists = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string() }))
  .handler(async ({ data: { query } }): Promise<SpotifyPlaylist[]> => {
    return withRetry(async () => {
      try {
        const token = await getAccessToken();
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&market=BR&limit=6`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar playlists no Spotify');
        }

        const data = await response.json();
        return data.playlists.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          images: item.images,
        }));
      } catch (error) {
        console.error('Spotify Search Exception:', error);
        throw error;
      }
    });
  });

export const getPlaylistTracks = createServerFn({ method: "GET" })
  .inputValidator(z.object({ playlistId: z.string() }))
  .handler(async ({ data: { playlistId } }): Promise<SpotifyTrack[]> => {
    return withRetry(async () => {
      const token = await getAccessToken();
      const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=BR&limit=30&fields=items(track(id,name,artists(name),album(name,images),duration_ms))`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('Spotify Tracks Error:', response.status, body);
        // Editorial/algorithmic playlists (e.g. Top 50) are no longer accessible
        // via Client Credentials since Nov 2024 — return empty list instead of throwing.
        if (response.status === 404 || response.status === 401 || response.status === 403) {
          return [];
        }
        throw new Error(`Spotify ${response.status}: ${body.slice(0, 200)}`);
      }

      const data = await response.json();
      return (data.items || [])
        .filter((item: any) => item && item.track)
        .map((item: any) => ({
          id: item.track.id || crypto.randomUUID(),
          name: item.track.name,
          artist: item.track.artists?.[0]?.name || 'Artista Desconhecido',
          albumImageUrl: item.track.album?.images?.[1]?.url || item.track.album?.images?.[0]?.url || '',
          duration_ms: item.track.duration_ms,
        }));
    });
  });


export const getSpotifyPlaylist = createServerFn({ method: "GET" })
  .inputValidator(z.object({ playlistId: z.string() }))
  .handler(async ({ data: { playlistId } }): Promise<SpotifyPlaylist> => {
    return withRetry(async () => {
      try {
        const token = await getAccessToken();
        const url = `https://api.spotify.com/v1/playlists/${playlistId}?market=BR&fields=id,name,images`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar detalhes da playlist');
        }

        return await response.json();
      } catch (error) {
        console.error('Spotify Playlist Details Exception:', error);
        throw error;
      }
    });
  });

export const searchSpotifyTracks = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string() }))
  .handler(async ({ data: { query } }): Promise<SpotifyTrack[]> => {
    return withRetry(async () => {
      try {
        const token = await getAccessToken();
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=BR&limit=20`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar músicas no Spotify');
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
