import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Empty, Kpis, Panel, Pill } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { NIVEAUX, THEMES, recommandations, type Donnees, type Theme } from '@/lib/recommandations';

export default async function Recommandations({ params }: { params: Promise<{ sous: string }> }) {
  const { sous } = await params;
  if (!(sous in THEMES)) notFound();
  const theme = sous as Theme;
  await requireMenu('reco');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('donnees_recommandations');
  const liste = !error && data ? recommandations(data as Donnees)[theme] : [];
  return (
    <>
      <PageHead id="reco" sous={sous} />
      <Kpis items={[['Recommandations', liste.length], ['Priorité haute', liste.filter(x => x.niveau === 'haute').length],
        ['À surveiller', liste.filter(x => x.niveau === 'moyenne').length], ['Conseils', liste.filter(x => x.niveau === 'conseil').length]]} />
      <Panel titre="Recommandations automatiques" droite={<span className="muted" style={{ fontSize: 12.5 }}>Calculées à partir des données de l&apos;application</span>}>
        {error ? <div className="body err">Les recommandations n&apos;ont pas pu être calculées.</div> : liste.length ? (
          <div className="reco">{liste.map((r, i) => (
            <article key={i} className={`reco-item ${r.niveau}`}>
              <div className="reco-top"><Pill c={NIVEAUX[r.niveau][1]}>{NIVEAUX[r.niveau][0]}</Pill><span className="muted">{r.domaine}</span></div>
              <p><b>Constat :</b> {r.constat}</p>
              <p><b>Que faire :</b> {r.conseil}</p>
              <Link className="link" href={r.lien}>Ouvrir le menu concerné</Link>
            </article>
          ))}</div>
        ) : <Empty titre="Rien à signaler" texte="Aucun point d'attention détecté sur ce thème avec les données actuelles." />}
      </Panel>
      <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>L&apos;analyse rédigée par Claude viendra s&apos;ajouter ici au passage en production. Elle ne recevra que des chiffres globaux, jamais de noms.</p>
    </>
  );
}
