import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, Play, RotateCcw } from 'lucide-react';
import { VOCAL_DATA } from '@/data/vocal-exercises';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VoiceBodyMap, type BodyRegion } from '@/components/vocal/VoiceBodyMap';
import { LAURY_TIP } from '@/components/home/HomeSections';
import { CinematicImage, CrossfadeImage, preloadAsset, type AssetName } from '@/components/media/CinematicImage';
import { C, LINING, Panel, SANS, SERIF, TextLink, focusRing } from '@/components/home/primitives';
import {
  loadCareDay, loadLogs, loadWaterGoal, saveCareDay, saveLog, saveWaterGoal, today,
  type CareDay, type CareItemId, type Mood, type VoiceLog,
} from '@/lib/saude/care';

const ROUTINE_SIZES = '(max-width: 1024px) 100vw, 60vw';

export const Route = createFileRoute('/_app/saude/')({
  head: () => ({ links: [preloadAsset('cantare-hidratacao', ROUTINE_SIZES)] }),
  component: SaudePage,
});

/** Foto de cada categoria da rotina (crossfade ao trocar). */
const CATEGORY_SCENE: Record<CategoryId, { name: AssetName; position: string }> = {
  hidratacao: { name: 'cantare-hidratacao', position: '62% 50%' },
  descanso: { name: 'cantare-pos-show', position: '70% 35%' },
  ambiente: { name: 'cantare-respiracao-torax', position: '30% 30%' },
  alimentacao: { name: 'cantare-saude-vocal-bg', position: '70% 35%' },
  aquecimento: { name: 'cantare-aquecimento-vocal', position: '35% 30%' },
};

/** Miniatura editorial de cada aquecimento guiado. */
const CONTENT_SCENE: Record<string, { name: AssetName; position: string }> = {
  geral: { name: 'cantare-aquecimento-vocal', position: '35% 35%' },
  desaquecimento: { name: 'cantare-pos-show', position: '70% 35%' },
  diccao: { name: 'cantare-diccao-articulacao', position: '60% 45%' },
  agudos: { name: 'cantare-ressonancia-cabeca', position: '45% 35%' },
  graves: { name: 'cantare-voz-mista', position: '50% 40%' },
  gravacao: { name: 'cantare-afinacao', position: '30% 45%' },
};

/*
 * TODO(Laury): todas as orientações abaixo são provisórias e genéricas (sem metas nem
 * prescrição). O texto final de cada categoria, e os conteúdos educativos, vêm dela.
 */

type CategoryId = 'hidratacao' | 'descanso' | 'ambiente' | 'alimentacao' | 'aquecimento';

const CATEGORIES: {
  id: CategoryId; title: string; short: string; accent: string; regions: BodyRegion[]; item: CareItemId;
  lead: string; tips: string[]; action?: { label: string; to: string; params?: Record<string, string> };
}[] = [
  { id: 'hidratacao', title: 'Hidratação', short: 'Água ao longo do dia', accent: '#C9A15E', regions: ['laringe', 'cavidades'], item: 'agua',
    lead: 'Voz hidratada responde melhor e cansa menos.',
    tips: ['Beba água aos poucos, ao longo do dia — não tudo de uma vez antes do show.', 'Deixe uma garrafa por perto no ensaio e no palco.', 'Registre aqui o que bebeu para acompanhar o seu dia.'] },
  { id: 'descanso', title: 'Descanso vocal', short: 'Evite esforço desnecessário', accent: '#7C95BF', regions: ['laringe'], item: 'descanso',
    lead: 'Pausa também é treino.',
    tips: ['Depois de um show longo, reserve um tempo em silêncio.', 'Evite falar alto por cima de barulho quando não precisa.', 'Cansou? Diminua o esforço hoje e priorize recuperação.'] },
  { id: 'ambiente', title: 'Ambiente', short: 'Menos ar seco e poeira', accent: '#6FA394', regions: ['traqueia', 'laringe'], item: 'ambiente',
    lead: 'O ar que você respira chega até a voz.',
    tips: ['Ar-condicionado forte resseca: prefira ambientes ventilados.', 'Fumaça e poeira irritam: afaste-se quando possível.', 'Em lugar barulhento, use microfone em vez de forçar.'] },
  { id: 'alimentacao', title: 'Alimentação', short: 'Escolhas antes de cantar', accent: '#C98B6A', regions: ['laringe', 'diafragma'], item: 'sem-forcar',
    lead: 'Refeição pesada logo antes pesa na respiração.',
    tips: ['Coma com alguma antecedência antes de cantar.', 'Observe o que te dá sensação de garganta pesada e ajuste.', 'Em caso de azia frequente, procure orientação profissional.'] },
  { id: 'aquecimento', title: 'Aquecimento', short: 'Prepare a voz sempre', accent: '#B8955A', regions: ['diafragma', 'laringe', 'cavidades'], item: 'aquecimento',
    lead: 'Nunca comece a cantar com a voz fria.',
    tips: ['Faça o aquecimento antes de todo ensaio e show.', 'Comece suave, sem buscar os extremos da voz.', 'Depois do show, desaqueça com calma.'],
    action: { label: 'Fazer aquecimento geral', to: '/saude/$warmupId', params: { warmupId: 'geral' } } },
];

const CHECKLIST: { id: CareItemId; label: string; category: CategoryId }[] = [
  { id: 'agua', label: 'Beber água ao longo do dia', category: 'hidratacao' },
  { id: 'aquecimento', label: 'Fazer aquecimento vocal', category: 'aquecimento' },
  { id: 'sem-forcar', label: 'Evitar gritar ou forçar a voz', category: 'alimentacao' },
  { id: 'ambiente', label: 'Cuidar do ambiente (ar seco, fumaça)', category: 'ambiente' },
  { id: 'descanso', label: 'Fazer um descanso vocal', category: 'descanso' },
];

const MOODS: { id: Mood; label: string; curve: number; color: string }[] = [
  { id: 'ruim', label: 'Ruim', curve: -5, color: '#C98B78' },
  { id: 'cansada', label: 'Cansada', curve: -2, color: '#D2A45E' },
  { id: 'normal', label: 'Normal', curve: 0, color: '#C9A15E' },
  { id: 'bem', label: 'Bem', curve: 3, color: '#8DB49B' },
  { id: 'otima', label: 'Ótima', curve: 5, color: '#7FB59A' },
];

const CONTENT_IDS = ['geral', 'desaquecimento', 'diccao', 'agudos', 'graves', 'gravacao'];

function SaudePage() {
  const [day, setDay] = useState<CareDay | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [logs, setLogs] = useState<VoiceLog[]>([]);
  const [cat, setCat] = useState<CategoryId>('hidratacao');
  const [details, setDetails] = useState(false);
  const [allContent, setAllContent] = useState(false);
  const [focusItem, setFocusItem] = useState<CareItemId | null>(null);
  const checklistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDay(loadCareDay());
    setGoal(loadWaterGoal());
    setLogs(loadLogs());
  }, []);

  const category = CATEGORIES.find((c) => c.id === cat)!;

  /** Persiste o dia; em erro, avisa e mantém o estado anterior. */
  const commit = (next: CareDay, success?: string) => {
    try {
      saveCareDay(next);
      setDay(next);
      if (success) toast.success(success);
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível salvar agora. Tente novamente.');
      return false;
    }
  };

  if (!day) {
    return <div className="h-[70vh] animate-pulse rounded-[8px] bg-white/[0.02]" aria-busy="true" aria-label="Carregando cuidados" />;
  }

  const doneCount = CHECKLIST.filter((i) => day.checklist[i.id]).length;
  const allDone = doneCount === CHECKLIST.length;
  const firstPending = CHECKLIST.find((i) => !day.checklist[i.id]) ?? null;
  const todayLog = logs.find((l) => l.date === today());

  const toggleItem = (id: CareItemId) => {
    const nextVal = !day.checklist[id];
    const next = { ...day, checklist: { ...day.checklist, [id]: nextVal } };
    if (commit(next)) {
      const count = CHECKLIST.filter((i) => next.checklist[i.id]).length;
      if (nextVal && count === CHECKLIST.length) toast.success('Rotina de cuidados concluída hoje.', { description: 'Sua voz agradece.' });
      if (focusItem === id && nextVal) setFocusItem(CHECKLIST.find((i) => !next.checklist[i.id])?.id ?? null);
    }
  };

  const startRoutine = () => {
    if (commit({ ...day, routineStarted: true })) {
      const first = CHECKLIST.find((i) => !day.checklist[i.id]);
      if (first) {
        setFocusItem(first.id);
        setCat(first.category);
        checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        window.setTimeout(() => checklistRef.current?.querySelector<HTMLButtonElement>(`button[data-item="${first.id}"]`)?.focus({ preventScroll: true }), 350);
      }
    }
  };

  const addWater = (ml: number) => {
    const waterMl = day.waterMl + ml;
    const reachedGoal = goal !== null && day.waterMl < goal && waterMl >= goal;
    const next = { ...day, waterMl, waterLog: [...day.waterLog, ml], checklist: reachedGoal ? { ...day.checklist, agua: true } : day.checklist };
    if (commit(next)) toast.success(`+${ml} ml registrados`, { description: reachedGoal ? 'Você chegou à sua meta de hoje.' : `Total hoje: ${waterMl} ml` });
  };

  const undoWater = () => {
    const last = day.waterLog[day.waterLog.length - 1];
    if (!last) return;
    if (commit({ ...day, waterMl: Math.max(0, day.waterMl - last), waterLog: day.waterLog.slice(0, -1) })) toast(`Último registro desfeito (−${last} ml)`);
  };

  const markAll = () => {
    const checklist = Object.fromEntries(CHECKLIST.map((i) => [i.id, true])) as CareDay['checklist'];
    if (commit({ ...day, checklist }, 'Rotina de cuidados concluída hoje.')) setFocusItem(null);
  };

  return (
    <div style={LINING} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* ================= Cabeçalho ================= */}
      <header className="px-1 lg:col-span-8">
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(40px, 4vw, 68px)', color: C.paper, lineHeight: 1 }}>
          Cuide da sua <em style={{ color: C.gold }}>voz</em>
        </h1>
        <p className="mt-2" style={{ fontFamily: SANS, fontWeight: 300, fontSize: 17, color: C.paper2 }}>
          Conhecimento, hábitos e ferramentas para uma voz mais saudável e duradoura.
        </p>
      </header>
      <Panel className="lg:col-span-4" bodyClassName="!py-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 19, color: C.paper, lineHeight: 1.35 }}>“{LAURY_TIP}”</blockquote>
            <p className="mt-1.5" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>Laury · fonoaudióloga</p>
          </div>
          {/* TODO(asset): foto da Laury em src/assets/laury.jpg */}
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ border: `1px solid ${C.gold}`, fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: C.gold }} aria-hidden>L</span>
        </div>
      </Panel>

      {/* ================= Categorias ================= */}
      <div role="tablist" aria-label="Categorias de cuidado" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-12 lg:grid-cols-5">
        {CATEGORIES.map((c) => {
          const sel = c.id === cat;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={sel}
              onClick={() => setCat(c.id)}
              className={`motion-lift group flex items-center gap-3 rounded-[8px] px-4 py-3.5 text-left transition-[transform,border-color,background-color] duration-[var(--dur-hover)] hover:-translate-y-0.5 active:scale-[0.98] ${focusRing}`}
              style={{
                border: `1px solid ${sel ? c.accent : C.rule}`,
                background: sel ? `linear-gradient(180deg, ${c.accent}1f, transparent), #0F1114` : 'linear-gradient(180deg, #0F1114 0%, #0B0C0F 100%)',
              }}
            >
              <CategoryMark id={c.id} color={c.accent} />
              <span className="min-w-0">
                <span className="block truncate" style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: C.paper }}>{c.title}</span>
                <span className="block truncate transition-colors group-hover:text-[rgba(232,228,220,0.78)]" style={{ fontFamily: SANS, fontSize: 12.5, color: sel ? C.paper2 : C.paper3 }}>{c.short}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= Rotina do dia ================= */}
      <Panel
        glow
        className="max-lg:order-1 lg:col-span-8"
        bodyClassName="!p-0"
        media={
          <CrossfadeImage
            name={CATEGORY_SCENE[cat].name}
            position={CATEGORY_SCENE[cat].position}
            priority={cat === 'hidratacao'}
            overlay="left"
            intensity={1}
            className="hidden md:block"
            sizes={ROUTINE_SIZES}
          />
        }
      >
        <div className="grid h-full grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div key={cat} className="flex flex-col p-6 animate-in fade-in duration-300 2xl:p-7">
            <span style={{ fontFamily: SANS, fontSize: 13, color: category.accent }}>{category.title}</span>
            <h2 className="mt-1" style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 2.4vw, 40px)', color: C.paper, lineHeight: 1.08 }}>
              {category.lead}
            </h2>
            <ul className="mt-4 space-y-2.5" style={{ fontFamily: SANS, fontSize: 14.5, color: C.paper2, lineHeight: 1.5 }}>
              {category.tips.map((t) => (
                <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: category.accent }} />{t}</li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <div className="mb-3 flex items-center gap-3" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
                <span>Rotina de hoje</span>
                <span className="h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(232,228,220,0.08)' }}>
                  <span className="block h-full rounded-full transition-[width] duration-[var(--dur-progress)] ease-[var(--ease-out)]" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%`, background: C.gold }} />
                </span>
                <span className="tabular-nums">{doneCount}/{CHECKLIST.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {allDone ? (
                  <p style={{ fontFamily: SERIF, fontSize: 22, color: C.paper }}>Rotina de cuidados concluída hoje.</p>
                ) : (
                  <Button size="lg" onClick={startRoutine}>
                    <Play className="fill-current" /> {day.routineStarted ? `Continuar: ${firstPending?.label.split(' (')[0]}` : 'Começar rotina de cuidados'}
                  </Button>
                )}
                {category.action && (
                  <Link to={category.action.to} params={category.action.params as never} className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                    {category.action.label}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <WaterCard
            ml={day.waterMl}
            goal={goal}
            canUndo={day.waterLog.length > 0}
            onAdd={addWater}
            onUndo={undoWater}
            onGoal={(v) => {
              try {
                saveWaterGoal(v);
                setGoal(v);
                toast.success(v ? `Meta definida: ${v} ml` : 'Meta removida');
              } catch {
                toast.error('Não foi possível salvar a meta. Tente novamente.');
              }
            }}
          />
        </div>
      </Panel>

      {/* ================= Corpo ================= */}
      <Panel title="Seu corpo e sua voz" subtitle="A voz nasce do corpo inteiro, não só da garganta." labelledBy="corpo" className="max-lg:order-3 lg:col-span-4">
        <div className="relative min-h-[300px] flex-1">
          <VoiceBodyMap set="producao" active={category.regions} breathing={category.regions.includes('diafragma')} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: category.accent }}>Em destaque: {category.title.toLowerCase()}</span>
          <Button variant="secondary" size="sm" onClick={() => setDetails(true)}>Ver mais detalhes</Button>
        </div>
      </Panel>

      {/* ================= Conteúdos ================= */}
      <Panel
        title="Aquecimentos guiados"
        subtitle="Sequências curtas de quatro exercícios, para cada situação."
        labelledBy="conteudos"
        className="max-lg:order-4 lg:col-span-6"
      >
        <ul className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${allContent ? '' : '2xl:grid-cols-2'}`}>
          {(allContent ? CONTENT_IDS : CONTENT_IDS.slice(0, 4)).map((id) => {
            const w = VOCAL_DATA[id];
            if (!w) return null;
            const series = w.exercises.reduce((s, e) => s + e.sets, 0);
            const scene = CONTENT_SCENE[id];
            return (
              <li key={id}>
                <Link
                  to="/saude/$warmupId"
                  params={{ warmupId: id }}
                  className={`motion-lift group relative flex h-full flex-col overflow-hidden rounded-[8px] p-4 transition-[transform,border-color,background-color] duration-[var(--dur-hover)] hover:-translate-y-0.5 hover:border-[rgba(184,149,90,0.45)] active:scale-[0.99] ${focusRing}`}
                  style={{ border: `1px solid ${C.rule}`, background: 'rgba(255,255,255,0.015)' }}
                >
                  {scene && (
                    <span className="relative -mx-4 -mt-4 mb-3 block h-[92px] overflow-hidden">
                      <CinematicImage name={scene.name} position={scene.position} overlay="bottom" intensity={0.9} vignette={false} interactive sizes="(max-width: 640px) 100vw, 22vw" />
                    </span>
                  )}
                  <span className="flex items-center justify-between">
                    <span style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{w.exercises.length} exercícios · {series} séries</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full transition-[background-color,transform] duration-[var(--dur-hover)] group-hover:translate-x-0.5 group-hover:bg-[rgba(184,149,90,0.18)]" style={{ border: '1px solid rgba(184,149,90,0.45)', color: C.gold }} aria-hidden>
                      <Play size={13} className="fill-current" />
                    </span>
                  </span>
                  <span className="mt-2 block transition-colors group-hover:text-white" style={{ fontFamily: SERIF, fontSize: 21, color: C.paper, lineHeight: 1.15 }}>{w.name}</span>
                  <span className="mt-1 block" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3, lineHeight: 1.45 }}>{w.description}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Button variant="link" onClick={() => setAllContent((v) => !v)}>{allContent ? 'Mostrar menos' : `Ver todos (${CONTENT_IDS.length})`}</Button>
          <TextLink to="/saude/tom">Fazer o teste de tom</TextLink>
        </div>
      </Panel>

      {/* ================= Checklist ================= */}
      <Panel title="Checklist diário" subtitle={allDone ? 'Tudo feito hoje.' : 'Comece pelos cuidados básicos de hoje.'} labelledBy="checklist" className="max-lg:order-2 lg:col-span-3">
        <div ref={checklistRef} className="flex flex-1 flex-col">
          <div className="flex items-center gap-3" style={{ fontFamily: SANS, fontSize: 13, color: C.paper2 }}>
            <span className="h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(232,228,220,0.08)' }}>
              <span className="block h-full rounded-full transition-[width] duration-[var(--dur-progress)] ease-[var(--ease-out)]" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%`, background: C.gold }} />
            </span>
            <span className="tabular-nums" aria-live="polite">{doneCount}/{CHECKLIST.length} concluídos</span>
          </div>
          <ul className="mt-3 flex flex-col gap-1">
            {CHECKLIST.map((i) => {
              const done = !!day.checklist[i.id];
              const focused = focusItem === i.id;
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    data-item={i.id}
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => toggleItem(i.id)}
                    className={`flex w-full items-center gap-3 rounded-[6px] px-2 py-2.5 text-left transition-colors duration-[var(--dur-hover)] hover:bg-white/[0.03] ${focusRing}`}
                    style={{ background: focused ? 'rgba(184,149,90,0.08)' : undefined, boxShadow: focused ? `inset 2px 0 0 ${C.gold}` : undefined }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-[background-color,border-color] duration-[var(--dur-state)]"
                      style={{ border: `1.5px solid ${done ? C.gold : 'rgba(232,228,220,0.3)'}`, background: done ? C.gold : 'transparent' }}
                    >
                      {done && <Check size={14} strokeWidth={2.4} color={C.ink} className="animate-in zoom-in-50 fade-in duration-200" />}
                    </span>
                    <span className="min-w-0 flex-1" style={{ fontFamily: SANS, fontSize: 14, color: done ? C.paper3 : C.paper, textDecoration: done ? 'line-through' : undefined, textDecorationColor: 'rgba(232,228,220,0.3)' }}>
                      {i.label}
                    </span>
                    {i.id === 'agua' && day.waterMl > 0 && <span className="shrink-0" style={{ fontFamily: SANS, fontSize: 12, color: C.paper3 }}>{day.waterMl} ml</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto pt-3">
            <Button variant="secondary" size="sm" className="w-full" disabled={allDone} onClick={markAll} title={allDone ? 'Tudo já está marcado' : undefined}>
              Marcar tudo como concluído
            </Button>
          </div>
        </div>
      </Panel>

      {/* ================= Registro ================= */}
      <MoodPanel todayLog={todayLog} lastLog={logs.find((l) => l.date !== today())} onSaved={(l) => setLogs((cur) => [l, ...cur.filter((x) => x.date !== l.date)])} />

      {/* ================= Detalhes do corpo ================= */}
      <Dialog open={details} onOpenChange={setDetails}>
        <DialogContent className="border-white/10 bg-[#0F1114] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">Como a voz acontece no corpo</DialogTitle>
            <DialogDescription>Um caminho só: o ar sobe, vira som e ganha corpo.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[200px_1fr]">
            <VoiceBodyMap set="producao" showLabels={false} className="mx-auto h-[280px] w-full max-w-[200px]" />
            {/* TODO(Laury): validar este texto. */}
            <ol className="space-y-3" style={{ fontFamily: SANS, fontSize: 14.5, color: C.paper2, lineHeight: 1.55 }}>
              <li><b style={{ color: C.paper }}>Diafragma</b> — músculo abaixo dos pulmões que ajuda a controlar a saída do ar. É o apoio da voz.</li>
              <li><b style={{ color: C.paper }}>Traqueia</b> — o tubo por onde o ar sobe dos pulmões até a garganta.</li>
              <li><b style={{ color: C.paper }}>Laringe</b> — onde ficam as pregas vocais. Elas vibram com o ar e o som nasce ali.</li>
              <li><b style={{ color: C.paper }}>Cavidades de ressonância</b> — boca, nariz e rosto dão corpo, brilho e volume a esse som.</li>
              <li className="pt-1" style={{ fontSize: 13, color: C.paper3 }}>Sentiu dor, rouquidão que não passa ou desconforto? Procure um profissional.</li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- água ---------- */

function WaterCard({ ml, goal, canUndo, onAdd, onUndo, onGoal }: {
  ml: number; goal: number | null; canUndo: boolean; onAdd: (ml: number) => void; onUndo: () => void; onGoal: (ml: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const pct = goal ? Math.min(100, (ml / goal) * 100) : 0;
  return (
    <div className="flex flex-col justify-center gap-4 p-6 md:border-l 2xl:p-7" style={{ borderColor: C.rule, background: 'linear-gradient(90deg, rgba(9,10,12,0.55) 0%, rgba(9,10,12,0.9) 45%)' }}>
      <p style={{ fontFamily: SANS, fontSize: 14, color: C.gold }}>Já bebeu água hoje?</p>
      <p aria-live="polite">
        <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 56, color: C.paper, lineHeight: 1 }}>{ml}</span>
        <span style={{ fontFamily: SANS, fontSize: 18, color: C.paper2 }}> ml</span>
      </p>
      {goal ? (
        <div>
          <div className="h-[8px] overflow-hidden rounded-full" style={{ background: 'rgba(232,228,220,0.08)' }}>
            <div className="h-full rounded-full transition-[width] duration-[var(--dur-progress)] ease-[var(--ease-out)]" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #B8955A, #D9B77A)' }} />
          </div>
          <p className="mt-1.5 flex justify-between" style={{ fontFamily: SANS, fontSize: 13, color: C.paper3 }}>
            <span>Sua meta: {goal} ml</span>
            <button type="button" onClick={() => { setDraft(String(goal)); setEditing(true); }} className={`rounded-sm underline underline-offset-4 ${focusRing}`} style={{ color: C.gold }}>alterar</button>
          </p>
        </div>
      ) : !editing ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.paper3, lineHeight: 1.45 }}>
          O Cantare não define quanto você deve beber.{' '}
          <button type="button" onClick={() => { setDraft(''); setEditing(true); }} className={`rounded-sm underline underline-offset-4 ${focusRing}`} style={{ color: C.gold }}>Definir minha meta</button>
        </p>
      ) : null}

      {editing && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number(draft.replace(/\D/g, ''));
            onGoal(v > 0 ? v : null);
            setEditing(false);
          }}
        >
          <Input autoFocus inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Meta de água em ml" placeholder="ml por dia" className="h-9 w-28 border-white/15 bg-background" />
          <Button size="sm" type="submit">Salvar</Button>
          <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(false)}>Cancelar</Button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onAdd(200)}>+200 ml</Button>
        <Button variant="secondary" onClick={() => onAdd(300)}>+300 ml</Button>
        <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Desfazer último registro de água" title="Desfazer último registro">
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
}

/* ---------- registro de percepção ---------- */

function MoodPanel({ todayLog, lastLog, onSaved }: { todayLog?: VoiceLog; lastLog?: VoiceLog; onSaved: (l: VoiceLog) => void }) {
  const [mood, setMood] = useState<Mood | null>(todayLog?.mood ?? null);
  const [note, setNote] = useState(todayLog?.note ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const dirty = mood !== (todayLog?.mood ?? null) || (note.trim() || '') !== (todayLog?.note ?? '');

  const guidance = useMemo(() => {
    const m = todayLog?.mood;
    if (m === 'ruim' || m === 'cansada') return 'Hoje sua voz parece cansada. Reduza o esforço e priorize recuperação. Dor ou rouquidão que não passa? Procure um profissional.';
    if (m === 'bem' || m === 'otima') return 'Vai cantar hoje? Faça o aquecimento antes.';
    if (m === 'normal') return 'Mantenha os cuidados básicos: água, aquecimento e pausas.';
    return null;
  }, [todayLog]);

  const save = () => {
    if (!mood || state === 'saving') return;
    setState('saving');
    window.setTimeout(() => {
      try {
        const entry = saveLog(mood, note);
        onSaved(entry);
        setState('saved');
        toast.success('Registro salvo.');
        window.setTimeout(() => setState('idle'), 1400);
      } catch (err) {
        console.error(err);
        setState('idle');
        toast.error('Não foi possível salvar seu registro agora. Tente novamente.');
      }
    }, 250);
  };

  return (
    <Panel title="Como sua voz está hoje?" subtitle="Sua percepção, para acompanhar ao longo dos dias." labelledBy="registro" className="max-lg:order-5 lg:col-span-3">
      <div role="radiogroup" aria-label="Como sua voz está hoje" className="grid grid-cols-5 gap-1.5">
        {MOODS.map((m) => {
          const sel = mood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => setMood(m.id)}
              className={`flex flex-col items-center gap-1 rounded-[8px] py-2 transition-[background-color,transform,border-color] duration-[var(--dur-hover)] hover:bg-white/[0.04] active:scale-95 ${focusRing}`}
              style={{ border: `1px solid ${sel ? m.color : 'transparent'}`, background: sel ? `${m.color}1f` : undefined }}
            >
              <Face curve={m.curve} color={sel ? m.color : 'rgba(232,228,220,0.45)'} />
              <span style={{ fontFamily: SANS, fontSize: 11.5, color: sel ? C.paper : C.paper3 }}>{m.label}</span>
            </button>
          );
        })}
      </div>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 200))}
        rows={2}
        placeholder="Alguma observação? (opcional)"
        aria-label="Observação sobre a voz hoje"
        className="mt-3 border-white/10 bg-background text-[14px]"
      />
      <p className="mt-1 text-right" style={{ fontFamily: SANS, fontSize: 11, color: C.paper3 }}>{note.length}/200</p>
      <Button className="mt-2 w-full" disabled={!mood || (!dirty && state !== 'saved')} loading={state === 'saving'} loadingLabel="Salvando registro" success={state === 'saved'} onClick={save} title={!mood ? 'Escolha como sua voz está' : undefined}>
        {todayLog ? 'Atualizar registro' : 'Salvar registro'}
      </Button>
      {guidance ? (
        <p className="mt-3" style={{ fontFamily: SANS, fontSize: 12.5, color: C.paper2, lineHeight: 1.45 }}>{guidance}</p>
      ) : lastLog ? (
        <p className="mt-3" style={{ fontFamily: SANS, fontSize: 12.5, color: C.paper3 }}>
          Último registro: {MOODS.find((m) => m.id === lastLog.mood)?.label.toLowerCase()} em {new Date(`${lastLog.date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}.
        </p>
      ) : null}
    </Panel>
  );
}

function Face({ curve, color }: { curve: number; color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <circle cx="15" cy="15" r="12" fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx="11" cy="12.5" r="1.3" fill={color} />
      <circle cx="19" cy="12.5" r="1.3" fill={color} />
      <path d={`M10 ${19 - curve / 3} Q15 ${19 + curve} 20 ${19 - curve / 3}`} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CategoryMark({ id, color }: { id: CategoryId; color: string }) {
  const s = { stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden className="shrink-0 transition-transform duration-[var(--dur-hover)] group-hover:-translate-y-0.5">
      {id === 'hidratacao' && <path d="M15 4c4 5.5 7 9.3 7 13a7 7 0 0 1-14 0c0-3.7 3-7.5 7-13z" {...s} fill={`${color}33`} />}
      {id === 'descanso' && <path d="M20 5a10 10 0 1 0 5 16 8 8 0 0 1-5-16z" {...s} fill={`${color}26`} />}
      {id === 'ambiente' && <path d="M6 24c0-10 7-17 18-18-1 11-8 18-18 18zm0 0 9-9" {...s} fill={`${color}22`} />}
      {id === 'alimentacao' && (<><path d="M15 10c-5-3-10 0-10 6 0 5 4 10 7 10 1.5 0 2-.6 3-.6s1.5.6 3 .6c3 0 7-5 7-10 0-6-5-9-10-6z" {...s} fill={`${color}22`} /><path d="M15 10c0-3 1.5-5 4-6" {...s} /></>)}
      {id === 'aquecimento' && (<><path d="M4 22h22" {...s} strokeOpacity={0.5} /><path d="M8 22c0-5 3-9 7-9s7 4 7 9" {...s} /><path d="M15 5v3M8 8l2 2M22 8l-2 2" {...s} /></>)}
    </svg>
  );
}
