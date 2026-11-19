import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { Champ } from '@/components/Champ';
import { FormAction } from '@/components/FormAction';
import { FormIntegration } from '@/components/FormIntegration';
import { DeleteButton } from '@/components/DeleteButton';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { chargerRefs, COMMUNES, libelle, RESULTATS_APPEL, type Refs } from '@/lib/ref';
import { frDate, frMonth, today } from '@/lib/format';
import { statsParMois } from '@/lib/adnh';
import { enregistrerNouveau, noterAppel, supprimerNouveau } from '../actions';

type Appel = { id: string; date: string; resultat: string; note: string | null };
type Nouveau = { id: string; date_venue: string; nom: string; contact: string | null; commune: string | null; statut: string; gc_id: string | null; classe: number | null; berger_id: string | null; cellule_id: string | null; appel: Appel[] };

export default async function Adnh({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['nouveaux', 'appels', 'integration', 'stats'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('adnh');
  const w = s.droits.adnh === 'w';
  const supabase = await createClient();
  const [{ data }, refs] = await Promise.all([
    supabase.from('nouveau').select('id, date_venue, nom, contact, commune, statut, gc_id, classe, berger_id, cellule_id, appel(id, date, resultat, note)').order('date_venue', { ascending: false }),
    chargerRefs(),
  ]);
  const tous = (data ?? []) as Nouveau[];
  const q = (sp.q ?? '').trim().toLowerCase();
  const list = tous.filter(n => !q || [n.nom, n.contact].join(' ').toLowerCase().includes(q));
  const base = `/adnh/${sous}`;
  const retour = q ? `${base}?q=${encodeURIComponent(q)}` : base;
  const lien = (id: string) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), nouveau: id })}`;
  const integre = (n: Nouveau) => n.statut === 'intégré';

  const tableau = (rows: Nouveau[]) => (
    <div className="tw"><table>
      <thead><tr><th>Date</th><th>Nom</th><th>Contact</th><th className="num">Appels</th><th>GC</th><th>Classe</th><th>Statut</th></tr></thead>
      <tbody>{rows.map(n => (
        <tr key={n.id}>
          <td>{frDate(n.date_venue)}</td><td><LienFiche href={lien(n.id)}>{n.nom}</LienFiche></td><td className="mono">{n.contact || '—'}</td>
          <td className="num">{n.appel.length || <Pill c="b">À appeler</Pill>}</td><td>{libelle(refs.gc, n.gc_id)}</td>
          <td>{n.classe ? 'Classe ' + n.classe : '—'}</td><td>{integre(n) ? <Pill c="g">Intégré</Pill> : <Pill c="w">En suivi</Pill>}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );

  let corps: React.ReactNode;
  if (sous === 'nouveaux') {
    corps = (
      <>
        <Kpis items={[['Personnes venues', tous.length], ['Appelées', tous.filter(n => n.appel.length).length], ['Intégrées', tous.filter(integre).length]]} />
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un nouveau" /><div className="actions">{w && <Link className="btn primary" href={`${base}?nouveau=enregistrer`} scroll={false}>+ Enregistrer un nouveau</Link>}</div></div>
        <Panel>{list.length ? tableau(list) : <Empty titre={q ? 'Aucun résultat' : 'Aucun nouveau enregistré'} texte="Enregistrez chaque personne venue avec la date, son nom et son contact." />}</Panel>
      </>
    );
  } else if (sous === 'appels') {
    const attente = [...list.filter(n => !integre(n))].sort((a, b) => a.date_venue.localeCompare(b.date_venue));
    const jamais = attente.filter(n => !n.appel.length), relance = attente.filter(n => n.appel.length);
    const rows = (arr: Nouveau[]) => (
      <div className="tw"><table>
        <thead><tr><th>Arrivé le</th><th>Nom</th><th>Contact</th><th>Dernier appel</th></tr></thead>
        <tbody>{arr.map(n => { const l = [...n.appel].sort((a, b) => b.date.localeCompare(a.date))[0]; return (
          <tr key={n.id}><td>{frDate(n.date_venue)}</td><td><LienFiche href={lien(n.id)}>{n.nom}</LienFiche></td><td className="mono">{n.contact || '—'}</td>
            <td>{l ? <>{frDate(l.date)} <span className="muted">{l.note}</span></> : <Pill c="b">Jamais appelé</Pill>}</td></tr>
        ); })}</tbody>
      </table></div>
    );
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /></div>
        <Panel titre={`Jamais appelés (${jamais.length})`}>{jamais.length ? rows(jamais) : <Empty titre="Personne en attente" texte="Tous les nouveaux ont reçu au moins un appel." />}</Panel>
        <Panel titre={`À relancer avant intégration (${relance.length})`}>{relance.length ? rows(relance) : <Empty titre="Aucune relance" texte="Les nouveaux appelés mais pas encore intégrés apparaîtront ici." />}</Panel>
      </>
    );
  } else if (sous === 'integration') {
    const en = list.filter(n => !integre(n)), ok = list.filter(integre);
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /></div>
        <Panel titre={`En cours d'intégration (${en.length})`}>{en.length ? tableau(en) : <Empty titre="Aucun" texte="Tous les nouveaux sont intégrés." />}</Panel>
        <Panel titre={`Intégrés (${ok.length})`}>{ok.length ? tableau(ok) : <Empty titre="Aucun intégré" texte="Validez l'intégration depuis la fiche d'un nouveau." />}</Panel>
      </>
    );
  } else {
    const st = statsParMois(tous.map(n => ({ date_venue: n.date_venue, statut: n.statut, appels: n.appel.length })));
    const max = Math.max(1, ...st.map(l => l.venus));
    corps = (
      <Panel titre="Par mois">
        {st.length ? (
          <div className="tw"><table>
            <thead><tr><th>Mois</th><th className="num">Venus</th><th className="num">Appelés</th><th className="num">Intégrés</th><th>Taux d&apos;intégration</th></tr></thead>
            <tbody>{st.map(l => (
              <tr key={l.mois}><td>{frMonth(l.mois)}</td>
                <td className="num"><div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}><span className="meter" style={{ width: 90 }}><i style={{ width: `${(l.venus / max) * 100}%` }} /></span>{l.venus}</div></td>
                <td className="num">{l.appeles}</td><td className="num">{l.integres}</td><td>{l.taux} %</td></tr>
            ))}</tbody>
          </table></div>
        ) : <Empty titre="Pas encore de données" texte="Les statistiques apparaissent dès les premiers nouveaux enregistrés." />}
      </Panel>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.nouveau === 'enregistrer' && w) fenetre = <Modal titre="Enregistrer un nouveau" retour={retour}>{formNouveau(null, retour)}</Modal>;
  else if (sp.nouveau) {
    const n = tous.find(x => x.id === sp.nouveau);
    if (n && sp.mode === 'modifier' && w) fenetre = <Modal titre="Modifier" retour={lien(n.id)}>{formNouveau(n, lien(n.id))}</Modal>;
    else if (n) fenetre = ficheNouveau(n, refs, w, lien(n.id), retour);
  }

  return (<><PageHead id="adnh" sous={sous} />{corps}{fenetre}</>);
}

function formNouveau(n: Nouveau | null, retour: string) {
  return (
    <FormAction action={enregistrerNouveau} className="form" bouton="Enregistrer" boutonClasse="btn primary">
      <input type="hidden" name="id" value={n?.id ?? ''} /><input type="hidden" name="retour" value={retour} />
      <Champ k="date_venue" label="Date de venue" type="date" req v={n?.date_venue ?? today()} />
      <Champ k="nom" label="Nom et prénoms" req v={n?.nom} />
      <Champ k="contact" label="Contact" type="tel" v={n?.contact} />
      <Champ k="commune" label="Commune" type="select" options={COMMUNES} v={n?.commune} />
    </FormAction>
  );
}

function ficheNouveau(n: Nouveau, refs: Refs, w: boolean, ici: string, retour: string) {
  const appels = [...n.appel].sort((a, b) => b.date.localeCompare(a.date));
  const bergers = refs.bergersInfo.map(b => [b.id, `${b.nom} (${b.brebis} / 15)`] as [string, string]);
  return (
    <Modal titre={n.nom} retour={retour} large pied={<>
      {w ? <div className="actions"><DeleteButton action={supprimerNouveau.bind(null, n.id, retour)} /><Link className="btn" href={`${ici}&mode=modifier`} scroll={false}>Modifier</Link></div> : <span />}
      <Link className="btn" href={retour} scroll={false}>Fermer</Link>
    </>}>
      <dl className="kv"><dt>Venu le</dt><dd>{frDate(n.date_venue)}</dd><dt>Contact</dt><dd className="mono">{n.contact || '—'}</dd>{n.commune && <><dt>Commune</dt><dd>{n.commune}</dd></>}<dt>Statut</dt><dd>{n.statut === 'intégré' ? <Pill c="g">Intégré</Pill> : <Pill c="w">En suivi</Pill>}</dd></dl>
      <Panel titre={`Appels (${appels.length})`}>
        <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {w && (
            <FormAction action={noterAppel} className="form" bouton="+ Noter l'appel" boutonClasse="btn sm">
              <input type="hidden" name="nouveau" value={n.id} /><input type="hidden" name="retour" value={ici} />
              <Champ k="date" label="Date de l'appel" type="date" v={today()} />
              <Champ k="resultat" label="Résultat" type="select" options={RESULTATS_APPEL} v="Joint" />
              <Champ k="note" label="Compte rendu" full />
            </FormAction>
          )}
          {appels.length ? (
            <div className="log">{appels.map(a => <div key={a.id}><b>{frDate(a.date)}</b> <Pill c={a.resultat === 'Joint' ? 'g' : 'w'}>{a.resultat}</Pill><br /><span className="muted">{a.note}</span></div>)}</div>
          ) : <p className="muted" style={{ margin: 0 }}>Aucun appel noté.</p>}
        </div>
      </Panel>
      <Panel titre="Intégration">
        <div className="body">
          <FormIntegration nouveau={n.id} retour={ici} integre={n.statut === 'intégré'} ro={!w}>
            <Champ k="gc_id" label="Tribu et GC" type="select" options={refs.gc} v={n.gc_id} ro={!w} />
            <Champ k="classe" label="Classe de formation" type="select" options={refs.classes} v={n.classe} ro={!w} />
            <Champ k="cellule_id" label="Cellule" type="select" options={refs.cellules} v={n.cellule_id} ro={!w} />
            <Champ k="berger_id" label="Berger (facultatif)" type="select" options={bergers} v={n.berger_id} ro={!w} />
          </FormIntegration>
        </div>
      </Panel>
    </Modal>
  );
}
