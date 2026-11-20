import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, money, today } from '@/lib/format';

type Article = { id: string; article: string; categorie: string | null; quantite: number; affectation: string | null; etat: string; valeur: number | null; date_achat: string | null; notes: string | null };
type Entretien = { id: string; date: string; article_id: string; intervention: string; prestataire: string | null; cout: number | null; prochaine: string | null };

const tonEtat = (e: string) => (e === 'Bon' ? 'g' : e === 'À réparer' ? 'w' : 'b') as 'g' | 'w' | 'b';

export default async function Patrimoine({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['inventaire', 'entretien'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('patrimoine');
  const w = s.droits.patrimoine === 'w';
  const supabase = await createClient();
  const [{ data: a }, { data: e }] = await Promise.all([
    supabase.from('article').select('id, article, categorie, quantite, affectation, etat, valeur, date_achat, notes').order('article'),
    supabase.from('entretien').select('id, date, article_id, intervention, prestataire, cout, prochaine').order('date', { ascending: false }),
  ]);
  const articles = (a ?? []) as Article[], entretiens = (e ?? []) as Entretien[];
  const nomArticle = (id: string) => articles.find(x => x.id === id)?.article ?? '—';
  const base = `/patrimoine/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const auj = today();

  let corps: React.ReactNode;
  if (sous === 'inventaire') {
    const list = articles.filter(x => !q || [x.article, x.categorie, x.affectation].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <Kpis items={[['Articles', articles.length], ['À réparer', articles.filter(x => x.etat === 'À réparer').length], ['Hors service', articles.filter(x => x.etat === 'Hors service').length],
          ['Valeur estimée', money(articles.reduce((t, x) => t + Number(x.valeur ?? 0) * (Number(x.quantite) || 1), 0))]]} />
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un article" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouvel article</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Article</th><th>Catégorie</th><th className="num">Quantité</th><th>Affecté à</th><th>État</th><th className="num">Valeur</th></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.article}</LienFiche></td><td>{x.categorie || '—'}</td><td className="num">{x.quantite}</td>
                <td>{x.affectation || '—'}</td><td><Pill c={tonEtat(x.etat)}>{x.etat}</Pill></td><td className="num">{x.valeur ? money(x.valeur) : '—'}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun article" texte="Le matériel de l'église apparaîtra ici." />}</Panel>
      </>
    );
  } else {
    const list = entretiens.filter(x => !q || [nomArticle(x.article_id), x.intervention, x.prestataire].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une intervention" /><div className="actions">{w && articles.length > 0 && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouvelle intervention</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Article</th><th>Intervention</th><th>Prestataire</th><th className="num">Coût</th><th>Prochaine</th></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frDate(x.date)}</LienFiche></td><td>{nomArticle(x.article_id)}</td><td>{x.intervention}</td>
                <td>{x.prestataire || '—'}</td><td className="num">{x.cout ? money(x.cout) : '—'}</td>
                <td>{x.prochaine ? (x.prochaine < auj ? <Pill c="b">{frDate(x.prochaine)} · dépassée</Pill> : frDate(x.prochaine)) : '—'}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucune intervention" texte="Notez ici les réparations et entretiens du matériel." />}</Panel>
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche) {
    const nouveau = sp.fiche === 'nouveau';
    const entite = sous === 'inventaire' ? 'article' : 'entretien';
    const v = sous === 'inventaire' ? articles.find(x => x.id === sp.fiche) : entretiens.find(x => x.id === sp.fiche);
    if ((nouveau && w) || v) {
      const valeurs = (v ? { ...v } : sous === 'inventaire' ? { etat: 'Bon', quantite: 1 } : { date: auj }) as Record<string, string | number | null>;
      fenetre = (
        <Modal titre={nouveau ? (sous === 'inventaire' ? 'Nouvel article' : 'Nouvelle intervention') : sous === 'inventaire' ? 'Article' : 'Intervention'} retour={base}>
          <FicheForm entite={entite} id={nouveau ? null : sp.fiche} valeurs={valeurs} ro={!w} suppression={w} retour={base} dyn={{ articles: articles.map(x => [x.id, x.article]) }} />
        </Modal>
      );
    }
  }
  return (<><PageHead id="patrimoine" sous={sous} />{corps}{fenetre}</>);
}
