import Link from 'next/link';
import { PageHead } from '@/components/PageHead';
import { Empty, Kpis, Panel } from '@/components/ui';
import { Anneau, BarresEmpilees, Rosace } from '@/components/Graphiques';
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
  let statuts: [string, number][] = [], nbFideles = 0;
  if (d.fideles) {
    const { data } = await supabase.from('fidele').select('statut');
    const f = (data ?? []) as { statut: string }[];
    nbFideles = f.length;
    const ordre = ['Membre', 'Responsable', 'Ouvrier', 'Nouveau', 'Inactif'];
    statuts = ordre.map(x => [x === 'Membre' ? 'Membres' : x === 'Responsable' ? 'Responsables' : x === 'Ouvrier' ? 'Ouvriers' : x === 'Nouveau' ? 'Nouveaux' : 'Inactifs', f.filter(y => y.statut === x).length] as [string, number]).filter(x => x[1] > 0);
    k.push(['Fidèles', nbFideles, s.profil.role_code === 'berger' ? 'mes brebis' : '']);
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
  // Présence aux cultes : les 12 dernières dates comptées, hommes, femmes et enfants (tous services réunis).
  let cultes: { l: string; court: string; parts: number[] }[] = [];
  if (d.culte) {
    const { data } = await supabase.from('comptage').select('date, hommes, femmes, enfants').order('date', { ascending: false }).limit(40);
    const parDate = new Map<string, number[]>();
    for (const c of data ?? []) { const t = parDate.get(c.date) ?? [0, 0, 0]; parDate.set(c.date, [t[0] + (c.hommes ?? 0), t[1] + (c.femmes ?? 0), t[2] + (c.enfants ?? 0)]); }
    cultes = [...parDate.entries()].slice(0, 12).reverse().map(([dt, parts]) => ({ l: frDate(dt), court: frDate(dt).replace(/ \d{4}$/, ''), parts }));
    const dernier = cultes[cultes.length - 1];
    k.push(['Dernier culte', dernier ? dernier.parts.reduce((a, v) => a + v, 0) : '—', dernier ? dernier.l : 'aucun comptage']);
  }
  // Rosace des GC : taux de présence du dernier relevé de chaque groupe.
  let rosace: [string, number | null][] = [];
  if (d.gc) {
    const [{ data: g }, { data: p }] = await Promise.all([
      supabase.from('gc').select('id, nom, tribu, ordre').order('ordre'),
      supabase.from('gc_presence').select('gc_id, date, presents, gc_absence(fidele_id)').order('date', { ascending: false }),
    ]);
    const releves = (p ?? []) as { gc_id: string; presents: number; gc_absence: unknown[] }[];
    rosace = ((g ?? []) as { id: string; nom: string; tribu: string | null }[]).map(x => {
      const r = releves.find(y => y.gc_id === x.id);
      const tot = r ? r.presents + r.gc_absence.length : 0;
      return [x.tribu || x.nom, r && tot ? Math.round((r.presents / tot) * 100) : null] as [string, number | null];
    });
  }
  const mesures = rosace.filter(x => x[1] != null).map(x => x[1] as number);
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
  // Annonces publiées et en cours : visibles par tout compte actif (règle appliquée par la base).
  const { data: an } = await supabase.from('annonce').select('id, titre, date, texte').eq('publie', true).lte('date', today())
    .or(`jusquau.is.null,jusquau.gte.${today()}`).order('date', { ascending: false }).limit(4);
  const annonces = (an ?? []) as { id: string; titre: string; date: string; texte: string }[];
  const metier = d.fideles || d.adnh || d.bergers || d.admin || d.cellules || d.gc || d.culte || d.formations || d.departements || d.reunions;
  return (
    <>
      <PageHead id="accueil" />
      {!metier && <div className="banner info">Bienvenue, {s.profil.nom.split(' ')[0]}. Votre accès : {s.roleLibelle}. Pour un accès de responsable, adressez-vous à l&apos;administration de l&apos;église.</div>}
      {k.length > 0 && <Kpis items={k} />}
      <div className="g12">
        {cultes.length > 0 && (
          <div className={rosace.length > 1 ? 's7' : 's12'}><Panel titre="Présence aux cultes" icone="barres" ton="emeraude" droite={<Link className="link" href="/culte/comptage">Jour de culte</Link>}>
            <div className="body"><BarresEmpilees data={cultes} series={['Hommes', 'Femmes', 'Enfants']} /></div>
          </Panel></div>
        )}
        {rosace.length > 1 && (
          <div className={cultes.length ? 's5' : 's12'}><Panel titre={`Rosace des ${rosace.length} GC`} icone="rosace" ton="amethyste" droite={<Link className="link" href="/gc/presences">Présences</Link>}>
            <div className="body"><Rosace data={rosace} centre={mesures.length ? Math.round(mesures.reduce((a, v) => a + v, 0) / mesures.length) + ' %' : '—'}
              legende={`Taux de présence au dernier relevé de chaque groupe de communion ; ${rosace.length - mesures.length} groupe(s) sans relevé`} /></div>
          </Panel></div>
        )}
        {statuts.length > 0 && (
          <div className="s4"><Panel titre={s.profil.role_code === 'berger' ? 'Mes brebis par statut' : 'Fidèles par statut'} icone="camembert" ton="saphir">
            <div className="body"><Anneau parts={statuts} total={nbFideles} unite={nbFideles > 1 ? 'fidèles' : 'fidèle'} /></div>
          </Panel></div>
        )}
        {d.agenda && (
          <div className="s4"><Panel titre="À venir" icone="calendrier" ton="rubis" droite={<Link className="link" href="/agenda/calendrier">Programmation</Link>}>
            {activites.length ? (
              <div className="body" style={{ display: 'flex', flexDirection: 'column', paddingTop: 4 }}>{activites.slice(0, 4).map(e => {
                const [, m, j] = e.date.split('-');
                const mois = new Date(2000, Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'short' });
                return (
                  <Link key={e.id} href={`/agenda/avenir?fiche=${e.id}`} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px dashed var(--line)', textDecoration: 'none' }}>
                    <span style={{ width: 50, flex: 'none', textAlign: 'center', border: '1px solid var(--lead)', borderRadius: 4, padding: '3px 0' }}><b className="disp" style={{ display: 'block', fontSize: 20, lineHeight: 1.1 }}>{Number(j)}</b><span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--rubis)' }}>{mois}</span></span>
                    <span style={{ minWidth: 0 }}><b style={{ display: 'block' }}>{e.titre}</b><span className="muted" style={{ fontSize: 12.5 }}>{[e.heure, e.lieu].filter(Boolean).join(' · ') || '—'}</span></span>
                  </Link>
                );
              })}</div>
            ) : <Empty titre="Aucune activité programmée" texte="Le programme de l'église s'affichera ici." />}
          </Panel></div>
        )}
        {annonces.length > 0 && (
          <div className="s4"><Panel titre="Annonces" icone="annonce" ton="ambre" droite={d.communication ? <Link className="link" href="/communication/annonces">Toutes</Link> : undefined}>
            <div className="body log">{annonces.map(x => (
              <div key={x.id}><b>{x.titre}</b> <span className="muted">· {frDate(x.date)}</span><br /><span style={{ whiteSpace: 'pre-line' }}>{x.texte}</span></div>
            ))}</div>
          </Panel></div>
        )}
        {d.reunions && (
          <div className="s6"><Panel titre="Tâches du conseil" icone="taches" ton="ciel" droite={<Link className="link" href="/reunions/taches">Toutes les tâches</Link>}>
            {taches.length ? (
              <div className="tw"><table><thead><tr><th>Tâche</th><th>Responsable</th><th>Échéance</th></tr></thead>
                <tbody>{taches.slice(0, 6).map(t => <tr key={t.id}><td><Link href={`/reunions/taches?fiche=${t.id}`} style={{ textDecoration: 'none', fontWeight: 600 }}>{t.titre}</Link></td><td>{t.responsable}</td><td>{t.echeance && t.echeance < today() ? <span className="pill b">{frDate(t.echeance)}</span> : frDate(t.echeance)}</td></tr>)}</tbody>
              </table></div>
            ) : <Empty titre="Aucune tâche ouverte" texte="Les tâches confiées par le conseil apparaîtront ici." />}
          </Panel></div>
        )}
        {d.adnh && (
          <div className="s6"><Panel titre="Nouveaux à appeler" icone="telephone" ton="rubis" droite={<Link className="link" href="/adnh/appels">ADNH</Link>}>
            {aAppeler.length ? (
              <div className="tw"><table><thead><tr><th>Arrivé le</th><th>Nom</th><th>Contact</th></tr></thead>
                <tbody>{aAppeler.slice(0, 6).map(n => <tr key={n.id}><td>{frDate(n.date_venue)}</td><td><Link href={`/adnh/appels?nouveau=${n.id}`} style={{ textDecoration: 'none', fontWeight: 600 }}>{n.nom}</Link></td><td className="mono">{n.contact || '—'}</td></tr>)}</tbody>
              </table></div>
            ) : <Empty titre="Aucun nouveau en attente d'appel" texte="Tous les nouveaux enregistrés ont été appelés." />}
          </Panel></div>
        )}
      </div>
    </>
  );
}
