import type { RepertoireSong, SongDifficulty, SongStatus } from '@/lib/types';

const DIFFICULTY_LABEL: Record<SongDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Média',
  hard: 'Difícil',
  unknown: 'Não avaliada',
};

const STATUS_LABEL: Record<SongStatus, string> = {
  to_study: 'A estudar',
  training: 'Em treino',
  ready: 'Pronta',
  difficult: 'Difícil',
};

const STATUS_STYLE: Record<SongStatus, string> = {
  to_study: 'bg-white/5 text-white/70 border-white/10',
  training: 'bg-[#B8955A]/15 text-[#E8C97E] border-[#B8955A]/30',
  ready: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  difficult: 'bg-red-500/10 text-red-300 border-red-500/30',
};

interface Props {
  song: RepertoireSong;
  onClick?: () => void;
}

export function SongCard({ song, onClick }: Props) {
  const showRec = !!song.recommendedKey && song.recommendedKey !== song.currentKey;
  return (
    <button
      onClick={onClick}
      className="w-full text-left premium-card p-4 flex flex-col gap-3 bg-[#111118]/60 border border-white/5 hover:border-primary/20 hover:bg-white/5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium text-white truncate">{song.title}</h3>
          {song.artist && (
            <p className="text-[12px] text-[#8A8A95] truncate mt-0.5">{song.artist}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border ${STATUS_STYLE[song.status]}`}
        >
          {STATUS_LABEL[song.status]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <KeyChip label="Tom atual" value={song.currentKey} />
        {showRec ? (
          <KeyChip label="Recomendado" value={song.recommendedKey!} accent />
        ) : (
          <KeyChip label="Recomendado" value="—" muted />
        )}
        <span className="text-[10px] uppercase tracking-widest text-[#8A8A95]">
          {DIFFICULTY_LABEL[song.difficulty]}
        </span>
      </div>

      {song.vocalNote && (
        <p className="text-[12px] text-[#8A8A95] line-clamp-2" style={{ fontWeight: 300 }}>
          {song.vocalNote}
        </p>
      )}
    </button>
  );
}

function KeyChip({
  label, value, accent, muted,
}: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
        accent
          ? 'border-[#B8955A]/40 bg-[#B8955A]/10 text-[#E8C97E]'
          : muted
          ? 'border-white/5 text-[#555566]'
          : 'border-white/10 text-white/80'
      }`}
    >
      <span className="text-[9px] uppercase tracking-widest opacity-70">{label}</span>
      <span className="font-serif text-[13px]">{value}</span>
    </span>
  );
}
