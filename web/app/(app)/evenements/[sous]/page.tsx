import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, money } from '@/lib/format';

type Ev = { id: string; titre: string; type: string; date: string; frais: number | null };
type Ins = { id: string; evenement_id: string; nom: string; contact: string | null; montant: number | null; canal: string | null; car: string | null; depart: string | null };
const AVEC_INSCRIPTION = ['Convention', 'Séminaire', 'Retraite', 'Croisade', 'Formation'];

export default async function Evenements({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['inscriptions', 'transport'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('evenements');
  const w = s.droits.evenements === 'w';
  const supabase = await createClient();
  const [{ data: e }, { data: i }] = await Promise.all([
    supabase.from('evenement').select('id, titre, type, date, frais').order('date', { ascending: false }),
    supabase.from('inscription_evenement').select('id, evenement_id, nom, contact, montant, canal, car, depart').order('nom'),
  ]);
  const evs = ((e ?? []) as Ev[]).filter(x => AVEC_INSCRIPTION.includes(x.type) || x.frais);
  const ins = (i ?? []) as Ins[];
  const evDe = (id: string) => (e ?? []).find(x => x.id === id) as Ev | undefined;
  const base = `/evenements/${sous}`;

  let corps: React.ReactNode;
  if (sous === 'inscriptions') {
    const q = (sp.q ?? '').trim().toLowerCase();
    const list = ins.filter(x => !q || [x.nom, x.contact, x.car, evDe(x.evenement_id)?.titre].join(' ').toLowerCase().includes(q));
    const resume = evs.filter(x => ins.some(y => y.evenement_id === x.id)).slice(0, 4).map(x => { const l = ins.filter(y => y.evenement_id === x.id); return [x.titre, `${l.length} inscrit${l.length > 1 ? 's' : ''}`, money(l.reduce((t, y) => t + (y.montant ?? 0), 0)) + ' encaissés'] as [string, string, string]; });
    corps = (
      <>
        {resume.length > 0 && <Kpis items={resume} />}
        {!evs.length && <p className="lead" style={{ margin: 0 }}>Programmez d&apos;abord l&apos;événement dans la Programmation (convention, séminaire, retraite), puis inscrivez les participants ici.</p>}
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && evs.length > 0 && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Inscrire une personne</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Nom</th><th>Événement</th><th>Contact</th><th>Payé</th><th>Transport</th></tr></thead>
            <tbody>{list.map(x => { const ev = evDe(x.evenement_id); const ok = ev?.frais ? (x.montant ?? 0) >= ev.frais : (x.montant ?? 0) > 0; return (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.nom}</LienFiche></td><td>{ev?.titre ?? '—'}</td><td className="mono">{x.contact || '—'}</td>
                <td>{x.montant ? <Pill c={ok ? 'g' : 'w'}>{money(x.montant)}</Pill> : <Pill c="b">Non payé</Pill>}</td><td>{[x.car, x.depart].filter(Boolean).join(' · ') || '—'}</td></tr>); })}</tbody></table></div>
        ) : <Empty titre="Aucune inscription" texte="Inscrivez les participants aux conventions, séminaires et retraites." />}</Panel>
      </>
    );
  } else {
    const g = new Map<string, { ev: Ev; car: string; depart: string; n: number }>();
    ins.forEach(x => { const ev = evDe(x.evenement_id); if (!ev) return; const k = `${ev.id}|${x.car || 'Sans car'}|${x.depart || '—'}`; const c = g.get(k) ?? { ev, car: x.car || 'Sans car', depart: x.depart || '—', n: 0 }; c.n++; g.set(k, c); });
    const list = [...g.values()].sort((a, b) => b.ev.date.localeCompare(a.ev.date) || a.car.localeCompare(b.car));
    corps = (
      <Panel>{list.length ? (
        <div className="tw"><table><thead><tr><th>Événement</th><th>Car</th><th>Point de départ</th><th className="num">Passagers</th></tr></thead>
          <tbody>{list.map((x, k) => <tr key={k}><td><b>{x.ev.titre}</b> <span className="muted">{frDate(x.ev.date)}</span></td><td>{x.car}</td><td>{x.depart}</td><td className="num">{x.n}</td></tr>)}</tbody></table></div>
      ) : <Empty titre="Aucun transport organisé" texte="Renseignez le car et le point de départ dans les inscriptions." />}</Panel>
    );
  }
  const optEv = evs.map(x => [x.id, `${x.titre} · ${frDate(x.date)}`] as [string, string]);
  const v = ins.find(x => x.id === sp.fiche);
  const fenetre = sp.fiche === 'nouveau' && w
    ? <Modal titre="Inscrire une personne" retour={base}><FicheForm entite="inscription_evenement" valeurs={{ evenement_id: evs[0]?.id ?? null }} dyn={{ evenements: optEv }} ro={false} retour={base} /></Modal>
    : v ? <Modal titre={v.nom} retour={base}><FicheForm entite="inscription_evenement" id={v.id} valeurs={v} dyn={{ evenements: optEv }} ro={!w} suppression={w} retour={base} /></Modal> : null;
  return (<><PageHead id="evenements" sous={sous} />{corps}{fenetre}</>);
}
