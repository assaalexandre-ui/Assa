import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { FormAction } from '@/components/FormAction';
import { BoutonAction } from '@/components/BoutonAction';
import { Champ } from '@/components/Champ';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, money, today } from '@/lib/format';
import { TYPES_JOURNAL } from '@/lib/entites';
import { avancement, echeance, joursAvant, rappels, type Rappel } from '@/lib/tableau';
import { ajouterAction, ajouterJournal, retirerAction, statutAction } from '../actions';

type Projet = { id: string; nom: string; description: string | null; responsable: string; departement_id: string | null; date_debut: string; echeance: string; priorite: string; statut: string; budget: number | null };
type Action = { id: string; projet_id: string; titre: string; responsable: string | null; echeance: string | null; statut: string; notes: string | null };
type Note = { id: string; projet_id: string; date: string; type: string; texte: string };

const MOIS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const tonStatut = (st: string) => (st === 'Terminé' ? 'g' : st === 'En pause' ? 'n' : st === 'En cours' ? 'a' : 'w') as 'g' | 'n' | 'a' | 'w';
const tonAction = (st: string) => (st === 'Fait' ? 'g' : st === 'En cours' ? 'a' : 'w') as 'g' | 'a' | 'w';
const tonJournal = (t: string) => (t === 'Difficulté' ? 'b' : t === 'Décision' ? 'a' : 'n') as 'b' | 'a' | 'n';

export default async function Projets({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['projets', 'actions', 'planning', 'rappels'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('projets');
  const w = s.droits.projets === 'w';
  const supabase = await createClient();
  const [{ data: p }, { data: a }, { data: j }, { data: d }, { data: dp }, { data: dl }] = await Promise.all([
    supabase.from('projet').select('id, nom, description, responsable, departement_id, date_debut, echeance, priorite, statut, budget').order('echeance'),
    supabase.from('projet_action').select('id, projet_id, titre, responsable, echeance, statut, notes').order('echeance', { nullsFirst: false }),
    supabase.from('projet_journal').select('id, projet_id, date, type, texte').order('date', { ascending: false }),
    supabase.from('departement').select('id, nom').order('ordre'),
    supabase.rpc('depenses_projets'),
    s.droits.budget ? supabase.from('depense').select('id, projet_id, date, objet, statut, montant').not('projet_id', 'is', null).order('date', { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const depense = (id: string) => Number(((dp ?? []) as { projet_id: string; depense: number }[]).find(x => x.projet_id === id)?.depense ?? 0);
  const depensesLiees = (dl ?? []) as { id: string; projet_id: string; date: string; objet: string; statut: string; montant: number }[];
  const projets = (p ?? []) as Projet[], actions = (a ?? []) as Action[], journal = (j ?? []) as Note[], deps = (d ?? []) as { id: string; nom: string }[];
  const auj = today();
  const base = `/projets/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const actionsDe = (id: string) => actions.filter(x => x.projet_id === id);
  const av = (x: Projet) => avancement(x.statut, actionsDe(x.id));
  const nomDep = (id: string | null) => (id ? deps.find(x => x.id === id)?.nom ?? '—' : '—');
  const Ech = ({ date, fait }: { date: string | null; fait: boolean }) => { const e = echeance(date, fait, auj, frDate); return e.ton ? <Pill c={e.ton}>{e.texte}</Pill> : <>{e.texte}</>; };
  const lienProjet = (id: string) => `${base}?${new URLSearchParams({ ...(sp.f ? { f: sp.f } : {}), ...(sp.annee ? { annee: sp.annee } : {}), projet: id })}`;
  const r = rappels(projets, actions, auj);

  const tableRappels = (l: Rappel[]) => (
    <div className="tw"><table><thead><tr><th>Échéance</th><th>Type</th><th>Intitulé</th><th>Projet</th><th>Responsable</th></tr></thead>
      <tbody>{l.map((x, i) => (
        <tr key={x.projetId + x.titre + i}><td><Ech date={x.date} fait={false} /></td><td><Pill c={x.type === 'Projet' ? 'a' : 'n'}>{x.type}</Pill></td>
          <td><LienFiche href={lienProjet(x.projetId)}>{x.titre}</LienFiche></td><td>{x.projet}</td><td>{x.responsable || '—'}</td></tr>
      ))}</tbody></table></div>
  );

  let corps: React.ReactNode;
  if (sous === 'projets') {
    const list = projets.filter(x => !q || [x.nom, x.description, x.responsable].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <Kpis items={[['Projets en cours', projets.filter(x => x.statut === 'En cours').length], ['À lancer', projets.filter(x => x.statut === 'À lancer').length],
          ['Terminés', projets.filter(x => x.statut === 'Terminé').length], ['Rappels', r.length, `${r.filter(x => joursAvant(x.date, auj) < 0).length} en retard`]]} />
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un projet" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouveau projet</Link>}</div></div>
        {list.length ? <div className="cards">{list.map(x => {
          const pc = av(x), la = actionsDe(x.id), fait = x.statut === 'Terminé';
          return (
            <Link key={x.id} className="card" href={lienProjet(x.id)} scroll={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}><b>{x.nom}</b><Pill c={tonStatut(x.statut)}>{x.statut}</Pill></div>
              <span className="meta">{x.responsable} · priorité {x.priorite.toLowerCase()}</span>
              <span className="meta">Échéance : <Ech date={x.echeance} fait={fait} /></span>
              <span className="meta">{la.filter(y => y.statut === 'Fait').length} / {la.length} actions · {pc} %{x.budget ? ` · ${money(depense(x.id))} / ${money(x.budget)}` : ''}</span>
              <span className="meter" aria-hidden="true"><i className={pc >= 100 ? 'full' : ''} style={{ width: `${pc}%` }} /></span>
            </Link>
          );
        })}</div> : <Panel><Empty titre="Aucun projet" texte={w ? 'Créez le premier projet.' : 'Les projets de l’église apparaîtront ici.'} /></Panel>}
      </>
    );
  } else if (sous === 'actions') {
    const f = ['afaire', 'retard', 'faites', 'toutes'].includes(sp.f ?? '') ? sp.f! : 'afaire';
    const filtre: Record<string, (x: Action) => boolean> = {
      afaire: x => x.statut !== 'Fait', retard: x => x.statut !== 'Fait' && !!x.echeance && joursAvant(x.echeance, auj) < 0, faites: x => x.statut === 'Fait', toutes: () => true,
    };
    const list = actions.filter(x => projets.some(y => y.id === x.projet_id)).filter(filtre[f]).sort((x, y) => (x.echeance || '9').localeCompare(y.echeance || '9'));
    corps = (
      <>
        <div className="actions" role="group" aria-label="Filtrer les actions">{[['afaire', 'À faire'], ['retard', 'En retard'], ['faites', 'Faites'], ['toutes', 'Toutes']].map(([k, l]) => (
          <Link key={k} className={'btn sm' + (f === k ? ' primary' : '')} href={`${base}?f=${k}`} aria-pressed={f === k}>{l}</Link>
        ))}</div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Action</th><th>Projet</th><th>Responsable</th><th>Échéance</th><th>Statut</th><th /></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><b>{x.titre}</b></td><td><LienFiche href={lienProjet(x.projet_id)}>{projets.find(y => y.id === x.projet_id)?.nom}</LienFiche></td>
                <td>{x.responsable || '—'}</td><td><Ech date={x.echeance} fait={x.statut === 'Fait'} /></td><td><Pill c={tonAction(x.statut)}>{x.statut}</Pill></td>
                <td style={{ textAlign: 'right' }}>{w && <BoutonAction action={statutAction.bind(null, x.id, x.statut === 'Fait' ? 'À faire' : 'Fait')}>{x.statut === 'Fait' ? 'Rouvrir' : 'Marquer fait'}</BoutonAction>}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucune action" texte="Ajoutez le plan d'actions depuis la fiche d'un projet." />}</Panel>
      </>
    );
  } else if (sous === 'planning') {
    const y = Number(/^\d{4}$/.test(sp.annee ?? '') ? sp.annee : auj.slice(0, 4));
    const y0 = Date.parse(`${y}-01-01`), duree = Date.parse(`${y + 1}-01-01`) - y0;
    const pos = (dt: string) => Math.min(100, Math.max(0, (Date.parse(dt) - y0) / duree * 100));
    const list = projets.filter(x => x.date_debut < `${y + 1}-01-01` && x.echeance >= `${y}-01-01`).sort((a1, b1) => a1.date_debut.localeCompare(b1.date_debut));
    const ici = auj.startsWith(String(y)) ? pos(auj) : null;
    corps = (
      <>
        <div className="toolbar">
          <div className="actions"><Link className="btn sm" href={`${base}?annee=${y - 1}`} aria-label="Année précédente">‹</Link><b style={{ fontSize: 17, minWidth: 56, textAlign: 'center' }}>{y}</b><Link className="btn sm" href={`${base}?annee=${y + 1}`} aria-label="Année suivante">›</Link></div>
          <span className="muted" style={{ fontSize: 12.5 }}>Barre : du début à l&apos;échéance · losange : échéance d&apos;une action</span>
        </div>
        <Panel><div className="tw"><div className="gantt" style={{ minWidth: 760 }}>
          <div className="g-row g-head"><div className="g-lab" /><div className="g-track">{MOIS.map((m, i) => <span key={m} style={{ left: `${i / 12 * 100}%` }}>{m}</span>)}</div></div>
          {list.length ? list.map(x => {
            const debut = pos(x.date_debut), fin = pos(x.echeance), fait = x.statut === 'Terminé', retard = !fait && joursAvant(x.echeance, auj) < 0, pc = av(x);
            return (
              <Link key={x.id} className="g-row click" href={lienProjet(x.id)} scroll={false} style={{ color: 'inherit', textDecoration: 'none' }}>
                <div className="g-lab"><b>{x.nom}</b><span className="muted">{x.responsable} · {pc} %</span></div>
                <div className="g-track">
                  {ici != null && <i className="g-today" style={{ left: `${ici}%` }} />}
                  <span className={'g-bar' + (fait ? ' done' : retard ? ' late' : '')} style={{ left: `${debut}%`, width: `${Math.max(1.2, fin - debut)}%` }} title={`${x.nom} : ${frDate(x.date_debut)} → ${frDate(x.echeance)}`}><i style={{ width: `${pc}%` }} /></span>
                  {actionsDe(x.id).filter(z => z.echeance?.startsWith(String(y))).map(z => <span key={z.id} className={'g-ms' + (z.statut === 'Fait' ? ' done' : '')} style={{ left: `${pos(z.echeance!)}%` }} title={`${z.titre} · ${frDate(z.echeance)}`} />)}
                </div>
              </Link>
            );
          }) : <div className="body muted">Aucun projet sur cette année.</div>}
        </div></div></Panel>
      </>
    );
  } else {
    const groupes: [string, (x: Rappel) => boolean][] = [['En retard', x => joursAvant(x.date, auj) < 0], ["Aujourd'hui", x => joursAvant(x.date, auj) === 0],
      ['Dans les 3 jours', x => { const n = joursAvant(x.date, auj); return n > 0 && n <= 3; }], ['Dans les 7 jours', x => joursAvant(x.date, auj) > 3]];
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Les échéances de projets et d&apos;actions non terminés, à 7 jours, à 3 jours, le jour même et en retard.</p>
        {r.length ? groupes.map(([t, f]) => { const l = r.filter(f); return l.length ? <Panel key={t} titre={`${t} (${l.length})`}>{tableRappels(l)}</Panel> : null; })
          : <Panel><Empty titre="Aucun rappel" texte="Aucune échéance dans les 7 prochains jours." /></Panel>}
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  const retour = `${base}${sp.f ? '?f=' + sp.f : sp.annee ? '?annee=' + sp.annee : ''}`;
  const pr = sp.projet ? projets.find(x => x.id === sp.projet) : undefined;
  if (pr) {
    const la = actionsDe(pr.id).sort((x, y) => (x.echeance || '9').localeCompare(y.echeance || '9'));
    const notes = journal.filter(x => x.projet_id === pr.id), pc = av(pr);
    fenetre = (
      <Modal titre={pr.nom} retour={retour} large pied={<>{w ? <Link className="btn" href={`${base}?fiche=${pr.id}`} scroll={false}>Modifier le projet</Link> : <span />}<Link className="btn" href={retour} scroll={false}>Fermer</Link></>}>
        <dl className="kv">
          <dt>Responsable</dt><dd>{pr.responsable}</dd><dt>Département</dt><dd>{nomDep(pr.departement_id)}</dd>
          <dt>Période</dt><dd>{frDate(pr.date_debut)} → <Ech date={pr.echeance} fait={pr.statut === 'Terminé'} /></dd>
          <dt>Statut</dt><dd><Pill c={tonStatut(pr.statut)}>{pr.statut}</Pill> <Pill c={pr.priorite === 'Haute' ? 'b' : 'n'}>Priorité {pr.priorite.toLowerCase()}</Pill></dd>
          {pr.description && <><dt>Objectif</dt><dd style={{ whiteSpace: 'pre-line' }}>{pr.description}</dd></>}
        </dl>
        <Kpis items={[['Avancement', pc + ' %', `${la.filter(x => x.statut === 'Fait').length} / ${la.length} actions`], ['Budget prévu', pr.budget ? money(pr.budget) : '—'],
          ['Dépensé', money(depense(pr.id)), pr.budget ? Math.round(depense(pr.id) / Number(pr.budget) * 100) + ' % du budget' : 'dépenses validées ou payées'], ['Reste', pr.budget ? money(Number(pr.budget) - depense(pr.id)) : '—']]} />
        <Panel titre="Plan d'actions">
          {la.length ? (
            <div className="tw"><table><thead><tr><th>Action</th><th>Responsable</th><th>Échéance</th><th>Statut</th><th /></tr></thead>
              <tbody>{la.map(x => (
                <tr key={x.id}><td><b>{x.titre}</b>{x.notes && <><br /><span className="muted" style={{ fontSize: 12.5 }}>{x.notes}</span></>}</td><td>{x.responsable || '—'}</td>
                  <td><Ech date={x.echeance} fait={x.statut === 'Fait'} /></td><td><Pill c={tonAction(x.statut)}>{x.statut}</Pill></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{w && <div className="actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                    <BoutonAction action={statutAction.bind(null, x.id, x.statut === 'Fait' ? 'À faire' : 'Fait')}>{x.statut === 'Fait' ? 'Rouvrir' : 'Marquer fait'}</BoutonAction>
                    <BoutonAction action={retirerAction.bind(null, x.id)} label={`Retirer l'action ${x.titre}`}>Retirer</BoutonAction>
                  </div>}</td></tr>
              ))}</tbody></table></div>
          ) : <div className="body muted">Aucune action pour le moment.</div>}
          {w && <div className="body"><FormAction action={ajouterAction} className="form" bouton="+ Ajouter l'action" boutonClasse="btn sm primary">
            <input type="hidden" name="projet_id" value={pr.id} />
            <Champ k="titre" label="Nouvelle action" full />
            <Champ k="responsable" label="Responsable" /><Champ k="echeance" label="Échéance" type="date" />
          </FormAction></div>}
        </Panel>
        {s.droits.budget && <Panel titre="Dépenses rattachées">{depensesLiees.some(x => x.projet_id === pr.id) ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Objet</th><th>Statut</th><th className="num">Montant</th></tr></thead>
            <tbody>{depensesLiees.filter(x => x.projet_id === pr.id).map(x => <tr key={x.id}><td>{frDate(x.date)}</td><td>{x.objet}</td><td><Pill c="n">{x.statut}</Pill></td><td className="num">{money(x.montant)}</td></tr>)}</tbody></table></div>
        ) : <div className="body muted">Rattachez des dépenses à ce projet depuis Budget et dépenses.</div>}</Panel>}
        <Panel titre="Journal de suivi">
          <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {w && <FormAction action={ajouterJournal} className="form" bouton="+ Ajouter au journal" boutonClasse="btn sm">
              <input type="hidden" name="projet_id" value={pr.id} />
              <Champ k="type" label="Type" type="select" options={TYPES_JOURNAL} v="Note" /><Champ k="date" label="Date" type="date" v={auj} />
              <Champ k="texte" label="Texte" type="textarea" full />
            </FormAction>}
            {notes.length ? <div className="log">{notes.map(x => (
              <div key={x.id}><b>{frDate(x.date)}</b> <Pill c={tonJournal(x.type)}>{x.type}</Pill><br /><span style={{ whiteSpace: 'pre-line' }}>{x.texte}</span></div>
            ))}</div> : <p className="muted" style={{ margin: 0 }}>Le journal est vide.</p>}
          </div>
        </Panel>
      </Modal>
    );
  } else if (sp.fiche) {
    const nouveau = sp.fiche === 'nouveau';
    const v = projets.find(x => x.id === sp.fiche);
    if ((nouveau && w) || v) {
      const valeurs = v ? { ...v } as Record<string, string | number | null> : { date_debut: auj, priorite: 'Moyenne', statut: 'À lancer' };
      fenetre = (
        <Modal titre={nouveau ? 'Nouveau projet' : 'Modifier le projet'} retour={v ? `${base}?projet=${v.id}` : base}>
          <FicheForm entite="projet" id={nouveau ? null : sp.fiche} valeurs={valeurs} dyn={{ departements: deps.map(x => [x.id, x.nom]) }} ro={!w} suppression={w} retour={nouveau ? base : `/projets/projets`} />
        </Modal>
      );
    }
  }
  return (<><PageHead id="projets" sous={sous} />{corps}{fenetre}</>);
}
