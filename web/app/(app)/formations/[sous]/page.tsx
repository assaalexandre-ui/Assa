import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { Champ } from '@/components/Champ';
import { FormAction } from '@/components/FormAction';
import { FicheForm } from '@/components/FicheForm';
import { BoutonAction } from '@/components/BoutonAction';
import { Empty, LienFiche, Panel, Pill } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, fullName, today } from '@/lib/format';
import { changerAbsences, creerClasse, inscrire, retirer, valider } from '../actions';

type Classe = { id: string; numero: number; nom: string; role: string | null; duree: number | null };
type Inscription = { id: string; fidele_id: string; absences: number; valide: boolean };
type Session = { id: string; classe: number; date_debut: string; date_fin: string; formateur: string | null; lieu: string | null; inscription_formation: Inscription[] };
type Fidele = { id: string; nom: string; prenoms: string | null; telephone: string | null; classe: number | null };

export default async function Formations({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['classes', 'sessions', 'parcours'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('formations');
  const w = s.droits.formations === 'w';
  const supabase = await createClient();
  const [{ data: c }, { data: se }, { data: f }] = await Promise.all([
    supabase.from('classe').select('id, numero, nom, role, duree').order('numero'),
    supabase.from('session_formation').select('id, classe, date_debut, date_fin, formateur, lieu, inscription_formation(id, fidele_id, absences, valide)').order('date_debut', { ascending: false }),
    supabase.from('fidele').select('id, nom, prenoms, telephone, classe').order('nom'),
  ]);
  const classes = (c ?? []) as Classe[], sessions = (se ?? []) as Session[], fideles = (f ?? []) as Fidele[];
  const libClasse = (n: number) => { const x = classes.find(y => y.numero === n); return x ? `Classe ${x.numero} : ${x.nom}` : `Classe ${n}`; };
  const base = `/formations/${sous}`;
  const auj = today();
  const etat = (x: Session) => x.date_debut > auj ? <Pill c="a">À venir</Pill> : x.date_fin < auj ? <Pill>Terminée</Pill> : <Pill c="g">En cours</Pill>;

  let corps: React.ReactNode;
  if (sous === 'classes') {
    corps = (
      <>
        <div className="toolbar"><span className="muted">Le Word annonce cinq (5) classes ; quatre sont nommées.</span><div className="actions">{w && <Link className="btn" href={`${base}?classe=nouvelle`} scroll={false}>+ Ajouter une classe</Link>}</div></div>
        {classes.length ? <div className="cards">{classes.map(x => {
          const n = fideles.filter(y => y.classe === x.numero).length, ns = sessions.filter(y => y.classe === x.numero).length;
          return (<Link key={x.id} className="card" href={`${base}?classe=${x.id}`} scroll={false}><span className="meta">Classe {x.numero}</span><b>{x.nom}</b>
            <span className="meta">{n} fidèle{n > 1 ? 's' : ''} · {ns} session{ns > 1 ? 's' : ''}</span>{x.role && <span className="meta">{x.role}</span>}</Link>);
        })}</div> : <Panel><Empty titre="Aucune classe" texte="Ajoutez les classes de formation." /></Panel>}
      </>
    );
  } else if (sous === 'sessions') {
    corps = (
      <>
        <div className="toolbar"><span /><div className="actions">{w && <Link className="btn primary" href={`${base}?session=nouvelle`} scroll={false}>+ Nouvelle session</Link>}</div></div>
        <Panel>{sessions.length ? (
          <div className="tw"><table><thead><tr><th>Classe</th><th>Date de départ</th><th>Date de fin</th><th>Formateur</th><th className="num">Inscrits</th><th className="num">Absences</th><th>Statut</th></tr></thead>
            <tbody>{sessions.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?session=${x.id}`}>{libClasse(x.classe)}</LienFiche></td><td>{frDate(x.date_debut)}</td><td>{frDate(x.date_fin)}</td>
                <td>{x.formateur || '—'}</td><td className="num">{x.inscription_formation.length}</td><td className="num">{x.inscription_formation.reduce((t, i) => t + i.absences, 0)}</td><td>{etat(x)}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucune session" texte="Créez une session avec sa date de départ et sa date de fin." />}</Panel>
      </>
    );
  } else {
    const sans = fideles.filter(x => !x.classe);
    const liste = (rows: Fidele[]) => <div className="tw"><table><thead><tr><th>Fidèle</th><th>Contact</th></tr></thead><tbody>{rows.map(x => <tr key={x.id}><td><LienFiche href={`/fideles/liste?fiche=${x.id}`}>{fullName(x)}</LienFiche></td><td className="mono">{x.telephone || '—'}</td></tr>)}</tbody></table></div>;
    corps = (
      <div className="grid2">
        {classes.map(x => { const m = fideles.filter(y => y.classe === x.numero); return (
          <Panel key={x.id} titre={`Classe ${x.numero} : ${x.nom}`} droite={<span className="muted">{m.length}</span>}>{m.length ? liste(m) : <Empty titre="Personne à cette étape" texte="Indiquez la classe dans la fiche du fidèle." />}</Panel>); })}
        <Panel titre="Sans classe" droite={<span className="muted">{sans.length}</span>}>{sans.length ? liste(sans.slice(0, 40)) : <Empty titre="Aucun" texte="Chaque fidèle a une classe." />}</Panel>
      </div>
    );
  }

  let fenetre: React.ReactNode = null;
  const optClasses = classes.map(x => [String(x.numero), `Classe ${x.numero} : ${x.nom}`] as [string, string]);
  if (sp.classe === 'nouvelle' && w) {
    fenetre = (
      <Modal titre="Nouvelle classe" retour={base}>
        <FormAction action={creerClasse} className="form" bouton="Ajouter la classe" boutonClasse="btn primary">
          <input type="hidden" name="eglise" value={s.profil.eglise_id} />
          <Champ k="numero" label="Numéro" type="number" req v={classes.length + 1} /><Champ k="nom" label="Nom" req />
          <Champ k="role" label="Rôle de la classe" type="textarea" />
        </FormAction>
      </Modal>
    );
  } else if (sp.classe) {
    const x = classes.find(y => y.id === sp.classe);
    if (x) fenetre = <Modal titre={`Classe ${x.numero}`} retour={base}><FicheForm entite="classe" id={x.id} valeurs={x} ro={!w} retour={base} /></Modal>;
  } else if (sp.session === 'nouvelle' && w) {
    fenetre = <Modal titre="Nouvelle session de formation" retour={base}><FicheForm entite="session_formation" dyn={{ classes: optClasses }} ro={false} retour={base} /></Modal>;
  } else if (sp.session) {
    const x = sessions.find(y => y.id === sp.session);
    if (x) {
      const ici = `${base}?session=${x.id}`;
      const dispo = fideles.filter(y => !x.inscription_formation.some(i => i.fidele_id === y.id));
      fenetre = sp.mode === 'modifier' && w
        ? <Modal titre="Modifier la session" retour={ici}><FicheForm entite="session_formation" id={x.id} valeurs={{ classe: String(x.classe), date_debut: x.date_debut, date_fin: x.date_fin, formateur: x.formateur, lieu: x.lieu }} dyn={{ classes: optClasses }} ro={false} suppression retour={ici} /></Modal>
        : (
          <Modal titre={libClasse(x.classe)} retour={base} large pied={<>{w ? <Link className="btn" href={`${ici}&mode=modifier`} scroll={false}>Modifier la session</Link> : <span />}<Link className="btn" href={base} scroll={false}>Fermer</Link></>}>
            <dl className="kv"><dt>Date de départ</dt><dd>{frDate(x.date_debut)}</dd><dt>Date de fin</dt><dd>{frDate(x.date_fin)}</dd><dt>Formateur</dt><dd>{x.formateur || '—'}</dd><dt>Inscrits</dt><dd>{x.inscription_formation.length}</dd></dl>
            {w && dispo.length > 0 && (
              <FormAction action={inscrire} className="actions" bouton="Inscrire" boutonClasse="btn sm">
                <input type="hidden" name="session" value={x.id} /><input type="hidden" name="retour" value={ici} />
                <select className="sel" name="fidele" defaultValue="" aria-label="Inscrire un fidèle"><option value="">Inscrire un fidèle…</option>{dispo.map(y => <option key={y.id} value={y.id}>{fullName(y)}</option>)}</select>
              </FormAction>
            )}
            <Panel titre="Inscrits et absences">{x.inscription_formation.length ? (
              <div className="tw"><table><thead><tr><th>Fidèle</th><th>Contact</th><th>Absences</th><th /></tr></thead>
                <tbody>{x.inscription_formation.map(i => { const y = fideles.find(z => z.id === i.fidele_id); return (
                  <tr key={i.id}><td>{fullName(y)}</td><td className="mono">{y?.telephone || '—'}</td>
                    <td>{w ? <div className="actions"><BoutonAction action={changerAbsences.bind(null, i.id, i.absences - 1, ici)} label="Retirer une absence">−</BoutonAction><b style={{ minWidth: 22, textAlign: 'center' }}>{i.absences}</b><BoutonAction action={changerAbsences.bind(null, i.id, i.absences + 1, ici)} label="Ajouter une absence">+</BoutonAction></div> : i.absences}</td>
                    <td style={{ textAlign: 'right' }}>{w ? <div className="actions" style={{ justifyContent: 'flex-end' }}><BoutonAction action={valider.bind(null, i.id, !i.valide, ici)}>{i.valide ? 'Validé ✓' : 'Valider la classe'}</BoutonAction><BoutonAction action={retirer.bind(null, i.id, ici)}>Retirer</BoutonAction></div> : i.valide && <Pill c="g">Validé</Pill>}</td></tr>); })}</tbody></table></div>
            ) : <Empty titre="Aucun inscrit" texte="Inscrivez les fidèles concernés par cette classe." />}</Panel>
            {w && <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>« Valider la classe » fait passer le fidèle à la classe suivante dans sa fiche.</p>}
          </Modal>
        );
    }
  }
  return (<><PageHead id="formations" sous={sous} />{corps}{fenetre}</>);
}
