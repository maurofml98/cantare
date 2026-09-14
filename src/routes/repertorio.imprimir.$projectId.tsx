import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { blockSongs, durationOf, formatDuration, formatSongTime, getProject, reserveSongs } from '@/lib/repertoire/store';
import type { RepertoireProject } from '@/lib/types';

/**
 * Versão para imprimir / salvar como PDF (banda, impressão, púlpito).
 * Usa o "Salvar como PDF" do próprio navegador: funciona offline e sem biblioteca extra.
 */
export const Route = createFileRoute('/repertorio/imprimir/$projectId')({
  head: () => ({ meta: [{ title: 'Repertório para impressão — Cantare' }] }),
  component: PrintView,
});

function PrintView() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<RepertoireProject | null | undefined>(undefined);

  useEffect(() => {
    const p = getProject(projectId);
    setProject(p);
    if (p) {
      document.title = `${p.name} — repertório`;
      const t = window.setTimeout(() => window.print(), 500);
      return () => window.clearTimeout(t);
    }
  }, [projectId]);

  if (project === undefined) return null;
  if (!project) {
    return (
      <div className="p-10">
        <p>Projeto não encontrado.</p>
        <Link to="/repertorio" className="underline">Voltar ao repertório</Link>
      </div>
    );
  }

  let pos = 0;
  const all = project.blocks.flatMap((b) => blockSongs(project, b));
  const total = durationOf(all);
  const reserve = reserveSongs(project);
  const date = project.date ? new Date(`${project.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <div className="print-root min-h-screen bg-white px-10 py-8 text-black">
      <div className="no-print mb-6 flex items-center justify-between gap-4 rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-[14px]">
        <span>Na janela de impressão, escolha <b>Salvar como PDF</b> para enviar à banda.</span>
        <span className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-md bg-black px-4 py-2 text-white">Imprimir / Salvar PDF</button>
          <Link to="/repertorio/$projectId" params={{ projectId }} className="rounded-md border border-neutral-400 px-4 py-2">Voltar</Link>
        </span>
      </div>

      <header className="border-b-2 border-black pb-3">
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 34, lineHeight: 1.1 }}>{project.name}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          {[project.type, project.venue, date].filter(Boolean).join(' · ')} · {all.length} músicas · {formatDuration(total.seconds, total.estimatedCount > 0)}
        </p>
      </header>

      {project.blocks.map((b, bi) => {
        const songs = blockSongs(project, b);
        if (!songs.length) return null;
        const d = durationOf(songs);
        return (
          <section key={b.id} className="mt-5 break-inside-avoid">
            <h2 className="flex justify-between border-b border-neutral-400 pb-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600 }}>
              <span>{bi + 1}. {b.name}{b.description ? ` — ${b.description}` : ''}</span>
              <span>{songs.length} · {formatDuration(d.seconds, d.estimatedCount > 0)}</span>
            </h2>
            <table className="mt-1 w-full" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              <tbody>
                {songs.map((s) => {
                  pos++;
                  return (
                    <tr key={s.id} className="border-b border-neutral-200">
                      <td className="w-8 py-1 text-neutral-500">{String(pos).padStart(2, '0')}</td>
                      <td className="py-1"><b>{s.title}</b>{s.artist ? <span className="text-neutral-600"> — {s.artist}</span> : null}{s.vocalNote ? <span className="block text-[11px] text-neutral-500">{s.vocalNote}</span> : null}</td>
                      <td className="w-16 py-1 text-right" style={{ fontSize: 17, fontWeight: 700 }}>{s.currentKey || '—'}</td>
                      <td className="w-14 py-1 text-right text-neutral-500">{s.durationSec ? formatSongTime(s.durationSec) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      {reserve.length > 0 && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="border-b border-neutral-400 pb-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600 }}>Reserva</h2>
          <ul className="mt-1 columns-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            {reserve.map((s) => <li key={s.id} className="py-0.5"><b>{s.currentKey || '—'}</b> · {s.title}{s.artist ? ` — ${s.artist}` : ''}</li>)}
          </ul>
        </section>
      )}

      {project.notes && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="border-b border-neutral-400 pb-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600 }}>Anotações</h2>
          <p className="mt-1 whitespace-pre-wrap" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{project.notes}</p>
        </section>
      )}

      <style>{`
        body { background: #fff !important; }
        @media print { .no-print { display: none !important } .print-root { padding: 0 } @page { margin: 14mm } }
      `}</style>
    </div>
  );
}
