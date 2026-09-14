import type { RepertoireSong } from '@/lib/types';
import { loadVocalProfile, recommendKey, type VocalProfile } from '@/lib/vocal/profile';
import { transposeKey } from '@/lib/music/keys';

export interface Recommendation {
  recommendedKey?: string;
  recommendedDelta?: number;
  recommendedReason?: string;
}

/**
 * Calcula recomendação de tom para uma música com base no VocalProfile.
 * Fallback: se música marcada como difícil e sugestão não desce, força -2 semitons.
 */
export function computeRecommendation(
  song: Pick<RepertoireSong, 'currentKey' | 'difficulty'>,
  profile: VocalProfile | null = loadVocalProfile(),
): Recommendation {
  // Músicas importadas do Spotify chegam sem tom.
  if (!profile || !song.currentKey) return {};
  const rec = recommendKey(song.currentKey, profile);
  let recommendedKey = rec.recommendedKey;
  let recommendedDelta = rec.semitonesDelta;
  let recommendedReason = rec.reason;

  if (song.difficulty === 'hard' && recommendedDelta >= 0) {
    recommendedKey = transposeKey(song.currentKey, -2);
    recommendedDelta = -2;
    recommendedReason = 'Marcada como difícil — sugestão: descer 2 semitons.';
  }

  return { recommendedKey, recommendedDelta, recommendedReason };
}
