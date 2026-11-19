import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { chargerRefs } from '@/lib/ref';
import { frDate, fullName, money } from '@/lib/format';

type Cellule = { id: string; nom: string; lieu: string | null; commune: string | null; famille_accueil: string | null; berger_id: string | null; jour: string | null; infos: string | null };
type Rapport = { id: string; cellule_id: string; date: string; presents: number | null; nouveaux: number | null; offrande: number | null; sujets: string | null };
type Membre = { id: string; nom: string; prenoms: string | null; telephone: string | null; cellule_id: string | null };

export default async function Cellules({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['liste', 'rapports', 'membres'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('cellules');
  const w = s.droits.cellules === 'w';
  const estBerger = s.profil.role_code === 'berger';
  const supabase = await createClient();
  const [{ data: c }, { data: r }, { data: m }, refs] = await Promise.all([
    supabase.from('cellule').select('id, nom, lieu, commune, famille_accueil, berger_id, jour, infos').order('nom'),
    supabase.from('rapport_cellule').select('id, cellule_id, date, presents, nouveaux, offrande, sujets').order('date', { ascending: false }),
    supabase.from('fidele').select('id, nom, prenoms, telephone, cellule_id').not('cellule_id', 'is', null).order('nom'),
    chargerRefs(),
  ]);
  const cellules = (c ?? []) as Cellule[], rapports = (r ?? []) as Rapport[], membres = (m ?? []) as Membre[];
  const nomCellule = (id: string) => cellules.find(x => x.id === id)?.nom ?? '—';
  const base = `/cellules/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  // Un berger ne choisit que lui-même comme berger de cellule.
  const optBergers = estBerger ? refs.bergers.filter(b => b[0] === s.profil.berger_id) : refs.bergers;
  const optCellules = cellules.map(x => [x.id, x.nom] as [string, string]);

  let corps: React.ReactNode;
  if (sous === 'liste') {
    const list = cellules.filter(x => !q || [x.nom, x.lieu, x.famille_accueil, x.infos, refs.noms[x.berger_id ?? '']].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une cellule" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouvelle cellule</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Cellule</th><th>Lieu</th><th>Famille d&apos;accueil</th><th>Berger</th><th className="num">Membres</th><th>Informations</th></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.nom}</LienFiche></td><td>{[x.lieu, x.commune].filter(Boolean).join(', ') || '—'}</td>
                <td>{x.famille_accueil || '—'}</td><td>{x.berger_id ? refs.noms[x.berger_id] ?? '—' : '—'}</td>
                <td className="num">{membres.filter(f => f.cellule_id === x.id).length}</td><td className="muted">{(x.infos ?? '').slice(0, 80)}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre={q ? 'Aucune cellule trouvée' : 'Aucune cellule enregistrée'} texte={estBerger && !s.profil.berger_id ? "Votre compte n'est pas encore relié à une fiche de berger : demandez-le à l'administration." : w ? 'Ajoutez la première cellule avec « Nouvelle cellule ».' : 'Les cellules apparaîtront ici.'} />}</Panel>
      </>
    );
  } else if (sous === 'rapports') {
    const list = rapports.filter(x => !q || [nomCellule(x.cellule_id), x.sujets].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && cellules.length > 0 && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouveau rapport</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Cellule</th><th className="num">Présents</th><th className="num">Nouveaux</th><th className="num">Offrande</th><th>Sujets</th></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frDate(x.date)}</LienFiche></td><td>{nomCellule(x.cellule_id)}</td>
                <td className="num">{x.presents ?? '—'}</td><td className="num">{x.nouveaux ?? '—'}</td><td className="num">{x.offrande ? money(x.offrande) : '—'}</td>
                <td className="muted">{(x.sujets ?? '').slice(0, 80)}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun rapport" texte="Les rapports des rencontres de cellule apparaîtront ici." />}</Panel>
      </>
    );
  } else {
    corps = cellules.length ? (
      <div className="grid2">{cellules.map(x => { const mm = membres.filter(f => f.cellule_id === x.id); return (
        <Panel key={x.id} titre={x.nom} droite={<span className="muted">{mm.length} membre{mm.length > 1 ? 's' : ''}</span>}>
          {mm.length ? <div className="tw"><table><thead><tr><th>Nom</th><th>Contact</th></tr></thead><tbody>{mm.map(f => <tr key={f.id}><td>{fullName(f)}</td><td className="mono">{f.telephone || '—'}</td></tr>)}</tbody></table></div>
            : <Empty titre="Aucun membre" texte="Rattachez des fidèles à cette cellule depuis leur fiche." />}
        </Panel>); })}</div>
    ) : <Panel><Empty titre="Aucune cellule" texte="Créez d'abord les cellules." /></Panel>;
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche && sous !== 'membres') {
    const entite = sous === 'liste' ? 'cellule' : 'rapport_cellule';
    const nouveau = sp.fiche === 'nouveau';
    const v = nouveau ? null : sous === 'liste' ? cellules.find(x => x.id === sp.fiche) : rapports.find(x => x.id === sp.fiche);
    if ((nouveau && w) || v) {
      const membresCellule = sous === 'liste' && v ? membres.filter(f => f.cellule_id === v.id) : [];
      const defauts = nouveau ? (sous === 'liste' ? { berger_id: estBerger ? s.profil.berger_id : null } : { date: new Date().toISOString().slice(0, 10) }) : (v as Record<string, string | number | null>);
      fenetre = (
        <Modal titre={nouveau ? (sous === 'liste' ? 'Nouvelle cellule' : 'Nouveau rapport de cellule') : sous === 'liste' ? (v as Cellule).nom : 'Rapport de cellule'} retour={base}>
          <FicheForm entite={entite} id={nouveau ? null : sp.fiche} valeurs={defauts} dyn={{ bergers: optBergers, cellules: optCellules }} ro={!w} suppression={w} retour={base} />
          {sous === 'liste' && v && (
            <div><p className="group-title" style={{ marginBottom: 8 }}>Membres ({membresCellule.length})</p>
              {membresCellule.length ? <div className="tags">{membresCellule.map(f => <Pill key={f.id} c="a">{fullName(f)}</Pill>)}</div> : <p className="muted" style={{ margin: 0 }}>Aucun membre : indiquez la cellule dans la fiche des fidèles.</p>}</div>
          )}
        </Modal>
      );
    }
  }
  return (<><PageHead id="cellules" sous={sous} />{corps}{fenetre}</>);
}
