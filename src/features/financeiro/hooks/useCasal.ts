import { useMemo } from 'react';
import { useAuth } from '../../auth/hooks/authContext';
import type { Person } from '../lib/types';

export interface MembroCasal {
  value: Person;
  label: string;
}

export interface CasalInfo {
  /** Both members, in the order the backend returns them (membro A, membro B). */
  membros: MembroCasal[];
  /** Slug of the logged-in user — "quem sou eu". */
  euSlug: Person;
  /** Human label for a slug, falling back to the slug itself. */
  labelDe: (slug: Person) => string;
}

/**
 * Couple members as the backend knows them. This replaces the old hardcoded
 * `PESSOAS` constant: the slugs an expense's `paidBy` can hold are whatever
 * `/auth/me` returned for this session, not a literal union baked into the
 * frontend.
 *
 * Only usable inside `RequireAuth`, where a session is guaranteed.
 */
export function useCasal(): CasalInfo {
  const { sessao } = useAuth();

  return useMemo(() => {
    if (!sessao) {
      throw new Error('useCasal precisa de uma sessão ativa (use dentro de <RequireAuth>).');
    }

    const membros = sessao.couple.members.length ? sessao.couple.members : [sessao.user];
    const opcoes = membros.map((m) => ({ value: m.slug, label: m.name }));
    const labels = new Map(opcoes.map((o) => [o.value, o.label]));

    return {
      membros: opcoes,
      euSlug: sessao.user.slug,
      labelDe: (slug: Person) => labels.get(slug) ?? slug,
    };
  }, [sessao]);
}
