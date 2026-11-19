import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { BoutonAction } from '@/components/BoutonAction';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, today } from '@/lib/format';
import { basculerTache } from '../actions';

type Reunion = { id: string; date: string; instance: string; assemblee_id: string | null; lieu: string | null; objet: string; presents: string | null; discussions: string | null; decisions: string | null };
type Tache = { id: string; titre: string; responsable: string; echeance: string | null; statut: string; reunion_id: string | null; notes: string | null };
const lignes = (t: string | null) => (t ?? '').split('\n').map(x => x.trim()).filter(Boolean);

export default async function Reunions({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['historique', 'objets', 'decisions', 'taches'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('reunions');
  const w = s.droits.reunions === 'w';
  const supabase = await createClient();
  const [{ data: r }, { data: t }, { data: a }] = await Promise.all([
    supabase.from('reunion').select('id, date, instance, assemblee_id, lieu, objet, presents, discussions, decisions').order('date', { ascending: false }),
    supabase.from('tache').select('id, titre, responsable, echeance, statut, reunion_id, notes').order('echeance', { nullsFirst: false }),
    supabase.from('assemblee').select('id, nom').order('nom'),
  ]);
  const reunions = (r ?? []) as Reunion[], taches = (t ?? []) as Tache[];
  const optAss = (a ?? []).map(x => [x.id, x.nom] as [string, string]);
  const optReunions = reunions.map(x => [x.id, `${frDate(x.date)} · ${x.objet}`] as [string, string]);
  const base = `/reunions/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const auj = today();
  const nouvelle = w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>{sous === 'taches' ? '+ Nouvelle tâche' : '+ Nouvelle réunion'}</Link>;

  let corps: React.ReactNode;
  if (sous === 'historique') {
    const list = reunions.filter(x => !q || [x.objet, x.discussions, x.decisions].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Historique de toutes les réunions : date, instance, objet, points discutés, décisions et tâches.</p>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{nouvelle}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Instance</th><th>Objet</th><th className="num">Points</th><th className="num">Décisions</th><th className="num">Tâches faites</th></tr></thead>
            <tbody>{list.map(x => { const tt = taches.filter(y => y.reunion_id === x.id); return (
              <tr key={x.id}><td>{frDate(x.date)}</td><td><Pill>{x.instance}</Pill></td><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.objet}</LienFiche></td>
                <td className="num">{lignes(x.discussions).length}</td><td className="num">{lignes(x.decisions).length}</td>
                <td className="num">{tt.length ? `${tt.filter(y => y.statut === 'Terminée').length} / ${tt.length}` : '—'}</td></tr>); })}</tbody></table></div>
        ) : <Empty titre="Aucune réunion" texte="Les comptes rendus des réunions apparaîtront ici." />}</Panel>
      </>
    );
  } else if (sous === 'objets') {
    const list = reunions.filter(x => !q || [x.objet, x.discussions].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un objet ou un point" /><div className="actions">{nouvelle}</div></div>
        {list.length ? list.map(x => (
          <Panel key={x.id} titre={x.objet} droite={<div className="actions"><Pill>{x.instance}</Pill><span className="muted">{frDate(x.date)}</span><Link className="link" href={`${base}?fiche=${x.id}`} scroll={false}>Ouvrir</Link></div>}>
            <div className="body">{lignes(x.discussions).length ? <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>{lignes(x.discussions).map((p, i) => <li key={i}>{p}</li>)}</ol>
              : <p className="muted" style={{ margin: 0 }}>Aucun point noté pour cette réunion.</p>}</div>
          </Panel>
        )) : <Panel><Empty titre={q ? 'Aucun résultat' : 'Aucune réunion'} texte="Les objets et les points discutés de chaque réunion apparaîtront ici." /></Panel>}
      </>
    );
  } else if (sous === 'decisions') {
    const all = reunions.flatMap(x => lignes(x.decisions).map(d => ({ x, d }))).filter(({ x, d }) => !q || (d + ' ' + x.objet).toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une décision" /></div>
        <Panel>{all.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Instance</th><th>Réunion</th><th>Décision</th></tr></thead>
            <tbody>{all.map(({ x, d }, i) => <tr key={i}><td>{frDate(x.date)}</td><td><Pill>{x.instance}</Pill></td><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.objet}</LienFiche></td><td><b>{d}</b></td></tr>)}</tbody></table></div>
        ) : <Empty titre="Aucune décision" texte="Les décisions notées dans les comptes rendus apparaissent ici." />}</Panel>
      </>
    );
  } else {
    const f = sp.f ?? 'nonfaites';
    const list = taches.filter(x => (f === 'faites' ? x.statut === 'Terminée' : f === 'nonfaites' ? x.statut !== 'Terminée' : true) && (!q || [x.titre, x.responsable].join(' ').toLowerCase().includes(q)));
    const ici = `${base}?f=${f}`;
    corps = (
      <>
        <Kpis items={[['Pas faites', taches.filter(x => x.statut !== 'Terminée').length], ['En retard', taches.filter(x => x.statut !== 'Terminée' && x.echeance && x.echeance < auj).length], ['Faites', taches.filter(x => x.statut === 'Terminée').length]]} />
        <div className="toolbar">
          <div className="actions" role="group" aria-label="Filtrer les tâches">{[['nonfaites', 'Pas faites'], ['faites', 'Faites'], ['toutes', 'Toutes']].map(([k, l]) => <Link key={k} className={'btn sm' + (f === k ? ' primary' : '')} href={`${base}?f=${k}`} aria-pressed={f === k}>{l}</Link>)}</div>
          <div className="actions">{nouvelle}</div>
        </div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Tâche</th><th>Responsable</th><th>Échéance</th><th>Réunion</th><th>Fait ?</th><th /></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?f=${f}&fiche=${x.id}`}>{x.titre}</LienFiche></td><td>{x.responsable}</td><td>{frDate(x.echeance)}</td>
                <td>{reunions.find(y => y.id === x.reunion_id)?.objet ?? '—'}</td>
                <td>{x.statut === 'Terminée' ? <Pill c="g">Fait</Pill> : x.echeance && x.echeance < auj ? <Pill c="b">Pas fait · en retard</Pill> : <Pill c="w">Pas fait</Pill>}</td>
                <td style={{ textAlign: 'right' }}>{w && <BoutonAction action={basculerTache.bind(null, x.id, x.statut !== 'Terminée', ici)}>{x.statut === 'Terminée' ? 'Rouvrir' : 'Marquer fait'}</BoutonAction>}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucune tâche" texte="Les tâches confiées par le conseil apparaîtront ici." />}</Panel>
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche) {
    const nouveau = sp.fiche === 'nouveau';
    const retour = sous === 'taches' ? `${base}?f=${sp.f ?? 'nonfaites'}` : base;
    if (sous === 'taches') {
      const v = taches.find(x => x.id === sp.fiche);
      if ((nouveau && w) || v) fenetre = <Modal titre={v ? v.titre : 'Nouvelle tâche du conseil'} retour={retour}><FicheForm entite="tache" id={nouveau ? null : sp.fiche} valeurs={v ?? { statut: 'À faire' }} dyn={{ reunions: optReunions }} ro={!w} suppression={w} retour={retour} /></Modal>;
    } else {
      const v = reunions.find(x => x.id === sp.fiche);
      if ((nouveau && w) || v) fenetre = <Modal titre={v ? v.objet : 'Nouvelle réunion'} retour={retour}><FicheForm entite="reunion" id={nouveau ? null : sp.fiche} valeurs={v ?? { date: auj, instance: 'Conseil' }} dyn={{ assemblees: optAss }} ro={!w} suppression={w} retour={retour} /></Modal>;
    }
  }
  return (<><PageHead id="reunions" sous={sous} />{corps}{fenetre}</>);
}
