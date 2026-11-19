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
  if (d.culte) {
    const { data } = await supabase.from('comptage').select('date, hommes, femmes, enfants').order('date', { ascending: false }).limit(1);
    const c = data?.[0];
    k.push(['Dernier culte', c ? (c.hommes ?? 0) + (c.femmes ?? 0) + (c.enfants ?? 0) : '—', c ? frDate(c.date) : 'aucun comptage']);
  }
  let taches: { id: string; titre: string; responsable: string; echeance: string | null }[] = [];
  if (d.reunions) {
    const { data } = await supabase.from('tache').select('id, titre, responsable, echeance').neq('statut', 'Terminée').order('echeance', { nullsFirst: false });
    taches = data ?? [];
    k.push(['Tâches en retard', taches.filter(t => t.echeance && t.echeance < today()).length, 'conseil']);
  }
  if (d.formations) {
    const { count } = await supabase.from('session_formation').select('id', { count: 'exact', head: true }).lte('date_debut', today()).gte('date_fin', today());
    k.push(['Formations en cours', count ?? 0, '']);
  }
  let activites: { id: string; titre: string; date: string; heure: string | null; lieu: string | null }[] = [];
  if (d.agenda) {
    const { data } = await supabase.from('evenement').select('id, titre, date, heure, lieu, date_fin').or(`date.gte.${today()},date_fin.gte.${today()}`).order('date').limit(6);
    activites = data ?? [];
  }
  const metier = d.fideles || d.adnh || d.bergers || d.admin || d.cellules || d.gc || d.culte || d.formations || d.departements || d.reunions;
  return (
    <>
      <PageHead id="accueil" />
      {!metier && <div className="banner info">Bienvenue, {s.profil.nom.split(' ')[0]}. Votre accès : {s.roleLibelle}. Pour un accès de responsable, adressez-vous à l&apos;administration de l&apos;église.</div>}
      {k.length > 0 && <Kpis items={k} />}
      {(d.adnh || d.agenda || d.reunions) && (
        <div className="grid2">
          {d.agenda && (
            <Panel titre="Prochaines activités" droite={<Link className="link" href="/agenda/calendrier">Programmation</Link>}>
              {activites.length ? (
                <div className="tw"><table><thead><tr><th>Date</th><th>Activité</th><th>Lieu</th></tr></thead>
                  <tbody>{activites.map(e => <tr key={e.id}><td>{frDate(e.date)}{e.heure ? ' · ' + e.heure : ''}</td><td><Link href={`/agenda/avenir?fiche=${e.id}`} style={{ textDecoration: 'none', fontWeight: 600 }}>{e.titre}</Link></td><td>{e.lieu || '—'}</td></tr>)}</tbody>
                </table></div>
              ) : <Empty titre="Aucune activité programmée" texte="Le programme de l'église s'affichera ici." />}
            </Panel>
          )}
          {d.reunions && (
            <Panel titre="Tâches du conseil" droite={<Link className="link" href="/reunions/taches">Toutes les tâches</Link>}>
              {taches.length ? (
                <div className="tw"><table><thead><tr><th>Tâche</th><th>Responsable</th><th>Échéance</th></tr></thead>
                  <tbody>{taches.slice(0, 6).map(t => <tr key={t.id}><td><Link href={`/reunions/taches?fiche=${t.id}`} style={{ textDecoration: 'none', fontWeight: 600 }}>{t.titre}</Link></td><td>{t.responsable}</td><td>{t.echeance && t.echeance < today() ? <span className="pill b">{frDate(t.echeance)}</span> : frDate(t.echeance)}</td></tr>)}</tbody>
                </table></div>
              ) : <Empty titre="Aucune tâche ouverte" texte="Les tâches confiées par le conseil apparaîtront ici." />}
            </Panel>
          )}
          {d.adnh && <Panel titre="Nouveaux à appeler" droite={<Link className="link" href="/adnh/appels">ADNH</Link>}>
            {aAppeler.length ? (
              <div className="tw"><table><thead><tr><th>Arrivé le</th><th>Nom</th><th>Contact</th></tr></thead>
                <tbody>{aAppeler.slice(0, 6).map(n => <tr key={n.id}><td>{frDate(n.date_venue)}</td><td><Link href={`/adnh/appels?nouveau=${n.id}`} style={{ textDecoration: 'none', fontWeight: 600 }}>{n.nom}</Link></td><td className="mono">{n.contact || '—'}</td></tr>)}</tbody>
              </table></div>
            ) : <Empty titre="Aucun nouveau en attente d'appel" texte="Tous les nouveaux enregistrés ont été appelés." />}
          </Panel>}
        </div>
      )}
    </>
  );
}
