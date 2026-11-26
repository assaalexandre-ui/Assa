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
import { transmettreContact } from '../actions';

type Sortie = { id: string; date: string; lieu: string; commune: string | null; equipe: string | null; participants: number | null; rencontres: number | null; contacts: string | null; bilan: string | null };

/** Lignes de contacts non vides, dans l'ordre (le numéro de ligne sert à la transmission). */
const lignes = (c: string | null) => (c ?? '').split('\n').map(x => x.trim()).filter(Boolean);

export default async function Evangelisation({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['sorties', 'contacts'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('evangelisation');
  const w = s.droits.evangelisation === 'w';
  const supabase = await createClient();
  const [{ data: so }, { data: tr }] = await Promise.all([
    supabase.from('sortie').select('id, date, lieu, commune, equipe, participants, rencontres, contacts, bilan').order('date', { ascending: false }),
    supabase.from('contact_transmis').select('sortie_id, ligne'),
  ]);
  const sorties = (so ?? []) as Sortie[];
  const transmis = new Set(((tr ?? []) as { sortie_id: string; ligne: number }[]).map(x => `${x.sortie_id}:${x.ligne}`));
  const base = `/evangelisation/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();

  let corps: React.ReactNode;
  if (sous === 'sorties') {
    const list = sorties.filter(x => !q || [x.lieu, x.commune, x.equipe, x.contacts].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <Kpis items={[['Sorties', sorties.length], ['Personnes rencontrées', sorties.reduce((t, x) => t + (x.rencontres ?? 0), 0)],
          ['Contacts recueillis', sorties.reduce((t, x) => t + lignes(x.contacts).length, 0), `${transmis.size} transmis à l'ADNH`]]} />
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un lieu, une équipe, un contact" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouvelle sortie</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Lieu</th><th>Équipe</th><th className="num">Rencontrées</th><th className="num">Contacts</th></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frDate(x.date)}</LienFiche></td><td><b>{x.lieu}</b>{x.commune && <span className="muted"> · {x.commune}</span>}</td>
                <td>{x.equipe || '—'}</td><td className="num">{x.rencontres ?? '—'}</td><td className="num">{lignes(x.contacts).length}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucune sortie" texte="Les sorties d'évangélisation apparaîtront ici." />}</Panel>
      </>
    );
  } else {
    const tous = sorties.flatMap(x => lignes(x.contacts).map((l, i) => ({ x, l, i, fait: transmis.has(`${x.id}:${i}`) })));
    const peutTransmettre = w || s.droits.adnh === 'w';
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Chaque contact peut être transmis à l&apos;ADNH : une fiche « nouveau » est créée pour qu&apos;il soit appelé et intégré.</p>
        <Panel>{tous.length ? (
          <div className="tw"><table><thead><tr><th>Sortie</th><th>Contact</th><th /></tr></thead>
            <tbody>{tous.map(c => (
              <tr key={`${c.x.id}:${c.i}`}><td>{frDate(c.x.date)} · {c.x.lieu}</td><td>{c.l}</td>
                <td style={{ textAlign: 'right' }}>{c.fait ? <Pill c="g">Transmis à l&apos;ADNH</Pill> : peutTransmettre ? <BoutonAction action={transmettreContact.bind(null, c.x.id, c.i)}>Transmettre à l&apos;ADNH</BoutonAction> : <Pill c="w">À transmettre</Pill>}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun contact recueilli" texte="Les contacts saisis dans les sorties apparaissent ici." />}</Panel>
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche && sous === 'sorties') {
    const nouveau = sp.fiche === 'nouveau';
    const v = sorties.find(x => x.id === sp.fiche);
    if ((nouveau && w) || v) fenetre = (
      <Modal titre={nouveau ? "Nouvelle sortie d'évangélisation" : `Sortie · ${v!.lieu}`} retour={base}>
        <FicheForm entite="sortie" id={nouveau ? null : sp.fiche} valeurs={(v ?? { date: today() }) as Record<string, string | number | null>} ro={!w} suppression={w} retour={base} />
      </Modal>
    );
  }
  return (<><PageHead id="evangelisation" sous={sous} />{corps}{fenetre}</>);
}
