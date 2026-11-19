import Link from 'next/link';
import { PageHead } from '@/components/PageHead';
import { Empty, Kpis, Panel } from '@/components/ui';
import { getSession } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, isoWeek, today, weekLabel } from '@/lib/format';
import { redirect } from 'next/navigation';

export default async function Accueil() {
  const s = await getSession();
  if (!s) redirect('/connexion');
  const supabase = await createClient();
  const d = s.droits, wk = isoWeek(), mois = today().slice(0, 7);
  const k: [string, React.ReactNode, string?][] = [];
  let aAppeler: { id: string; date_venue: string; nom: string; contact: string | null }[] = [];
  if (d.fideles) {
    const { count } = await supabase.from('fidele').select('id', { count: 'exact', head: true });
    k.push(['Fidèles', count ?? 0, s.profil.role_code === 'berger' ? 'mes brebis' : '']);
  }
  if (d.adnh) {
    const { data } = await supabase.from('nouveau').select('id, date_venue, nom, contact, statut, appel(id)').order('date_venue');
    const n = data ?? [];
    aAppeler = n.filter(x => x.statut !== 'intégré' && !(x.appel as unknown[]).length);
    k.push(['Nouveaux ce mois', n.filter(x => x.date_venue.startsWith(mois)).length, 'ADNH'], ['Nouveaux à appeler', aAppeler.length, 'aucun appel noté']);
  }
  if (d.bergers) {
    const { data } = await supabase.from('releve_absence').select('absence(fidele_id)').eq('semaine', wk);
    k.push(['Absences relevées', (data ?? []).reduce((t, r) => t + (r.absence as unknown[]).length, 0), weekLabel(wk)]);
  }
  const metier = d.fideles || d.adnh || d.bergers || d.admin;
  return (
    <>
      <PageHead id="accueil" />
      {!metier && <div className="banner info">Bienvenue, {s.profil.nom.split(' ')[0]}. Votre accès : {s.roleLibelle}. Pendant ce test, seuls les menus Bergers, ADNH et Fidèles sont ouverts ; adressez-vous à l&apos;administration pour un accès de responsable.</div>}
      {k.length > 0 && <Kpis items={k} />}
      {d.adnh && (
        <div className="grid2">
          <Panel titre="Nouveaux à appeler" droite={<Link className="link" href="/adnh/appels">ADNH</Link>}>
            {aAppeler.length ? (
              <div className="tw"><table><thead><tr><th>Arrivé le</th><th>Nom</th><th>Contact</th></tr></thead>
                <tbody>{aAppeler.slice(0, 6).map(n => <tr key={n.id}><td>{frDate(n.date_venue)}</td><td><Link href={`/adnh/appels?nouveau=${n.id}`} style={{ textDecoration: 'none', fontWeight: 600 }}>{n.nom}</Link></td><td className="mono">{n.contact || '—'}</td></tr>)}</tbody>
              </table></div>
            ) : <Empty titre="Aucun nouveau en attente d'appel" texte="Tous les nouveaux enregistrés ont été appelés." />}
          </Panel>
        </div>
      )}
    </>
  );
}
