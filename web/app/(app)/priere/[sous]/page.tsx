import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, today } from '@/lib/format';

type Priere = { id: string; date: string; demandeur: string | null; contact: string | null; visibilite: string; sujet: string; statut: string; temoignage: string | null; auteur_id: string | null };

export default async function Prieres({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['requetes', 'temoignages'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('priere');
  const w = s.droits.priere === 'w';
  const equipe = ['admin', 'pasteur', 'intercession'].includes(s.profil.role_code);
  const supabase = await createClient();
  // La base ne renvoie que ce que la personne a le droit de lire (visibilité appliquée par la base).
  const { data } = await supabase.from('priere').select('id, date, demandeur, contact, visibilite, sujet, statut, temoignage, auteur_id').order('date', { ascending: false });
  const q = (sp.q ?? '').trim().toLowerCase();
  const exaucees = sous === 'temoignages';
  const list = ((data ?? []) as Priere[]).filter(x => (exaucees ? x.statut === 'Exaucée' : x.statut !== 'Exaucée') && (!q || [x.demandeur, x.sujet].join(' ').toLowerCase().includes(q)));
  const base = `/priere/${sous}`;
  const v = sp.fiche && sp.fiche !== 'nouveau' ? ((data ?? []) as Priere[]).find(x => x.id === sp.fiche) : undefined;
  const modifiable = (x?: Priere) => w && (!x || equipe || x.auteur_id === s.userId);
  return (
    <>
      <PageHead id="priere" sous={sous} />
      {exaucees && <p className="lead" style={{ margin: 0 }}>Requêtes exaucées et témoignages reçus.</p>}
      <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && !exaucees && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Déposer une requête</Link>}</div></div>
      {!equipe && <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>Vous voyez les requêtes publiques et les vôtres. Les requêtes confidentielles ne sont lues que par les pasteurs et l&apos;équipe d&apos;intercession.</p>}
      <Panel>{list.length ? (
        <div className="tw"><table><thead><tr><th>Date</th><th>Demandeur</th><th>{exaucees ? 'Témoignage' : 'Sujet'}</th><th>Visibilité</th><th>Suivi</th></tr></thead>
          <tbody>{list.map(x => (
            <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frDate(x.date)}</LienFiche></td><td>{x.demandeur || 'Anonyme'}</td>
              <td>{((exaucees ? x.temoignage || x.sujet : x.sujet) ?? '').slice(0, 90)}</td>
              <td><Pill c={x.visibilite === 'Confidentielle' ? 'b' : 'n'}>{x.visibilite}</Pill></td>
              <td><Pill c={x.statut === 'Exaucée' ? 'g' : x.statut === 'En prière' ? 'w' : 'n'}>{x.statut}</Pill></td></tr>
          ))}</tbody></table></div>
      ) : <Empty titre={exaucees ? 'Aucun témoignage' : 'Aucune requête'} texte={exaucees ? 'Les requêtes exaucées apparaîtront ici.' : 'Déposez une requête avec le bouton ci-dessus.'} />}</Panel>
      {sp.fiche === 'nouveau' && w && <Modal titre="Déposer une requête" retour={base}><FicheForm entite="priere" valeurs={{ date: today(), visibilite: "Équipe d'intercession", statut: 'Reçue', demandeur: s.profil.nom }} ro={false} retour={base} /></Modal>}
      {v && <Modal titre={`Requête du ${frDate(v.date)}`} retour={base}><FicheForm entite="priere" id={v.id} valeurs={v} ro={!modifiable(v)} suppression={modifiable(v)} retour={base} /></Modal>}
    </>
  );
}
