import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { BarresH, BarresV } from '@/components/Graphiques';
import { Empty, Kpis, Panel } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, frMonth, weekLabel } from '@/lib/format';

type Paire = [string, number];
type Stats = {
  croissance: { fideles: number; presence4: number | null; nouveauxAnnee: number; nouveauxMois: number; nouveauxParMois: Paire[]; presenceParMois: Paire[]; parStatut: Paire[]; parCommune: Paire[] };
  integration: { nouveaux: number; integres: number; jamaisAppeles: number; bergers: number; releves: number; semaine: string; sansBerger: number;
    integresParMois: Paire[]; absencesParSemaine: Paire[]; presenceGc: Paire[]; brebisParBerger: Paire[] };
  formations: { enFormation: number; sessionsEnCours: number; valides: number; absences: number; parClasse: Paire[];
    sessions: { classe: number; nomClasse: string | null; debut: string; fin: string; inscrits: number; valides: number; absences: number }[] };
};

const moisCourt = (ym: string) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''); };
const parMois = (l: Paire[]) => l.map(([m, v]) => [frMonth(m), Number(v), moisCourt(m)] as [string, number, string]);

export default async function Statistiques({ params }: { params: Promise<{ sous: string }> }) {
  const { sous } = await params;
  if (!['croissance', 'integration', 'formations'].includes(sous)) notFound();
  await requireMenu('stats');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('statistiques');
  const s = data as Stats | null;

  let corps: React.ReactNode;
  if (error || !s) {
    corps = <Panel><Empty titre="Statistiques indisponibles" texte="Le calcul n'a pas abouti. Réessayez dans un instant." /></Panel>;
  } else if (sous === 'croissance') {
    const c = s.croissance;
    corps = (
      <>
        <Kpis items={[['Fidèles enregistrés', c.fideles], ['Présence moyenne', c.presence4 ?? '—', '4 derniers cultes'], ['Nouveaux cette année', c.nouveauxAnnee], ['Nouveaux ce mois', c.nouveauxMois]]} />
        <div className="charts">
          <BarresV titre="Nouveaux venus par mois" sous="12 derniers mois" data={parMois(c.nouveauxParMois)} />
          <BarresV titre="Présence moyenne aux cultes" sous="par mois, tous cultes confondus" data={parMois(c.presenceParMois)} />
          <BarresH titre="Fidèles par statut" data={c.parStatut} />
          <BarresH titre="Fidèles par commune" sous="les 10 premières" data={c.parCommune} />
        </div>
      </>
    );
  } else if (sous === 'integration') {
    const g = s.integration;
    corps = (
      <>
        <Kpis items={[
          ["Taux d'intégration", g.nouveaux ? Math.round(g.integres / g.nouveaux * 100) + ' %' : '—', `${g.integres} sur ${g.nouveaux}`],
          ['Jamais appelés', g.jamaisAppeles],
          ['Relevés des bergers', g.bergers ? Math.round(g.releves / g.bergers * 100) + ' %' : '—', weekLabel(g.semaine)],
          ['Fidèles sans berger', g.sansBerger],
        ]} />
        <div className="charts">
          <BarresV titre="Nouveaux intégrés par mois" sous="selon le mois d'arrivée" data={parMois(g.integresParMois)} />
          <BarresV titre="Absences relevées par les bergers" sous="8 dernières semaines" data={g.absencesParSemaine.map(([w, v]) => [weekLabel(w), Number(v), 'S' + Number(w.split('-W')[1])])} />
          <BarresH titre="Taux de présence par GC" sous="dernier relevé de chaque groupe, en %" data={g.presenceGc} f="pct" />
          <BarresH titre="Brebis suivies par berger" sous="objectif : 15 par berger" data={g.brebisParBerger} />
        </div>
      </>
    );
  } else {
    const f = s.formations;
    const libelle = (x: { classe: number; nomClasse: string | null }) => `Classe ${x.classe}${x.nomClasse ? ' : ' + x.nomClasse : ''}`;
    corps = (
      <>
        <Kpis items={[['Fidèles en formation', f.enFormation], ['Sessions en cours', f.sessionsEnCours], ['Classes validées', f.valides], ['Absences cumulées', f.absences]]} />
        <div className="charts">
          <BarresH titre="Fidèles par classe" sous="étape actuelle de chaque fidèle" data={f.parClasse} tri={false} />
          <BarresH titre="Absences par session" data={f.sessions.map(x => [`${libelle(x)} · ${frDate(x.debut)}`, x.absences] as Paire)} />
        </div>
        <Panel titre="Sessions">{f.sessions.length ? (
          <div className="tw"><table><thead><tr><th>Classe</th><th>Départ</th><th>Fin</th><th className="num">Inscrits</th><th className="num">Validés</th><th className="num">Absences</th></tr></thead>
            <tbody>{f.sessions.map(x => (
              <tr key={x.classe + x.debut}><td>{libelle(x)}</td><td>{frDate(x.debut)}</td><td>{frDate(x.fin)}</td><td className="num">{x.inscrits}</td><td className="num">{x.valides}</td><td className="num">{x.absences}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucune session" texte="Les sessions de formation apparaîtront ici." />}</Panel>
      </>
    );
  }
  return (<><PageHead id="stats" sous={sous} />{corps}</>);
}
