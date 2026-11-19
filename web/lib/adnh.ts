export type LigneStat = { mois: string; venus: number; appeles: number; integres: number; taux: number };

/** Statistiques ADNH par mois (venus, appelés, intégrés, taux d'intégration arrondi), du plus récent au plus ancien. */
export function statsParMois(nouveaux: { date_venue: string; statut: string; appels: number }[]): LigneStat[] {
  const m = new Map<string, LigneStat>();
  for (const n of nouveaux) {
    const k = (n.date_venue || '').slice(0, 7);
    if (!k) continue;
    const l = m.get(k) ?? { mois: k, venus: 0, appeles: 0, integres: 0, taux: 0 };
    l.venus++;
    if (n.appels > 0) l.appeles++;
    if (n.statut === 'intégré') l.integres++;
    m.set(k, l);
  }
  return [...m.values()].map(l => ({ ...l, taux: Math.round((l.integres / l.venus) * 100) })).sort((a, b) => b.mois.localeCompare(a.mois));
}
