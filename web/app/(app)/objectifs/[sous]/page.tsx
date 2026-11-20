import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, today } from '@/lib/format';

type Objectif = { id: string; libelle: string; but: string | null; mesure: string; cible: number; realise: number | null; date_debut: string | null; date_fin: string;
  departement_id: string | null; responsable: string | null; valeur: number; statut: 'Atteint' | 'En cours' | 'Non atteint' };

const ton = (st: string) => (st === 'Atteint' ? 'g' : st === 'Non atteint' ? 'b' : 'w') as 'g' | 'b' | 'w';
const chiffre = (v: number) => Math.round(Number(v) || 0).toLocaleString('fr-FR').replace(/[  ]/g, ' ');

export default async function Objectifs({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['objectifs', 'resultats'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('objectifs');
  const w = s.droits.objectifs === 'w';
  const supabase = await createClient();
  const [{ data: o }, { data: d }] = await Promise.all([
    supabase.from('objectif_suivi').select('id, libelle, but, mesure, cible, realise, date_debut, date_fin, departement_id, responsable, valeur, statut').order('date_fin'),
    supabase.from('departement').select('id, nom').order('ordre'),
  ]);
  const objectifs = ((o ?? []) as Objectif[]).map(x => ({ ...x, cible: Number(x.cible), valeur: Number(x.valeur) }));
  const deps = (d ?? []) as { id: string; nom: string }[];
  const nomDep = (id: string | null) => (id ? deps.find(x => x.id === id)?.nom ?? '—' : '—');
  const base = `/objectifs/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();

  let corps: React.ReactNode;
  if (sous === 'objectifs') {
    const list = objectifs.filter(x => !q || [x.libelle, x.but, x.responsable, nomDep(x.departement_id)].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        {!w && <div className="banner info">Les objectifs sont fixés par l&apos;administrateur. Vous suivez ici leur avancement.</div>}
        <p className="lead" style={{ margin: 0 }}>Chaque objectif a un but, une cible, une échéance et une mesure : automatique à partir des données de l&apos;application, ou saisie à la main.</p>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un objectif" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Fixer un objectif</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Objectif</th><th>Mesure</th><th>Département</th><th>Échéance</th><th>Avancement</th><th>Statut</th></tr></thead>
            <tbody>{list.map(x => {
              const p = x.cible ? Math.min(100, Math.round(x.valeur / x.cible * 100)) : 0;
              return (
                <tr key={x.id}>
                  <td><LienFiche href={`${base}?fiche=${x.id}`}>{x.libelle}</LienFiche>{x.but && <><br /><span className="muted" style={{ fontSize: 12.5 }}>But : {x.but.slice(0, 90)}</span></>}</td>
                  <td>{x.mesure === 'manuel' ? <Pill c="n">Manuelle</Pill> : <Pill c="a">Automatique</Pill>}</td>
                  <td>{nomDep(x.departement_id)}</td><td>{frDate(x.date_fin)}</td>
                  <td><div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 180 }}><span className="meter" style={{ flex: 1 }}><i className={p >= 100 ? 'full' : ''} style={{ width: `${p}%` }} /></span><span className="mono">{chiffre(x.valeur)} / {chiffre(x.cible)}</span></div></td>
                  <td><Pill c={ton(x.statut)}>{x.statut}</Pill></td>
                </tr>
              );
            })}</tbody></table></div>
        ) : <Empty titre="Aucun objectif" texte={w ? 'Fixez le premier objectif de l’année.' : "L'administrateur n'a pas encore fixé d'objectif."} />}</Panel>
      </>
    );
  } else {
    const groupe = (st: Objectif['statut']) => objectifs.filter(x => x.statut === st);
    const bloc = (st: Objectif['statut']) => {
      const l = groupe(st);
      return (
        <Panel key={st} titre={`${st} (${l.length})`}>{l.length ? (
          <div className="tw"><table><thead><tr><th>Objectif</th><th>Département</th><th>Résultat</th><th>Échéance</th><th>But</th></tr></thead>
            <tbody>{l.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.libelle}</LienFiche></td><td>{nomDep(x.departement_id)}</td>
                <td><Pill c={ton(st)}>{chiffre(x.valeur)} / {chiffre(x.cible)}</Pill></td><td>{frDate(x.date_fin)}</td><td className="muted">{x.but || '—'}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun" texte="" />}</Panel>
      );
    };
    corps = (
      <>
        <Kpis items={[['Objectifs', objectifs.length], ['Atteints', groupe('Atteint').length], ['En cours', groupe('En cours').length], ['Non atteints', groupe('Non atteint').length]]} />
        {bloc('En cours')}{bloc('Atteint')}{bloc('Non atteint')}
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche) {
    const nouveau = sp.fiche === 'nouveau';
    const v = objectifs.find(x => x.id === sp.fiche);
    const annee = today().slice(0, 4);
    if ((nouveau && w) || v) {
      const valeurs: Record<string, string | number | null> = v ? { libelle: v.libelle, but: v.but, mesure: v.mesure, cible: v.cible, realise: v.realise, date_debut: v.date_debut, date_fin: v.date_fin, departement_id: v.departement_id, responsable: v.responsable }
        : { mesure: 'manuel', date_debut: annee + '-01-01', date_fin: annee + '-12-31' };
      fenetre = (
        <Modal titre={nouveau ? 'Fixer un objectif' : v!.libelle} retour={base}>
          {v && <p className="muted" style={{ margin: 0 }}>Résultat actuel : <b>{chiffre(v.valeur)} / {chiffre(v.cible)}</b> · <Pill c={ton(v.statut)}>{v.statut}</Pill></p>}
          <FicheForm entite="objectif" id={nouveau ? null : sp.fiche} valeurs={valeurs} dyn={{ departements: deps.map(x => [x.id, x.nom]) }} ro={!w} suppression={w} retour={base} />
        </Modal>
      );
    }
  }
  return (<><PageHead id="objectifs" sous={sous} />{corps}{fenetre}</>);
}
