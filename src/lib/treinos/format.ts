/** Números da aba Treinos em pt-BR. */
import type { Metric } from './exercises';

export const dec = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
export const unit = (m: Metric) => (m === 'pulseCount' ? 'pulsos' : 's');
/** medição: sempre uma casa ("9,0") */
export const fmt = (v: number, m: Metric) => (m === 'pulseCount' ? `${Math.round(v)}` : dec(v));
export const fmtU = (v: number, m: Metric) => `${fmt(v, m)} ${unit(m)}`;
/** meta: inteira sem casa decimal ("8 s") */
export const fmtGoal = (v: number, m: Metric) => (Number.isInteger(v) ? `${v} ${unit(m)}` : fmtU(v, m));
