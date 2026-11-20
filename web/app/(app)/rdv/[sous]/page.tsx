import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, today } from '@/lib/format';

type Rdv = { id: string; date: string; heure: string | null; personne: string; contact: string | null; type: string; pasteur: string | null; motif: string | null; statut: string; notes: string | null };

export default async function RendezVous({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['avenir', 'historique'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('rdv');
  const w = s.droits.rdv === 'w';
  const supabase = await createClient();
  const { data } = await supabase.from('rdv').select('id, date, heure, personne, contact, type, pasteur, motif, statut, notes').order('date');
  const tous = (data ?? []) as Rdv[];
  const auj = today(), avenir = sous === 'avenir';
  const q = (sp.q ?? '').trim().toLowerCase();
  const list = tous.filter(r => (avenir ? r.date >= auj && r.statut !== 'Fait' : r.date < auj || r.statut === 'Fait') && (!q || [r.personne, r.motif, r.pasteur].join(' ').toLowerCase().includes(q)));
  if (!avenir) list.reverse();
  const base = `/rdv/${sous}`;
  const v = tous.find(r => r.id === sp.fiche);
  return (
    <>
      <PageHead id="rdv" sous={sous} />
      <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && avenir && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouveau rendez-vous</Link>}</div></div>
      <Panel>{list.length ? (
        <div className="tw"><table><thead><tr><th>Date</th><th>Personne</th><th>Motif</th><th>Pasteur</th><th>Type</th><th>Statut</th></tr></thead>
          <tbody>{list.map(r => (
            <tr key={r.id}><td>{frDate(r.date)}{r.heure ? ' · ' + r.heure : ''}</td><td><LienFiche href={`${base}?fiche=${r.id}`}>{r.personne}</LienFiche></td><td>{r.motif || '—'}</td>
              <td>{r.pasteur || '—'}</td><td><Pill>{r.type}</Pill></td><td><Pill c={r.statut === 'Fait' ? 'g' : r.statut === 'Annulé' ? 'n' : 'w'}>{r.statut}</Pill></td></tr>
          ))}</tbody></table></div>
      ) : <Empty titre={avenir ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous passé'} texte="Les rendez-vous, visites et appels pastoraux apparaîtront ici." />}</Panel>
      {sp.fiche === 'nouveau' && w && <Modal titre="Nouveau rendez-vous" retour={base}><FicheForm entite="rdv" valeurs={{ date: auj, statut: 'Prévu', type: 'Bureau' }} ro={false} retour={base} /></Modal>}
      {v && <Modal titre={`${v.personne} · ${frDate(v.date)}`} retour={base}><FicheForm entite="rdv" id={v.id} valeurs={v} ro={!w} suppression={w} retour={base} /></Modal>}
    </>
  );
}
