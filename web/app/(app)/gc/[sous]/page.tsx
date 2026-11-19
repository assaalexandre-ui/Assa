import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { Champ } from '@/components/Champ';
import { FormAction } from '@/components/FormAction';
import { FicheForm } from '@/components/FicheForm';
import { DeleteButton } from '@/components/DeleteButton';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu, type Session } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, fullName, today } from '@/lib/format';
import { creerGc, enregistrerGc, enregistrerPresences, supprimerGc } from '../actions';

type Gc = { id: string; nom: string; tribu: string | null; ordre: number | null; responsables: string[] | null };
type Presence = { id: string; gc_id: string; date: string; presents: number; gc_absence: { fidele_id: string }[] };
type Passage = { id: string; gc_id: string; date: string; note: string | null };
type Membre = { id: string; nom: string; prenoms: string | null; telephone: string | null; gc_id: string | null };
const label = (g?: Gc) => (g ? g.nom + (g.tribu ? ' · ' + g.tribu : '') : '—');

export default async function Gcs({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['groupes', 'presences', 'passages'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('gc');
  const w = s.droits.gc === 'w';
  const respGc = s.profil.role_code === 'resp_gc';
  const supabase = await createClient();
  const [{ data: g }, { data: p }, { data: pa }, { data: m }] = await Promise.all([
    supabase.from('gc').select('id, nom, tribu, ordre, responsables').order('ordre'),
    supabase.from('gc_presence').select('id, gc_id, date, presents, gc_absence(fidele_id)').order('date', { ascending: false }).limit(60),
    supabase.from('gc_passage').select('id, gc_id, date, note').order('date', { ascending: false }),
    supabase.from('fidele').select('id, nom, prenoms, telephone, gc_id').not('gc_id', 'is', null).order('nom'),
  ]);
  const gcs = (g ?? []) as Gc[], presences = (p ?? []) as Presence[], passages = (pa ?? []) as Passage[], membres = (m ?? []) as Membre[];
  // Lecture du GC limitée au sien pour un responsable de GC (la base filtre déjà ; ici pour les présences/passages affichés).
  const base = `/gc/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const nomFidele = (id: string) => fullName(membres.find(f => f.id === id));

  let corps: React.ReactNode;
  if (sous === 'groupes') {
    const list = gcs.filter(x => !q || [x.nom, x.tribu, (x.responsables ?? []).join(' ')].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un GC ou une tribu" /><div className="actions">{w && !respGc && <Link className="btn primary" href={`${base}?gc=nouveau`} scroll={false}>+ Nouveau GC</Link>}</div></div>
        {list.length ? (
          <div className="cards">{list.map(x => {
            const n = membres.filter(f => f.gc_id === x.id).length, r = (x.responsables ?? []).filter(Boolean).length;
            const l = presences.find(pp => pp.gc_id === x.id);
            return (
              <Link key={x.id} className="card" href={`${base}?gc=${x.id}`} scroll={false}>
                <b>{x.nom}</b><span className="meta">{x.tribu ? 'Tribu : ' + x.tribu : 'Nom de la tribu à renseigner'}</span>
                <span className="meta">{n} membre{n > 1 ? 's' : ''} · {r} / 5 responsables</span>
                <span className="meta">{l ? `Présences du ${frDate(l.date)} : ${l.gc_absence.length} abs.` : 'Aucune présence relevée'}</span>
              </Link>
            );
          })}</div>
        ) : <Panel><Empty titre="Aucun GC" texte={respGc ? "Votre compte n'est pas encore relié à un GC : demandez-le à l'administration." : 'Ajoutez les groupes de communion.'} /></Panel>}
      </>
    );
  } else if (sous === 'presences') {
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Derniers relevés de présence. Ouvrez un GC depuis « Groupes de communion » pour faire un relevé.</p>
        <Panel>{presences.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>GC</th><th className="num">Présents</th><th className="num">Absents</th><th>Absents</th></tr></thead>
            <tbody>{presences.map(x => (
              <tr key={x.id}><td><LienFiche href={`/gc/groupes?gc=${x.gc_id}&date=${x.date}`}>{frDate(x.date)}</LienFiche></td><td><b>{label(gcs.find(y => y.id === x.gc_id))}</b></td>
                <td className="num">{x.presents}</td><td className="num">{x.gc_absence.length}</td><td className="muted">{x.gc_absence.map(a => nomFidele(a.fidele_id)).join(', ')}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun relevé" texte="Les présences enregistrées dans chaque GC apparaîtront ici." />}</Panel>
      </>
    );
  } else {
    corps = (
      <Panel>{passages.length ? (
        <div className="tw"><table><thead><tr><th>Date</th><th>GC</th><th>Service</th></tr></thead>
          <tbody>{passages.map(x => (
            <tr key={x.id}><td><LienFiche href={`/gc/groupes?gc=${x.gc_id}`}>{x.date >= today() ? <Pill c="a">{frDate(x.date)}</Pill> : frDate(x.date)}</LienFiche></td>
              <td><b>{label(gcs.find(y => y.id === x.gc_id))}</b></td><td>{x.note || 'Passage de service'}</td></tr>
          ))}</tbody></table></div>
      ) : <Empty titre="Aucun passage de service" texte="Planifiez les passages depuis la fiche de chaque GC." />}</Panel>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.gc === 'nouveau' && w && !respGc) {
    fenetre = (
      <Modal titre="Nouveau groupe de communion" retour={base}>
        <FormAction action={creerGc} className="form" bouton="Créer le GC" boutonClasse="btn primary">
          <Champ k="nom" label="Nom du GC" req /><Champ k="tribu" label="Nom de la tribu" />
        </FormAction>
      </Modal>
    );
  } else if (sp.gc) {
    const x = gcs.find(y => y.id === sp.gc);
    if (x) fenetre = ficheGc(s, x, membres.filter(f => f.gc_id === x.id), presences, passages.filter(pp => pp.gc_id === x.id), sp.date || today(), w, respGc, base);
  }
  return (<><PageHead id="gc" sous={sous} />{corps}{fenetre}</>);
}

function ficheGc(s: Session, g: Gc, membres: Membre[], presences: Presence[], passages: Passage[], date: string, w: boolean, respGc: boolean, base: string) {
  const ici = `/gc/groupes?gc=${g.id}&date=${date}`;
  const pres = presences.find(p => p.gc_id === g.id && p.date === date);
  const abs = new Set(pres?.gc_absence.map(a => a.fidele_id) ?? []);
  const resp = [...(g.responsables ?? []), '', '', '', '', ''].slice(0, 5);
  void s;
  return (
    <Modal titre={label(g)} retour={base} large pied={<>
      {w && !respGc ? <DeleteButton action={supprimerGc.bind(null, g.id)} label="Supprimer le GC" confirmation="Confirmer : les membres restent enregistrés" /> : <span />}
      <Link className="btn" href={base} scroll={false}>Fermer</Link>
    </>}>
      {w ? (
        <FormAction action={enregistrerGc} className="form" bouton="Enregistrer le GC" boutonClasse="btn primary sm">
          <input type="hidden" name="gc" value={g.id} /><input type="hidden" name="retour" value={ici} />
          <Champ k="nom" label="Nom du GC" req v={g.nom} /><Champ k="tribu" label="Nom de la tribu" v={g.tribu} />
          {resp.map((r, i) => <Champ key={i} k={'r' + i} label={`Responsable associé ${i + 1}`} v={r} />)}
        </FormAction>
      ) : (
        <dl className="kv"><dt>Tribu</dt><dd>{g.tribu || '—'}</dd><dt>Responsables</dt><dd>{resp.filter(Boolean).join(', ') || '—'}</dd></dl>
      )}
      <Panel titre={`Membres (${membres.length})`}>
        <div className="body">
          {membres.length ? (
            <>
              <form className="actions" action="/gc/groupes" style={{ marginBottom: 6 }}>
                <input type="hidden" name="gc" value={g.id} />
                <label htmlFor="gDate" className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Présences du</label>
                <input className="sel" type="date" id="gDate" name="date" defaultValue={date} />
                <button className="btn sm" type="submit">Afficher</button>
                {pres ? <Pill c="g">{`${pres.presents} présents · ${abs.size} absents`}</Pill> : <Pill c="w">Non relevé</Pill>}
              </form>
              {w ? (
                <FormAction action={enregistrerPresences} bouton="Enregistrer les présences">
                  <input type="hidden" name="gc" value={g.id} /><input type="hidden" name="date" value={date} /><input type="hidden" name="retour" value={ici} />
                  {membres.map(f => (
                    <div className="check" key={f.id}><input type="checkbox" id={'ga-' + f.id} name="absent" value={f.id} defaultChecked={abs.has(f.id)} />
                      <label htmlFor={'ga-' + f.id}>{fullName(f)} <span className="muted mono">{f.telephone ?? ''}</span></label>{abs.has(f.id) && <Pill c="b">Absent</Pill>}</div>
                  ))}
                  <p className="muted" style={{ fontSize: 12.5, margin: '8px 0' }}>Cochez les absents, puis enregistrez.</p>
                </FormAction>
              ) : membres.map(f => <div className="check" key={f.id}><span style={{ flex: 1 }}>{fullName(f)}</span>{abs.has(f.id) && <Pill c="b">Absent</Pill>}</div>)}
            </>
          ) : <p className="muted" style={{ margin: 0 }}>Aucun membre : choisissez le GC dans la fiche des fidèles ou lors de l&apos;intégration ADNH.</p>}
        </div>
      </Panel>
      <Panel titre="Passage de service">
        <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {w && <FicheForm entite="gc_passage" ro={false} retour={ici} fixes={{ gc_id: g.id }} valeurs={{ date: today() }} />}
          {passages.length ? <div className="log">{passages.map(p => <div key={p.id}><b>{frDate(p.date)}</b><br /><span className="muted">{p.note || 'Passage de service'}</span></div>)}</div>
            : <p className="muted" style={{ margin: 0 }}>Aucun passage de service planifié.</p>}
        </div>
      </Panel>
    </Modal>
  );
}
