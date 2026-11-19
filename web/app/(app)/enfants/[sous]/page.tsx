import Link from 'next/link';
import { notFound } from 'next/navigation';
import { randomInt } from 'node:crypto';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { BoutonAction } from '@/components/BoutonAction';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, today } from '@/lib/format';
import { pointer } from '../actions';

type Enfant = { id: string; nom: string; date_naissance: string | null; groupe: string | null; parent: string; contact: string | null; code: string | null; notes: string | null };
const nouveauCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(32)]).join('');

export default async function Enfants({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['inscrits', 'pointage'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('enfants');
  const w = s.droits.enfants === 'w';
  const supabase = await createClient();
  const { data } = await supabase.from('enfant').select('id, nom, date_naissance, groupe, parent, contact, code, notes').order('nom');
  const enfants = (data ?? []) as Enfant[];
  const base = `/enfants/${sous}`;

  let corps: React.ReactNode;
  if (sous === 'inscrits') {
    const q = (sp.q ?? '').trim().toLowerCase();
    const list = enfants.filter(e => !q || [e.nom, e.parent, e.code].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un enfant, un parent ou un code" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Inscrire un enfant</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Enfant</th><th>Classe d&apos;âge</th><th>Parent</th><th>Contact</th><th>Code</th></tr></thead>
            <tbody>{list.map(e => <tr key={e.id}><td><LienFiche href={`${base}?fiche=${e.id}`}>{e.nom}</LienFiche></td><td>{e.groupe || '—'}</td><td>{e.parent}</td><td className="mono">{e.contact || '—'}</td><td className="mono">{e.code || '—'}</td></tr>)}</tbody></table></div>
        ) : <Empty titre="Aucun enfant inscrit" texte="Inscrivez les enfants de l'école du dimanche." />}</Panel>
      </>
    );
  } else {
    const date = sp.date || today();
    const { data: p } = await supabase.from('pointage_enfant').select('enfant_id, arrivee, sortie').eq('date', date);
    const pt = new Map((p ?? []).map(x => [x.enfant_id as string, x as { arrivee: boolean; sortie: boolean }]));
    const presents = [...pt.values()].filter(x => x.arrivee).length, enSalle = [...pt.values()].filter(x => x.arrivee && !x.sortie).length;
    const ici = `${base}?date=${date}`;
    corps = (
      <>
        <div className="toolbar">
          <form className="actions" action={base}><label htmlFor="pdate" className="muted" style={{ fontWeight: 600, fontSize: 12.5 }}>Dimanche du</label><input className="sel" type="date" id="pdate" name="date" defaultValue={date} /><button className="btn sm" type="submit">Afficher</button></form>
          <div className="actions"><Pill c="a">{presents} présents</Pill>{enSalle ? <Pill c="w">{enSalle} encore en salle</Pill> : presents ? <Pill c="g">Tous récupérés</Pill> : null}</div>
        </div>
        <Panel>{enfants.length ? (
          <div className="tw"><table><thead><tr><th>Enfant</th><th>Classe d&apos;âge</th><th>Parent</th><th>Code</th><th>Arrivée</th><th>Sortie</th></tr></thead>
            <tbody>{enfants.map(e => { const x = pt.get(e.id); return (
              <tr key={e.id}><td><b>{e.nom}</b></td><td>{e.groupe || '—'}</td><td>{e.parent}<br /><span className="mono muted">{e.contact ?? ''}</span></td><td className="mono">{e.code || '—'}</td>
                <td>{w ? <BoutonAction action={pointer.bind(null, e.id, date, 'arrivee', ici)}>{x?.arrivee ? 'Présent ✓' : 'Pointer'}</BoutonAction> : x?.arrivee ? <Pill c="a">Présent</Pill> : '—'}</td>
                <td>{x?.arrivee ? (w ? <BoutonAction action={pointer.bind(null, e.id, date, 'sortie', ici)}>{x.sortie ? 'Récupéré ✓' : 'Remettre au parent'}</BoutonAction> : x.sortie ? <Pill c="g">Récupéré</Pill> : <Pill c="w">En salle</Pill>) : '—'}</td></tr>); })}</tbody></table></div>
        ) : <Empty titre="Aucun enfant inscrit" texte="Inscrivez d'abord les enfants." />}</Panel>
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Avant de remettre un enfant, vérifiez que le parent présente le bon code. Le {frDate(date)}.</p>
      </>
    );
  }
  const v = enfants.find(e => e.id === sp.fiche);
  const fenetre = sp.fiche === 'nouveau' && w
    ? <Modal titre="Inscrire un enfant" retour={base}><FicheForm entite="enfant" valeurs={{ code: nouveauCode() }} ro={false} retour={base} /></Modal>
    : v ? <Modal titre={v.nom} retour={base}><FicheForm entite="enfant" id={v.id} valeurs={v} ro={!w} suppression={w} retour={base} /></Modal> : null;
  return (<><PageHead id="enfants" sous={sous} />{corps}{fenetre}</>);
}
