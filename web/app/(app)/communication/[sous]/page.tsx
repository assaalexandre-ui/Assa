import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { PreparerMessage, type Cible } from '@/components/PreparerMessage';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, fullName, today } from '@/lib/format';

type Annonce = { id: string; titre: string; date: string; jusquau: string | null; texte: string; publie: boolean };

export default async function Communication({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['annonces', 'message'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('communication');
  const w = s.droits.communication === 'w';
  if (sous === 'message' && !w) redirect('/communication/annonces');
  const supabase = await createClient();
  const base = `/communication/${sous}`;
  const auj = today();

  if (sous === 'message') {
    const [{ data: f }, { data: n }, { data: b }, { data: r }, { data: c }, { data: g }] = await Promise.all([
      supabase.from('fidele').select('nom, prenoms, telephone, cellule_id, gc_id').order('nom'),
      supabase.from('nouveau').select('nom, contact, statut').order('nom'),
      supabase.from('berger').select('nom, prenoms, contact').order('nom'),
      supabase.from('responsable').select('nom, contact, whatsapp').order('ordre'),
      supabase.from('cellule').select('id, nom').order('nom'),
      supabase.from('gc').select('id, nom, tribu').order('ordre'),
    ]);
    const fideles = (f ?? []) as { nom: string; prenoms: string | null; telephone: string | null; cellule_id: string | null; gc_id: string | null }[];
    const contact = (x: { nom: string; prenoms: string | null; telephone: string | null }) => [fullName(x), x.telephone] as [string, string | null];
    const cibles: Cible[] = [
      { cle: 'tous', libelle: 'Tous les fidèles', contacts: fideles.map(contact) },
      { cle: 'nouveaux', libelle: 'Nouveaux en suivi (ADNH)', contacts: ((n ?? []) as { nom: string; contact: string | null; statut: string }[]).filter(x => x.statut !== 'intégré').map(x => [x.nom, x.contact]) },
      { cle: 'bergers', libelle: 'Bergers', contacts: ((b ?? []) as { nom: string; prenoms: string | null; contact: string | null }[]).map(x => [fullName(x), x.contact]) },
      { cle: 'responsables', libelle: 'Annuaire des responsables', contacts: ((r ?? []) as { nom: string; contact: string | null; whatsapp: string | null }[]).map(x => [x.nom, x.whatsapp || x.contact]) },
      ...((c ?? []) as { id: string; nom: string }[]).map(x => ({ cle: 'cel:' + x.id, libelle: 'Cellule ' + x.nom, contacts: fideles.filter(y => y.cellule_id === x.id).map(contact) })),
      ...((g ?? []) as { id: string; nom: string; tribu: string | null }[]).map(x => ({ cle: 'gc:' + x.id, libelle: x.nom + (x.tribu ? ' · ' + x.tribu : ''), contacts: fideles.filter(y => y.gc_id === x.id).map(contact) })),
    ];
    return (<><PageHead id="communication" sous={sous} /><PreparerMessage cibles={cibles} /></>);
  }

  const { data } = await supabase.from('annonce').select('id, titre, date, jusquau, texte, publie').order('date', { ascending: false });
  const annonces = (data ?? []) as Annonce[];
  const q = (sp.q ?? '').trim().toLowerCase();
  const list = annonces.filter(x => !q || [x.titre, x.texte].join(' ').toLowerCase().includes(q));
  const statut = (x: Annonce) => (!x.publie ? <Pill c="n">Brouillon</Pill> : x.jusquau && x.jusquau < auj ? <Pill c="n">Expirée</Pill> : x.date > auj ? <Pill c="w">Programmée</Pill> : <Pill c="g">Publiée</Pill>);
  let fenetre: React.ReactNode = null;
  if (sp.fiche) {
    const nouveau = sp.fiche === 'nouveau';
    const v = annonces.find(x => x.id === sp.fiche);
    if ((nouveau && w) || v) fenetre = (
      <Modal titre={nouveau ? 'Nouvelle annonce' : v!.titre} retour={base}>
        {w ? <FicheForm entite="annonce" id={nouveau ? null : sp.fiche} valeurs={(v ?? { date: auj, publie: true }) as Record<string, string | boolean | null>} ro={false} suppression retour={base} />
          : <><p className="muted" style={{ margin: 0 }}>{frDate(v!.date)}</p><p style={{ whiteSpace: 'pre-line', margin: 0 }}>{v!.texte}</p><div className="actions" style={{ justifyContent: 'flex-end' }}><Link className="btn" href={base} scroll={false}>Fermer</Link></div></>}
      </Modal>
    );
  }
  return (
    <>
      <PageHead id="communication" sous={sous} />
      <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une annonce" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouvelle annonce</Link>}</div></div>
      <Panel>{list.length ? (
        <div className="tw"><table><thead><tr><th>Date</th><th>Titre</th><th>Texte</th><th>Statut</th></tr></thead>
          <tbody>{list.map(x => (
            <tr key={x.id}><td>{frDate(x.date)}</td><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.titre}</LienFiche></td><td className="muted">{x.texte.slice(0, 90)}</td><td>{statut(x)}</td></tr>
          ))}</tbody></table></div>
      ) : <Empty titre="Aucune annonce" texte={w ? 'Publiez la première annonce pour les fidèles.' : 'Les annonces de l’église apparaîtront ici.'} />}</Panel>
      {fenetre}
    </>
  );
}
