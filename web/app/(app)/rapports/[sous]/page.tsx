import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { BoutonPdf } from '@/components/BoutonPdf';
import { Empty, Panel } from '@/components/ui';
import { requireMenu, type Session } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, fullName, money, today } from '@/lib/format';
import { PERIODES, RUBRIQUES, periodeDe, type Rapport, type Rubrique, type SectionRapport } from '@/lib/rapport';
import { NIVEAUX, THEMES, recommandations, type Donnees, type Theme } from '@/lib/recommandations';

type Supa = Awaited<ReturnType<typeof createClient>>;
const dans = (d: string | null | undefined, a: string, b: string) => !!d && d >= a && d <= b;
const lignes = (t: string | null | undefined) => (t ?? '').split('\n').map(x => x.trim()).filter(Boolean);

// Menu qu'il faut pouvoir lire pour chaque rubrique (comme dans l'artefact).
const REQUIS: Record<Rubrique, 'cellules' | 'stats' | 'projets' | 'dons' | 'reco'> = { structure: 'cellules', stats: 'stats', projets: 'projets', finances: 'dons', reco: 'reco' };

async function structure(sb: Supa, a: string, b: string): Promise<SectionRapport> {
  const [{ data: nv }, { data: rc }, { data: re }, { data: ta }, { data: rd }, { data: ce }, { data: fi }, { data: be }, { data: ra }, { data: de }, { data: gc }, { data: se }, { data: cl }] = await Promise.all([
    sb.from('nouveau').select('date_venue, statut, appel(id)'),
    sb.from('rapport_cellule').select('cellule_id, date'),
    sb.from('reunion').select('date, instance, objet, decisions').gte('date', a).lte('date', b).order('date'),
    sb.from('tache').select('statut'),
    sb.from('rapport_departement').select('departement_id, periode, statut'),
    sb.from('cellule').select('id, nom, berger_id').order('nom'),
    sb.from('fidele').select('cellule_id, berger_id, gc_id'),
    sb.from('berger').select('id, nom, prenoms').order('nom'),
    sb.from('releve_absence').select('berger_id, semaine, absence(fidele_id)'),
    sb.from('departement').select('id, nom, responsable, membres, ordre').order('ordre'),
    sb.from('gc').select('id, nom, tribu, responsables, ordre').order('ordre'),
    sb.from('session_formation').select('classe, date_debut, date_fin, inscription_formation(valide)').order('date_debut'),
    sb.from('classe').select('numero, nom'),
  ]);
  const nouveaux = (nv ?? []).filter(x => dans(x.date_venue, a, b));
  const reunions = re ?? [], fideles = fi ?? [], rapCel = (rc ?? []).filter(x => dans(x.date, a, b));
  const rapDep = (rd ?? []).filter(x => dans(x.periode + '-15', a, b));
  const taches = ta ?? [];
  const lundi = (s: string) => { const [y, w] = s.split('-W').map(Number); const d = new Date(Date.UTC(y, 0, 4)); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() || 7) - 1) + (w - 1) * 7); return d.toISOString().slice(0, 10); };
  const nomClasse = (n: number) => (cl ?? []).find(x => x.numero === n)?.nom ?? '';
  return {
    t: "Structure de l'église",
    kpis: [['Nouveaux venus', String(nouveaux.length)], ['Nouveaux appelés', String(nouveaux.filter(x => (x.appel as unknown[]).length).length)],
      ['Nouveaux intégrés', String(nouveaux.filter(x => x.statut === 'intégré').length)], ['Rapports de cellule', String(rapCel.length)],
      ['Réunions tenues', String(reunions.length)], ['Décisions prises', String(reunions.reduce((t, r) => t + lignes(r.decisions).length, 0))],
      ['Tâches du conseil faites', `${taches.filter(x => x.statut === 'Terminée').length} / ${taches.length}`], ['Rapports de département', String(rapDep.length)]],
    tables: [
      { t: 'Cellules', head: ['Cellule', 'Berger', 'Membres', 'Rapports sur la période'], rows: (ce ?? []).map(c => [c.nom, fullName((be ?? []).find(x => x.id === c.berger_id)), String(fideles.filter(f => f.cellule_id === c.id).length), String(rapCel.filter(r => r.cellule_id === c.id).length)]) },
      { t: 'Bergers', head: ['Berger', 'Brebis', 'Absences relevées sur la période'], rows: (be ?? []).map(x => [fullName(x), String(fideles.filter(f => f.berger_id === x.id).length),
        String((ra ?? []).filter(r => r.berger_id === x.id && dans(lundi(r.semaine), a, b)).reduce((t, r) => t + (r.absence as unknown[]).length, 0))]) },
      { t: 'Départements', head: ['Département', 'Responsable', 'Membres', 'Rapport'], rows: (de ?? []).map(d => { const r = rapDep.find(x => x.departement_id === d.id); return [d.nom, d.responsable || '—', String((d.membres as string[]).length), r ? r.statut : 'Non remis']; }) },
      { t: 'Groupes de communion', head: ['GC', 'Tribu', 'Membres', 'Responsables'], rows: (gc ?? []).map(g => [g.nom, g.tribu || '—', String(fideles.filter(f => f.gc_id === g.id).length), `${(g.responsables as string[]).filter(x => x.trim()).length} / 5`]) },
      { t: 'Formations', head: ['Classe', 'Départ', 'Fin', 'Inscrits', 'Validés'], rows: (se ?? []).filter(x => x.date_fin >= a && x.date_debut <= b).map(x => {
        const ins = x.inscription_formation as { valide: boolean }[];
        return [`Classe ${x.classe}${nomClasse(x.classe) ? ' : ' + nomClasse(x.classe) : ''}`, frDate(x.date_debut), frDate(x.date_fin), String(ins.length), String(ins.filter(i => i.valide).length)];
      }) },
      { t: 'Réunions', head: ['Date', 'Instance', 'Objet', 'Décisions'], rows: reunions.map(r => [frDate(r.date), r.instance, r.objet, lignes(r.decisions).join(' ; ') || '—']) },
    ],
  };
}

async function stats(sb: Supa, s: Session, a: string, b: string): Promise<SectionRapport> {
  const [{ data: fi }, { data: co }, { data: so }, { data: ob }] = await Promise.all([
    sb.from('fidele').select('classe, berger_id'),
    sb.from('comptage').select('hommes, femmes, enfants').gte('date', a).lte('date', b),
    s.droits.evangelisation ? sb.from('sortie').select('contacts').gte('date', a).lte('date', b) : Promise.resolve({ data: null }),
    sb.from('objectif_suivi').select('libelle, but, mesure, cible, valeur, date_fin, statut').order('date_fin'),
  ]);
  const fideles = fi ?? [], c = co ?? [], obj = ob ?? [];
  const fmt = (v: number, m: string) => (m === 'dons' ? money(v) : Math.round(Number(v)).toLocaleString('fr-FR').replace(/[  ]/g, ' '));
  return {
    t: 'Statistiques et objectifs',
    kpis: [['Fidèles enregistrés', String(fideles.length)],
      ['Présence moyenne aux cultes', c.length ? String(Math.round(c.reduce((t, x) => t + (x.hommes ?? 0) + (x.femmes ?? 0) + (x.enfants ?? 0), 0) / c.length)) : '—'],
      ['Fidèles en formation', String(fideles.filter(f => f.classe != null).length)], ['Fidèles sans berger', String(fideles.filter(f => !f.berger_id).length)],
      ["Contacts d'évangélisation", so ? String(so.reduce((t, x) => t + lignes(x.contacts).length, 0)) : '—'],
      ['Objectifs atteints', `${obj.filter(o => o.statut === 'Atteint').length} / ${obj.length}`]],
    tables: [{ t: 'Objectifs à atteindre', head: ['Objectif', 'But', 'Cible', 'Résultat', 'Échéance', 'Statut'],
      rows: obj.map(o => [o.libelle, o.but || '—', fmt(o.cible, o.mesure), fmt(o.valeur, o.mesure), frDate(o.date_fin), o.statut]) }],
  };
}

async function projets(sb: Supa): Promise<SectionRapport> {
  const [{ data: pr }, { data: ac }] = await Promise.all([
    sb.from('projet').select('id, nom, responsable, echeance, statut, budget').order('echeance'),
    sb.from('projet_action').select('projet_id, titre, responsable, echeance, statut'),
  ]);
  const p = pr ?? [], a = ac ?? [], auj = today();
  const avance = (id: string, st: string) => { const l = a.filter(x => x.projet_id === id); return l.length ? Math.round(l.filter(x => x.statut === 'Fait').length / l.length * 100) : st === 'Terminé' ? 100 : 0; };
  const retard = a.filter(x => x.statut !== 'Fait' && x.echeance && x.echeance < auj);
  return {
    t: 'Projets',
    kpis: [['Projets en cours', String(p.filter(x => x.statut === 'En cours').length)], ['Terminés', String(p.filter(x => x.statut === 'Terminé').length)],
      ['Actions en retard', String(retard.length)], ['Budget des projets', money(p.reduce((t, x) => t + Number(x.budget ?? 0), 0))]],
    tables: [
      { t: 'Projets', head: ['Projet', 'Responsable', 'Échéance', 'Avancement', 'Statut'], rows: p.map(x => [x.nom, x.responsable, frDate(x.echeance), avance(x.id, x.statut) + ' %', x.statut]) },
      { t: 'Actions en retard', head: ['Action', 'Projet', 'Responsable', 'Échéance'], rows: retard.map(x => [x.titre, p.find(y => y.id === x.projet_id)?.nom ?? '—', x.responsable || '—', frDate(x.echeance)]) },
    ],
  };
}

async function finances(sb: Supa, a: string, b: string): Promise<SectionRapport> {
  const [{ data: dn }, { data: dp }, { data: fo }] = await Promise.all([
    sb.from('don').select('montant, canal, fonds_id').gte('date', a).lte('date', b),
    sb.from('depense').select('date, objet, statut, montant').gte('date', a).lte('date', b).in('statut', ['Validée', 'Payée']).order('date'),
    sb.from('fonds').select('id, nom'),
  ]);
  const rec = dn ?? [], dep = dp ?? [];
  const somme = (l: { montant: number }[]) => l.reduce((t, x) => t + Number(x.montant), 0);
  const grouper = (cle: (x: (typeof rec)[number]) => string) => { const m = new Map<string, number>(); rec.forEach(x => m.set(cle(x), (m.get(cle(x)) ?? 0) + Number(x.montant))); return [...m.entries()].sort((x, y) => y[1] - x[1]).map(([n, v]) => [n, money(v)]); };
  return {
    t: 'Finances',
    kpis: [['Encaissé', money(somme(rec))], ['Dépensé', money(somme(dep))], ['Solde de la période', money(somme(rec) - somme(dep))], ["Nombre d'encaissements", String(rec.length)]],
    tables: [
      { t: 'Encaissements par fonds', head: ['Fonds', 'Montant'], rows: grouper(x => (fo ?? []).find(f => f.id === x.fonds_id)?.nom ?? 'Sans fonds') },
      { t: 'Encaissements par moyen de paiement', head: ['Moyen', 'Montant'], rows: grouper(x => x.canal) },
      { t: 'Dépenses', head: ['Date', 'Objet', 'Statut', 'Montant'], rows: dep.map(x => [frDate(x.date), x.objet, x.statut, money(x.montant)]) },
    ],
  };
}

async function reco(sb: Supa): Promise<SectionRapport> {
  const { data } = await sb.rpc('donnees_recommandations');
  const r = data ? recommandations(data as Donnees) : null;
  const toutes = r ? Object.values(r).flat() : [];
  return {
    t: 'Recommandations',
    kpis: [['Recommandations', String(toutes.length)], ['Priorité haute', String(toutes.filter(x => x.niveau === 'haute').length)],
      ['À surveiller', String(toutes.filter(x => x.niveau === 'moyenne').length)], ['Conseils', String(toutes.filter(x => x.niveau === 'conseil').length)]],
    tables: (Object.keys(THEMES) as Theme[]).map(th => ({ t: THEMES[th], head: ['Niveau', 'Domaine', 'Constat', 'Que faire'], rows: (r?.[th] ?? []).map(x => [NIVEAUX[x.niveau][0], x.domaine, x.constat, x.conseil]) })),
  };
}

export default async function Rapports({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { sous } = await params;
  if (sous !== 'generer') notFound();
  const sp = await searchParams;
  const s = await requireMenu('rapports');
  const un = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined));
  const dispo = RUBRIQUES.filter(([k]) => !!s.droits[REQUIS[k]]);
  const type = un('type') === 'partiel' ? 'partiel' : 'complet';
  const periode = PERIODES.some(([k]) => k === un('periode')) ? un('periode')! : 'mois';
  const cochees = ([] as string[]).concat(sp.rub ?? []);
  const rubs = type === 'complet' ? dispo.map(([k]) => k) : dispo.map(([k]) => k).filter(k => cochees.includes(k));
  const afficher = un('voir') === '1';
  const [a, b] = periodeDe(periode, today(), un('debut'), un('fin'));

  let rapport: Rapport | null = null;
  if (afficher && rubs.length) {
    const sb = await createClient();
    const { data: eg } = await sb.from('eglise').select('nom, nom_complet').single();
    const secs: SectionRapport[] = [];
    for (const k of rubs) {
      if (k === 'structure') secs.push(await structure(sb, a, b));
      if (k === 'stats') secs.push(await stats(sb, s, a, b));
      if (k === 'projets') secs.push(await projets(sb));
      if (k === 'finances') secs.push(await finances(sb, a, b));
      if (k === 'reco') secs.push(await reco(sb));
    }
    rapport = { titre: `Rapport ${type} — ${eg?.nom_complet || eg?.nom || 'EMCV'}`, periode: `Du ${frDate(a)} au ${frDate(b)}`, genere: `Établi le ${frDate(today())} par ${s.profil.nom}`, a, b, secs };
  }

  return (
    <>
      <PageHead id="rapports" sous={sous} />
      <Panel titre="Paramètres du rapport">
        <div className="body">
          <form className="form" action="">
            <input type="hidden" name="voir" value="1" />
            <div className="field"><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}>Type de rapport</span>
              <div className="actions" role="radiogroup" aria-label="Type de rapport">
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="radio" name="type" value="complet" defaultChecked={type === 'complet'} /> Complet</label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="radio" name="type" value="partiel" defaultChecked={type === 'partiel'} /> Partiel</label>
              </div></div>
            <div className="field"><label htmlFor="r-periode">Période</label>
              <select id="r-periode" name="periode" defaultValue={periode}>{PERIODES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="field"><label htmlFor="r-debut">Du (période personnalisée)</label><input id="r-debut" type="date" name="debut" defaultValue={un('debut') ?? ''} /></div>
            <div className="field"><label htmlFor="r-fin">Au</label><input id="r-fin" type="date" name="fin" defaultValue={un('fin') ?? ''} /></div>
            <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 5 }}>Rubriques d&apos;un rapport partiel (un rapport complet les prend toutes)</legend>
              <div className="actions">{dispo.map(([k, l]) => (
                <label key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" name="rub" value={k} defaultChecked={type === 'complet' || cochees.includes(k)} style={{ width: 18, height: 18 }} /> {l}</label>
              ))}</div>
            </fieldset>
            <div className="field full"><div className="actions"><button className="btn primary" type="submit">Afficher le rapport</button>{rapport && <BoutonPdf rapport={rapport} />}</div></div>
          </form>
        </div>
      </Panel>
      {afficher && !rubs.length && <Panel><Empty titre="Aucune rubrique" texte="Cochez au moins une rubrique pour un rapport partiel." /></Panel>}
      {rapport && (
        <article className="panel report">
          <div className="rep-head"><span className="crumb">EMCV</span><h2>{rapport.titre}</h2><p className="muted" style={{ margin: '2px 0 0' }}>{rapport.periode} · {rapport.genere}</p></div>
          {rapport.secs.map(sec => (
            <div className="rep-sec" key={sec.t}>
              <h3>{sec.t}</h3>
              <div className="tw"><table><tbody>{sec.kpis.map(([l, v]) => <tr key={l}><td>{l}</td><td className="num"><b>{v}</b></td></tr>)}</tbody></table></div>
              {sec.tables.map(tb => (
                <div key={tb.t}>
                  <h4>{tb.t}</h4>
                  {tb.rows.length ? (
                    <div className="tw"><table><thead><tr>{tb.head.map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>{tb.rows.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j}>{x}</td>)}</tr>)}</tbody></table></div>
                  ) : <p className="muted" style={{ margin: '0 0 8px' }}>Aucune donnée sur la période.</p>}
                </div>
              ))}
            </div>
          ))}
        </article>
      )}
    </>
  );
}
