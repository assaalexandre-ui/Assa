import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { Champ } from '@/components/Champ';
import { FormAction } from '@/components/FormAction';
import { FicheForm } from '@/components/FicheForm';
import { DeleteButton } from '@/components/DeleteButton';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, frMonth, today } from '@/lib/format';
import { enregistrerDepartement, supprimerDepartement } from '../actions';

type Dep = { id: string; nom: string; groupe: string; responsable: string | null; contact: string | null; jour: string | null; membres: string[]; besoins: string | null; ordre: number | null };
type Creneau = { id: string; date: string; activite: string; departement_id: string; poste: string | null; personne: string | null; contact: string | null; confirme: boolean };
type Rapport = { id: string; departement_id: string; periode: string; activites: string | null; resultats: string | null; difficultes: string | null; effectif: number | null; statut: string };

export default async function Departements({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['services', 'autres', 'planning', 'rapports'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('departements');
  const w = s.droits.departements === 'w';
  const respDep = s.profil.role_code === 'resp_dep';
  const supabase = await createClient();
  const [{ data: d }, { data: p }, { data: r }] = await Promise.all([
    supabase.from('departement').select('id, nom, groupe, responsable, contact, jour, membres, besoins, ordre').order('ordre'),
    supabase.from('planning_service').select('id, date, activite, departement_id, poste, personne, contact, confirme').order('date', { ascending: false }),
    supabase.from('rapport_departement').select('id, departement_id, periode, activites, resultats, difficultes, effectif, statut').order('periode', { ascending: false }),
  ]);
  const deps = (d ?? []) as Dep[], creneaux = (p ?? []) as Creneau[], rapports = (r ?? []) as Rapport[];
  const nomDep = (id: string) => deps.find(x => x.id === id)?.nom ?? '—';
  const optDeps = deps.map(x => [x.id, x.nom] as [string, string]);
  const base = `/departements/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const auj = today();

  let corps: React.ReactNode;
  if (sous === 'services' || sous === 'autres') {
    const groupe = sous === 'services' ? 'service' : 'autre';
    const list = deps.filter(x => x.groupe === groupe && (!q || [x.nom, x.responsable, x.membres.join(' ')].join(' ').toLowerCase().includes(q)));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un département ou un membre" /><div className="actions">{w && !respDep && <Link className="btn primary" href={`${base}?dep=nouveau`} scroll={false}>+ Nouveau département</Link>}</div></div>
        {list.length ? <div className="cards">{list.map(x => {
          const avenir = creneaux.filter(c => c.departement_id === x.id && c.date >= auj).length;
          return (<Link key={x.id} className="card" href={`${base}?dep=${x.id}`} scroll={false}><b>{x.nom}</b>
            <span className="meta">{x.responsable ? 'Responsable : ' + x.responsable : 'Responsable à désigner'}</span>
            <span className="meta">{x.membres.length} membre{x.membres.length > 1 ? 's' : ''} · {avenir} créneau{avenir > 1 ? 'x' : ''} à venir</span></Link>);
        })}</div> : <Panel><Empty titre="Aucun département" texte={respDep ? "Votre compte n'est pas encore relié à un département : demandez-le à l'administration." : 'Ajoutez les départements.'} /></Panel>}
      </>
    );
  } else if (sous === 'planning') {
    const list = creneaux.filter(c => !q || [c.activite, c.poste, c.personne, nomDep(c.departement_id)].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && deps.length > 0 && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouveau créneau</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Activité</th><th>Département</th><th>Poste</th><th>Personne</th><th>Statut</th></tr></thead>
            <tbody>{list.map(c => (
              <tr key={c.id}><td><LienFiche href={`${base}?fiche=${c.id}`}>{frDate(c.date)}</LienFiche></td><td>{c.activite}</td><td>{nomDep(c.departement_id)}</td>
                <td>{c.poste || '—'}</td><td>{c.personne || '—'}</td><td>{c.confirme ? <Pill c="g">Confirmé</Pill> : <Pill c="w">À confirmer</Pill>}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun créneau" texte="Planifiez qui sert à quel poste lors des cultes et activités." />}</Panel>
      </>
    );
  } else {
    const list = rapports.filter(x => !q || [nomDep(x.departement_id), x.activites, x.resultats, x.difficultes].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && deps.length > 0 && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouveau rapport</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Mois</th><th>Département</th><th>Activités</th><th>Résultats</th><th>Statut</th></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frMonth(x.periode)}</LienFiche></td><td><b>{nomDep(x.departement_id)}</b></td>
                <td className="muted">{(x.activites ?? '').slice(0, 70)}</td><td className="muted">{(x.resultats ?? '').slice(0, 70)}</td>
                <td><Pill c={x.statut === 'Validé' ? 'g' : x.statut === 'À revoir' ? 'b' : 'w'}>{x.statut}</Pill></td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun rapport" texte="Les rapports mensuels des départements apparaîtront ici." />}</Panel>
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.dep && (sous === 'services' || sous === 'autres')) {
    const x = deps.find(y => y.id === sp.dep);
    const nouveau = sp.dep === 'nouveau';
    if ((nouveau && w && !respDep) || x) {
      const ro = !w;
      fenetre = (
        <Modal titre={x ? x.nom : 'Nouveau département'} retour={base} pied={<>{x && w && !respDep ? <DeleteButton action={supprimerDepartement.bind(null, x.id, base)} /> : <span />}<Link className="btn" href={base} scroll={false}>Fermer</Link></>}>
          {ro ? (
            <dl className="kv"><dt>Responsable</dt><dd>{x?.responsable || '—'}</dd><dt>Contact</dt><dd className="mono">{x?.contact || '—'}</dd><dt>Jour de réunion</dt><dd>{x?.jour || '—'}</dd><dt>Membres</dt><dd>{x?.membres.join(', ') || '—'}</dd><dt>Besoins</dt><dd>{x?.besoins || '—'}</dd></dl>
          ) : (
            <FormAction action={enregistrerDepartement} className="form" bouton="Enregistrer" boutonClasse="btn primary">
              <input type="hidden" name="id" value={x?.id ?? ''} />
              <Champ k="nom" label="Nom" req full v={x?.nom} />
              <Champ k="groupe" label="Catégorie" type="select" req options={[['service', "Services de l'église"], ['autre', 'Autres départements']]} v={x?.groupe ?? (sous === 'autres' ? 'autre' : 'service')} />
              <Champ k="responsable" label="Responsable" v={x?.responsable} /><Champ k="contact" label="Contact du responsable" type="tel" v={x?.contact} />
              <Champ k="jour" label="Jour de réunion" v={x?.jour} />
              <Champ k="membres" label="Membres" type="textarea" hint="Un nom par ligne" v={x?.membres.join('\n')} />
              <Champ k="besoins" label="Besoins et rapports" type="textarea" v={x?.besoins} />
            </FormAction>
          )}
        </Modal>
      );
    }
  } else if (sp.fiche && (sous === 'planning' || sous === 'rapports')) {
    const entite = sous === 'planning' ? 'planning_service' : 'rapport_departement';
    const nouveau = sp.fiche === 'nouveau';
    const v = sous === 'planning' ? creneaux.find(c => c.id === sp.fiche) : rapports.find(x => x.id === sp.fiche);
    const defauts = sous === 'planning' ? { date: auj, departement_id: s.profil.departement_id ?? null } : { periode: auj.slice(0, 7), statut: 'Soumis', departement_id: s.profil.departement_id ?? null };
    if ((nouveau && w) || v) fenetre = <Modal titre={nouveau ? (sous === 'planning' ? 'Nouveau créneau de service' : 'Nouveau rapport de département') : sous === 'planning' ? 'Créneau de service' : 'Rapport de département'} retour={base}>
      <FicheForm entite={entite} id={nouveau ? null : sp.fiche} valeurs={(v as Record<string, string | number | boolean | null>) ?? defauts} dyn={{ departements: optDeps }} ro={!w} suppression={w} retour={base} />
    </Modal>;
  }
  return (<><PageHead id="departements" sous={sous} />{corps}{fenetre}</>);
}
