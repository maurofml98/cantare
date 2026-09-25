import { createContext, useContext } from 'react';

/**
 * Tema do design system novo (Home e Criar música, 25/09/2026). Claro é o padrão; o escuro só
 * por escolha do cantor — não segue o sistema operacional. Fica no aparelho.
 */
export type Tema = 'claro' | 'escuro';

const KEY = 'cantare:tema';

export function loadTema(): Tema {
  try {
    return localStorage.getItem(KEY) === 'escuro' ? 'escuro' : 'claro';
  } catch {
    return 'claro';
  }
}

export function saveTema(t: Tema) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* localStorage indisponível: vale até fechar a página */
  }
}

export const TemaContext = createContext<{ tema: Tema; setTema: (t: Tema) => void }>({ tema: 'claro', setTema: () => {} });

export const useTema = () => useContext(TemaContext);
