import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { BoutonAction } from '@/components/BoutonAction';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frMonth, today } from '@/lib/format';
import { statuerRapport } from '../actions';

type Dep = { id: string; nom: string; responsable: string | null; membres: string[]; ordre: number | null };
type Rapport = { id: string; departement_id: string; periode: string; activites: string | null; resultats: string | null; difficultes: string | null; effectif: number | null; statut: string };
type Obj = { departement_id: string | null; statut: string };

const tonRapport = (st: string) => (st === 'Validé' ? 'g' : st === 'À revoir' ? 'b' : 'w') as 'g' | 'b' | 'w';

export default async function Supervision({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['departements', 'rapports'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('pilotage');
  const w = s.droits.pilotage === 'w';
  const supabase = await createClient();
  const auj = today(), mois = auj.slice(0, 7);
  const [{ data: d }, { data: r }, { data: p }, { data: o }] = await Promise.all([
    supabase.from('departement').select('id, nom, responsable, membres, ordre').order('ordre'),
    supabase.from('rapport_departement').select('id, departement_id, periode, activites, resultats, difficultes, effectif, statut').order('periode', { ascending: false }),
    supabase.from('planning_service').select('departement_id').gte('date', auj),
    supabase.from('objectif_suivi').select('departement_id, statut'),
  ]);
  const deps = (d ?? []) as Dep[], rapports = (r ?? []) as Rapport[], creneaux = (p ?? []) as { departement_id: string }[], objectifs = (o ?? []) as Obj[];
  const nomDep = (id: string) => deps.find(x => x.id === id)?.nom ?? '—';
  const base = `/pilotage/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();

  let corps: React.ReactNode;
  if (sous === 'departements') {
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Suivi opérationnel de chaque département : responsable, effectif, service à venir, dernier rapport et objectifs.</p>
        <Panel>{deps.length ? (
          <div className="tw"><table><thead><tr><th>Département</th><th>Responsable</th><th className="num">Membres</th><th className="num">Créneaux à venir</th><th>Rapport du mois</th><th>Objectifs</th></tr></thead>
            <tbody>{deps.map(x => {
              const rap = rapports.find(y => y.departement_id === x.id);
              const obj = objectifs.filter(y => y.departement_id === x.id), att = obj.filter(y => y.statut === 'Atteint').length;
              return (
                <tr key={x.id}>
                  <td><b>{x.nom}</b></td><td>{x.responsable || '—'}</td><td className="num">{x.membres.length}</td>
                  <td className="num">{creneaux.filter(c => c.departement_id === x.id).length}</td>
                  <td>{rap && rap.periode === mois ? <Pill c={tonRapport(rap.statut)}>{rap.statut}</Pill> : <Pill c="b">{rap ? 'Dernier : ' + frMonth(rap.periode) : 'Aucun rapport'}</Pill>}</td>
                  <td>{obj.length ? `${att} / ${obj.length} atteint${att > 1 ? 's' : ''}` : <span className="muted">—</span>}</td>
                </tr>
              );
            })}</tbody></table></div>
        ) : <Empty titre="Aucun département" texte={s.profil.role_code === 'resp_dep' ? "Votre compte n'est pas encore relié à un département : demandez-le à l'administration." : 'Les départements apparaîtront ici.'} />}</Panel>
      </>
    );
  } else {
    const list = rapports.filter(x => !q || [nomDep(x.departement_id), x.activites, x.resultats, x.difficultes].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Rapports mensuels remis par les responsables de département.{w ? ' Ouvrez un rapport pour le valider ou le renvoyer.' : ''}</p>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un rapport" /></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Mois</th><th>Département</th><th>Activités</th><th>Difficultés</th><th>Statut</th></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?rapport=${x.id}`}>{frMonth(x.periode)}</LienFiche></td><td><b>{nomDep(x.departement_id)}</b></td>
                <td className="muted">{(x.activites ?? '').slice(0, 70) || '—'}</td><td className="muted">{(x.difficultes ?? '').slice(0, 70) || '—'}</td>
                <td><Pill c={tonRapport(x.statut)}>{x.statut}</Pill></td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun rapport" texte="Les rapports mensuels des départements apparaîtront ici." />}</Panel>
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  const rap = sp.rapport ? rapports.find(x => x.id === sp.rapport) : undefined;
  if (rap) {
    fenetre = (
      <Modal titre={`${nomDep(rap.departement_id)} · ${frMonth(rap.periode)}`} retour={base} pied={<>
        {w ? <div className="actions">
          {rap.statut !== 'Validé' && <BoutonAction className="btn primary" action={statuerRapport.bind(null, rap.id, 'Validé')}>Valider le rapport</BoutonAction>}
          {rap.statut !== 'À revoir' && <BoutonAction className="btn" action={statuerRapport.bind(null, rap.id, 'À revoir')}>Renvoyer à revoir</BoutonAction>}
        </div> : <span />}
        <Link className="btn" href={base} scroll={false}>Fermer</Link></>}>
        <dl className="kv">
          <dt>Statut</dt><dd><Pill c={tonRapport(rap.statut)}>{rap.statut}</Pill></dd>
          <dt>Membres actifs</dt><dd>{rap.effectif ?? '—'}</dd>
          <dt>Activités réalisées</dt><dd style={{ whiteSpace: 'pre-line' }}>{rap.activites || '—'}</dd>
          <dt>Résultats</dt><dd style={{ whiteSpace: 'pre-line' }}>{rap.resultats || '—'}</dd>
          <dt>Difficultés et besoins</dt><dd style={{ whiteSpace: 'pre-line' }}>{rap.difficultes || '—'}</dd>
        </dl>
      </Modal>
    );
  }
  return (<><PageHead id="pilotage" sous={sous} />{corps}{fenetre}</>);
}
