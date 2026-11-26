import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, today } from '@/lib/format';

type Ceremonie = { id: string; type: string; date: string; personnes: string; officiant: string | null; lieu: string | null; notes: string | null };

// Sous-menu → types de cérémonie qu'il regroupe (le premier est proposé à l'ajout), comme dans l'artefact.
const TYPES: Record<string, string[]> = {
  baptemes: ['Baptême'], saintecene: ['Sainte-Cène'], mariages: ['Mariage', "Présentation d'enfant"], consecrations: ['Consécration'], obseques: ['Obsèques'],
};

export default async function Ceremonies({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  const types = TYPES[sous];
  if (!types) notFound();
  const sp = await searchParams;
  const s = await requireMenu('ceremonies');
  const w = s.droits.ceremonies === 'w';
  const supabase = await createClient();
  const { data } = await supabase.from('ceremonie').select('id, type, date, personnes, officiant, lieu, notes').in('type', types).order('date', { ascending: false });
  const registre = (data ?? []) as Ceremonie[];
  const base = `/ceremonies/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const list = registre.filter(x => !q || [x.personnes, x.officiant, x.lieu].join(' ').toLowerCase().includes(q));
  const annee = today().slice(0, 4);

  let fenetre: React.ReactNode = null;
  if (sp.fiche) {
    const nouveau = sp.fiche === 'nouveau';
    const v = registre.find(x => x.id === sp.fiche);
    if ((nouveau && w) || v) fenetre = (
      <Modal titre={nouveau ? 'Ajouter au registre' : `${v!.type} · ${frDate(v!.date)}`} retour={base}>
        <FicheForm entite="ceremonie" id={nouveau ? null : sp.fiche} valeurs={(v ?? { type: types[0], date: today() }) as Record<string, string | null>} ro={!w} suppression={w} retour={base} />
      </Modal>
    );
  }
  return (
    <>
      <PageHead id="ceremonies" sous={sous} />
      <Kpis items={[['Dans le registre', registre.length], [`En ${annee}`, registre.filter(x => x.date.startsWith(annee)).length], ['Dernière', registre[0] ? frDate(registre[0].date) : '—']]} />
      <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une personne, un officiant" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Ajouter au registre</Link>}</div></div>
      <Panel>{list.length ? (
        <div className="tw"><table><thead><tr><th>Date</th><th>Type</th><th>Personne(s)</th><th>Officiant</th><th>Lieu</th></tr></thead>
          <tbody>{list.map(x => (
            <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frDate(x.date)}</LienFiche></td><td><Pill c="a">{x.type}</Pill></td><td><b>{x.personnes}</b></td><td>{x.officiant || '—'}</td><td>{x.lieu || '—'}</td></tr>
          ))}</tbody></table></div>
      ) : <Empty titre="Registre vide" texte="Les cérémonies enregistrées apparaîtront ici." />}</Panel>
      {fenetre}
    </>
  );
}
