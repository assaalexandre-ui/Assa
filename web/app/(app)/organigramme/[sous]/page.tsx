import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { NIVEAUX } from '@/lib/entites';

type Resp = { id: string; fonction: string; nom: string; contact: string | null; whatsapp: string | null; niveau: string | null; ordre: number | null };

export default async function Organigramme({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['annuaire', 'structure'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('organigramme');
  const w = s.droits.organigramme === 'w';
  const supabase = await createClient();
  const { data } = await supabase.from('responsable').select('id, fonction, nom, contact, whatsapp, niveau, ordre').order('ordre');
  const resp = (data ?? []) as Resp[];
  const base = `/organigramme/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();

  let corps: React.ReactNode;
  if (sous === 'annuaire') {
    const list = resp.filter(x => !q || [x.fonction, x.nom].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Ajouter un responsable</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Fonction</th><th>Nom</th><th>Téléphone</th><th>WhatsApp</th><th>Niveau</th></tr></thead>
            <tbody>{list.map(x => <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.fonction}</LienFiche></td><td>{x.nom}</td><td className="mono">{x.contact || '—'}</td><td className="mono">{x.whatsapp || '—'}</td><td><Pill>{x.niveau || '—'}</Pill></td></tr>)}</tbody></table></div>
        ) : <Empty titre="Annuaire vide" texte="Ajoutez les responsables de l'église." />}</Panel>
      </>
    );
  } else {
    // Départements et bergers : lus selon les droits de la personne (sans accès, la section n'apparaît pas).
    const [{ data: deps }, { data: ann }] = await Promise.all([
      supabase.from('departement').select('id, nom, responsable, contact').order('ordre'),
      supabase.from('annuaire').select('id, nom, brebis').eq('type', 'berger').order('nom'),
    ]);
    const niveaux = NIVEAUX.map(n => ({ n, r: resp.filter(x => x.niveau === n) })).filter(x => x.r.length);
    corps = (
      <>
        {niveaux.length ? niveaux.map(({ n, r }) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="group-title">{n}</p>
            <div className="cards">{r.map(x => <div key={x.id} className="card" style={{ cursor: 'default' }}><span className="meta">{x.fonction}</span><b>{x.nom}</b><span className="meta mono">{x.contact ?? ''}</span></div>)}</div>
          </div>
        )) : <Panel><Empty titre="Organigramme vide" texte="Ajoutez les responsables dans l'annuaire." /></Panel>}
        {(deps ?? []).length > 0 && <><p className="group-title">Départements et responsables</p>
          <Panel><div className="tw"><table><thead><tr><th>Département</th><th>Responsable</th><th>Contact</th></tr></thead><tbody>{(deps ?? []).map(d => <tr key={d.id}><td>{d.nom}</td><td>{d.responsable || '—'}</td><td className="mono">{d.contact || '—'}</td></tr>)}</tbody></table></div></Panel></>}
        {(ann ?? []).length > 0 && <><p className="group-title">Bergers</p>
          <Panel><div className="tw"><table><thead><tr><th>Berger</th><th className="num">Brebis</th></tr></thead><tbody>{(ann ?? []).map(b => <tr key={b.id}><td>{b.nom}</td><td className="num">{b.brebis}</td></tr>)}</tbody></table></div></Panel></>}
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche && sous === 'annuaire') {
    const v = resp.find(x => x.id === sp.fiche);
    if ((sp.fiche === 'nouveau' && w) || v) fenetre = <Modal titre={v ? v.fonction : 'Ajouter un responsable'} retour={base}><FicheForm entite="responsable" id={v ? v.id : null} valeurs={v ?? { niveau: 'Responsables de ministère', ordre: resp.length + 1 }} ro={!w} suppression={w} retour={base} /></Modal>;
  }
  return (<><PageHead id="organigramme" sous={sous} />{corps}{fenetre}</>);
}
