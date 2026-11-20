// Outils du tableau de bord (projets, rappels), repris de l'artefact.

/** Nombre de jours entre aujourd'hui et une date AAAA-MM-JJ (négatif = passé). */
export function joursAvant(date: string, auj: string): number {
  return Math.round((Date.parse(date) - Date.parse(auj)) / 864e5);
}

/** Avancement d'un projet : part des actions faites, ou 100 % s'il est terminé sans actions. */
export function avancement(statut: string, actions: { statut: string }[]): number {
  return actions.length ? Math.round(actions.filter(a => a.statut === 'Fait').length / actions.length * 100) : statut === 'Terminé' ? 100 : 0;
}

export type Echeance = { texte: string; ton: 'b' | 'w' | null };

/** Libellé d'échéance : retard et jour même en rouge, J-7 en orange, sinon la date seule. */
export function echeance(date: string | null, fait: boolean, auj: string, fr: (d: string) => string): Echeance {
  if (!date) return { texte: '—', ton: null };
  if (fait) return { texte: fr(date), ton: null };
  const n = joursAvant(date, auj);
  if (n < 0) return { texte: `${fr(date)} · ${-n} j de retard`, ton: 'b' };
  if (n === 0) return { texte: "Aujourd'hui", ton: 'b' };
  if (n <= 7) return { texte: `${fr(date)} · J-${n}`, ton: 'w' };
  return { texte: fr(date), ton: null };
}

export type Rappel = { type: 'Projet' | 'Action'; titre: string; projetId: string; projet: string; responsable: string | null; date: string };

/** Échéances de projets et d'actions non terminés, à 7 jours ou moins (retards compris), triées par date. */
export function rappels(projets: { id: string; nom: string; statut: string; echeance: string; responsable: string }[],
  actions: { projet_id: string; titre: string; statut: string; echeance: string | null; responsable: string | null }[], auj: string): Rappel[] {
  const out: Rappel[] = [];
  for (const p of projets) {
    if (p.statut !== 'Terminé' && joursAvant(p.echeance, auj) <= 7) out.push({ type: 'Projet', titre: p.nom, projetId: p.id, projet: p.nom, responsable: p.responsable, date: p.echeance });
  }
  for (const a of actions) {
    const p = projets.find(x => x.id === a.projet_id);
    if (p && a.statut !== 'Fait' && a.echeance && joursAvant(a.echeance, auj) <= 7) out.push({ type: 'Action', titre: a.titre, projetId: p.id, projet: p.nom, responsable: a.responsable, date: a.echeance });
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}
