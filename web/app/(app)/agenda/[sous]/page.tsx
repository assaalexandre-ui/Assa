import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, frMonth, today } from '@/lib/format';

type Assemblee = { id: string; nom: string; ville: string | null; commune: string | null; pasteur: string | null; contact: string | null };
type Activite = { id: string; titre: string; type: string; assemblee_id: string | null; date: string; heure: string | null; date_fin: string | null; lieu: string | null; responsable: string | null; frais: number | null; description: string | null; bilan: string | null };

export default async function Programmation({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['calendrier', 'avenir', 'historique', 'eglises'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('agenda');
  const w = s.droits.agenda === 'w';
  const supabase = await createClient();
  const [{ data: a }, { data: e }] = await Promise.all([
    supabase.from('assemblee').select('id, nom, ville, commune, pasteur, contact').order('nom'),
    supabase.from('evenement').select('id, titre, type, assemblee_id, date, heure, date_fin, lieu, responsable, frais, description, bilan').order('date'),
  ]);
  const assemblees = (a ?? []) as Assemblee[], activites = (e ?? []) as Activite[];
  const nomAss = (id: string | null) => assemblees.find(x => x.id === id)?.nom ?? '—';
  const optAss = assemblees.map(x => [x.id, x.nom] as [string, string]);
  const base = `/agenda/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const auj = today();
  const fin = (x: Activite) => x.date_fin || x.date;

  const tableActivites = (rows: Activite[], bilan = false) => (
    <div className="tw"><table><thead><tr><th>Date</th><th>Activité</th><th>Type</th><th>Église</th><th>Lieu</th><th>{bilan ? 'Bilan' : 'Responsable'}</th></tr></thead>
      <tbody>{rows.map(x => (
        <tr key={x.id}><td>{frDate(x.date)}{x.heure ? ' · ' + x.heure : ''}</td><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.titre}</LienFiche></td>
          <td><Pill c="a">{x.type}</Pill></td><td>{nomAss(x.assemblee_id)}</td><td>{x.lieu || '—'}</td>
          <td className={bilan ? 'muted' : ''}>{bilan ? (x.bilan ? x.bilan.slice(0, 80) : <Pill c="w">Bilan à noter</Pill>) : x.responsable || '—'}</td></tr>
      ))}</tbody></table></div>
  );
  const filtre = (x: Activite) => !q || [x.titre, x.type, x.lieu, x.responsable].join(' ').toLowerCase().includes(q);
  const ajouter = w && <Link className="btn primary" href={`${base}?fiche=nouveau${sp.assemblee ? '&assemblee=' + sp.assemblee : ''}`} scroll={false}>{sous === 'eglises' ? '+ Ajouter une église' : '+ Programmer une activité'}</Link>;

  let corps: React.ReactNode;
  if (sous === 'calendrier') {
    const annee = Number(sp.annee) || Number(auj.slice(0, 4));
    const ass = sp.assemblee ?? '';
    const evs = activites.filter(x => x.date.startsWith(String(annee)) && (!ass || x.assemblee_id === ass));
    const mois = Array.from({ length: 12 }, (_, i) => `${annee}-${String(i + 1).padStart(2, '0')}`);
    const lienAnnee = (y: number) => `${base}?annee=${y}${ass ? '&assemblee=' + ass : ''}`;
    corps = (
      <>
        <div className="toolbar">
          <div className="actions">
            <Link className="btn sm" href={lienAnnee(annee - 1)} aria-label="Année précédente">‹</Link>
            <b style={{ fontSize: 17, minWidth: 56, textAlign: 'center' }}>{annee}</b>
            <Link className="btn sm" href={lienAnnee(annee + 1)} aria-label="Année suivante">›</Link>
            <form action={base} className="actions">
              <input type="hidden" name="annee" value={annee} />
              <select className="sel" name="assemblee" defaultValue={ass} aria-label="Église"><option value="">Toutes les églises</option>{optAss.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <button className="btn sm" type="submit">Filtrer</button>
            </form>
          </div>
          <div className="actions">{ajouter}</div>
        </div>
        <div className="grid2">{mois.map(m => {
          const l = evs.filter(x => x.date.startsWith(m));
          return (
            <section className="panel" key={m} style={m === auj.slice(0, 7) ? { borderColor: 'var(--accent)' } : undefined}>
              <header><h2 style={{ textTransform: 'capitalize' }}>{frMonth(m)}</h2><span className="muted">{l.length} activité{l.length > 1 ? 's' : ''}</span></header>
              {l.length ? <div className="body log">{l.map(x => (
                <div key={x.id}><Link href={`${base}?annee=${annee}${ass ? '&assemblee=' + ass : ''}&fiche=${x.id}`} scroll={false} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <b>{Number(x.date.slice(8))}{x.date_fin && x.date_fin !== x.date ? '–' + Number(x.date_fin.slice(8)) : ''} · {x.titre}</b></Link><br />
                  <span className="muted">{[x.type, nomAss(x.assemblee_id), x.lieu].filter(Boolean).join(' · ')}</span></div>
              ))}</div> : <div className="body muted">Rien de programmé.</div>}
            </section>
          );
        })}</div>
      </>
    );
  } else if (sous === 'avenir' || sous === 'historique') {
    const avenir = sous === 'avenir';
    const rows = activites.filter(x => (avenir ? fin(x) >= auj : fin(x) < auj) && filtre(x));
    if (!avenir) rows.reverse();
    corps = (
      <>
        {!avenir && <p className="lead" style={{ margin: 0 }}>Activités passées. Ouvrez une activité pour noter son bilan.</p>}
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une activité" /><div className="actions">{avenir && ajouter}</div></div>
        <Panel>{rows.length ? tableActivites(rows, !avenir) : <Empty titre={avenir ? 'Aucune activité à venir' : 'Aucune activité passée'} texte={avenir && w ? 'Programmez une activité avec le bouton ci-dessus.' : 'Les activités apparaîtront ici.'} />}</Panel>
      </>
    );
  } else {
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Les églises et assemblées dont la programmation est suivie dans le calendrier annuel.</p>
        <div className="toolbar"><span /><div className="actions">{ajouter}</div></div>
        <Panel>{assemblees.length ? (
          <div className="tw"><table><thead><tr><th>Église</th><th>Ville</th><th>Pasteur</th><th className="num">Activités programmées</th></tr></thead>
            <tbody>{assemblees.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.nom}</LienFiche></td><td>{[x.ville, x.commune].filter(Boolean).join(', ') || '—'}</td>
                <td>{x.pasteur || '—'}</td><td className="num">{activites.filter(y => y.assemblee_id === x.id).length}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucune église" texte="Ajoutez les églises et assemblées suivies." />}</Panel>
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche) {
    const nouveau = sp.fiche === 'nouveau';
    const retour = sous === 'calendrier' ? `${base}?annee=${sp.annee ?? auj.slice(0, 4)}${sp.assemblee ? '&assemblee=' + sp.assemblee : ''}` : base;
    if (sous === 'eglises') {
      const v = assemblees.find(x => x.id === sp.fiche);
      if ((nouveau && w) || v) fenetre = <Modal titre={v ? v.nom : 'Ajouter une église'} retour={retour}><FicheForm entite="assemblee" id={nouveau ? null : sp.fiche} valeurs={v} ro={!w} suppression={w} retour={retour} /></Modal>;
    } else {
      const v = activites.find(x => x.id === sp.fiche);
      const defauts = { date: auj, type: 'Culte', assemblee_id: sp.assemblee || assemblees[0]?.id || null };
      if ((nouveau && w) || v) fenetre = <Modal titre={v ? v.titre : 'Programmer une activité'} retour={retour}><FicheForm entite="evenement" id={nouveau ? null : sp.fiche} valeurs={v ?? defauts} dyn={{ assemblees: optAss }} ro={!w} suppression={w} retour={retour} /></Modal>;
    }
  }
  return (<><PageHead id="agenda" sous={sous} />{corps}{fenetre}</>);
}
