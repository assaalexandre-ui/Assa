import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, Kpis, LienFiche, Panel, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, today } from '@/lib/format';

type Comptage = { id: string; date: string; culte: string; hommes: number | null; femmes: number | null; enfants: number | null; nouveaux: number | null; notes: string | null };
type Poste = { id: string; date: string; poste: string; agent: string; contact: string | null; places: number | null; observations: string | null };
const total = (c: Comptage) => (c.hommes ?? 0) + (c.femmes ?? 0) + (c.enfants ?? 0);

export default async function JourDeCulte({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['comptage', 'accueil'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('culte');
  const w = s.droits.culte === 'w';
  const supabase = await createClient();
  const base = `/culte/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  let corps: React.ReactNode, fenetre: React.ReactNode = null;

  if (sous === 'comptage') {
    const { data } = await supabase.from('comptage').select('id, date, culte, hommes, femmes, enfants, nouveaux, notes').order('date', { ascending: false });
    const rows = (data ?? []) as Comptage[];
    const huit = rows.slice(0, 8);
    const moyenne = huit.length ? Math.round(huit.reduce((t, c) => t + total(c), 0) / huit.length) : null;
    const list = rows.filter(c => !q || [c.culte, c.notes].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <Kpis items={[['Moyenne des 8 derniers comptages', moyenne ?? '—'], ['Nouveaux (8 derniers)', huit.reduce((t, c) => t + (c.nouveaux ?? 0), 0)]]} />
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Saisir un comptage</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Culte</th><th className="num">Hommes</th><th className="num">Femmes</th><th className="num">Enfants</th><th className="num">Nouveaux</th><th className="num">Total</th></tr></thead>
            <tbody>{list.map(c => (
              <tr key={c.id}><td><LienFiche href={`${base}?fiche=${c.id}`}>{frDate(c.date)}</LienFiche></td><td>{c.culte}</td>
                <td className="num">{c.hommes ?? '—'}</td><td className="num">{c.femmes ?? '—'}</td><td className="num">{c.enfants ?? '—'}</td><td className="num">{c.nouveaux ?? '—'}</td><td className="num"><b>{total(c)}</b></td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun comptage" texte="Saisissez le nombre d'hommes, de femmes et d'enfants à chaque culte." />}</Panel>
      </>
    );
    const v = rows.find(c => c.id === sp.fiche);
    if ((sp.fiche === 'nouveau' && w) || v) fenetre = <Modal titre={v ? `Comptage du ${frDate(v.date)}` : 'Saisir un comptage'} retour={base}><FicheForm entite="comptage" id={v ? v.id : null} valeurs={v ?? { date: today(), culte: 'Culte du dimanche – 1er service' }} ro={!w} suppression={w} retour={base} /></Modal>;
  } else {
    const { data } = await supabase.from('poste_accueil').select('id, date, poste, agent, contact, places, observations').order('date', { ascending: false });
    const rows = (data ?? []) as Poste[];
    const list = rows.filter(p => !q || [p.poste, p.agent, p.observations].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Affecter un poste</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Poste</th><th>Agent</th><th>Contact</th><th className="num">Places</th><th>Observations</th></tr></thead>
            <tbody>{list.map(p => (
              <tr key={p.id}><td><LienFiche href={`${base}?fiche=${p.id}`}>{frDate(p.date)}</LienFiche></td><td>{p.poste}</td><td>{p.agent}</td>
                <td className="mono">{p.contact || '—'}</td><td className="num">{p.places ?? '—'}</td><td className="muted">{(p.observations ?? '').slice(0, 80)}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun poste affecté" texte="Affectez les agents d'accueil et de parking pour chaque culte." />}</Panel>
      </>
    );
    const v = rows.find(p => p.id === sp.fiche);
    if ((sp.fiche === 'nouveau' && w) || v) fenetre = <Modal titre={v ? `${v.poste} · ${frDate(v.date)}` : "Affecter un poste d'accueil"} retour={base}><FicheForm entite="poste_accueil" id={v ? v.id : null} valeurs={v ?? { date: today() }} ro={!w} suppression={w} retour={base} /></Modal>;
  }
  return (<><PageHead id="culte" sous={sous} />{corps}{fenetre}</>);
}
