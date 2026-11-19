import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { Champ } from '@/components/Champ';
import { FormAction } from '@/components/FormAction';
import { DeleteButton } from '@/components/DeleteButton';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu, type Session } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { COMMUNES, STATUTS } from '@/lib/ref';
import { fullName, isoWeek, weekLabel } from '@/lib/format';
import { enregistrerBerger, enregistrerReleve, nouvelleBrebis, rattacher, supprimerBerger } from '../actions';

type Berger = { id: string; nom: string; prenoms: string | null; contact: string | null };
type Brebis = { id: string; nom: string; prenoms: string | null; telephone: string | null; berger_id: string | null };
const MAX = 15;

export default async function Bergers({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['bergers', 'brebis', 'absences'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('bergers');
  const estBerger = s.profil.role_code === 'berger';
  const w = s.droits.bergers === 'w';
  const wk = isoWeek();
  const supabase = await createClient();
  const [{ data: bData }, { data: fData }, { data: rData }] = await Promise.all([
    supabase.from('berger').select('id, nom, prenoms, contact').order('nom'),
    supabase.from('fidele').select('id, nom, prenoms, telephone, berger_id').order('nom'),
    supabase.from('releve_absence').select('id, berger_id, absence(fidele_id)').eq('semaine', wk),
  ]);
  const bergers = (bData ?? []) as Berger[];
  const fideles = (fData ?? []) as Brebis[];
  const releves = new Map((rData ?? []).map(r => [r.berger_id as string, ((r.absence as { fidele_id: string }[]) ?? []).map(a => a.fidele_id)]));
  const brebisDe = (id: string) => fideles.filter(f => f.berger_id === id);
  const q = (sp.q ?? '').trim().toLowerCase();
  const base = `/bergers/${sous}`;

  let corps: React.ReactNode;
  if (sous === 'bergers') {
    const list = bergers.filter(b => !q || [fullName(b), b.contact].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar">
          <SearchBox q={sp.q} placeholder="Rechercher un berger" />
          <div className="actions">{w && !estBerger && <Link className="btn primary" href={`${base}?berger=nouveau`} scroll={false}>+ Nouveau berger</Link>}</div>
        </div>
        {list.length ? (
          <div className="cards">{list.map(b => {
            const n = brebisDe(b.id).length, r = releves.get(b.id);
            return (
              <Link key={b.id} className="card" href={`${base}?berger=${b.id}`} scroll={false}>
                <b>{fullName(b)}</b>
                <span className="meta mono">{b.contact || 'Sans contact'}</span>
                <span className="meta">{n} / {MAX} brebis · {r ? `${r.length} absence${r.length > 1 ? 's' : ''} cette semaine` : 'absences non relevées'}</span>
                <span className="meter" aria-hidden="true"><i className={n >= MAX ? 'full' : ''} style={{ width: `${Math.min(100, (n / MAX) * 100)}%` }} /></span>
              </Link>
            );
          })}</div>
        ) : (
          <Panel><Empty titre={q ? 'Aucun berger trouvé' : 'Aucun berger enregistré'} texte={estBerger && !s.profil.berger_id ? "Votre compte n'est pas encore relié à une fiche de berger : demandez-le à l'administration." : 'Ajoutez les bergers, puis rattachez-leur leurs brebis.'} /></Panel>
        )}
      </>
    );
  } else if (sous === 'brebis') {
    const rows = fideles.filter(f => f.berger_id).filter(f => !q || [fullName(f), f.telephone].join(' ').toLowerCase().includes(q));
    const sans = fideles.filter(f => !f.berger_id).length;
    const nomBerger = (id: string | null) => fullName(bergers.find(b => b.id === id));
    corps = (
      <>
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une brebis" />{!estBerger && sans > 0 && <span className="muted">{sans} fidèle{sans > 1 ? 's' : ''} sans berger</span>}</div>
        <Panel>
          {rows.length ? (
            <div className="tw"><table>
              <thead><tr><th>Nom et prénoms</th><th>Contacts</th><th>Berger</th></tr></thead>
              <tbody>{rows.map(f => (
                <tr key={f.id}><td><LienFiche href={`/fideles/liste?fiche=${f.id}`}>{fullName(f)}</LienFiche></td><td className="mono">{f.telephone || '—'}</td><td>{nomBerger(f.berger_id)}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <Empty titre="Aucune brebis rattachée" texte="Ouvrez la fiche d'un berger pour lui rattacher ses brebis." />}
        </Panel>
      </>
    );
  } else {
    corps = (
      <>
        <p className="lead" style={{ margin: 0 }}>Relevé de la {weekLabel(wk)}. Ouvrez un berger pour cocher les absences de ses brebis.</p>
        <Panel>
          {bergers.length ? (
            <div className="tw"><table>
              <thead><tr><th>Berger</th><th className="num">Brebis</th><th className="num">Absents</th><th>Relevé</th><th>Absents de la semaine</th></tr></thead>
              <tbody>{bergers.map(b => {
                const r = releves.get(b.id);
                const noms = (r ?? []).map(id => fullName(fideles.find(f => f.id === id)));
                return (
                  <tr key={b.id}>
                    <td><LienFiche href={`${base}?berger=${b.id}`}>{fullName(b)}</LienFiche></td>
                    <td className="num">{brebisDe(b.id).length}</td>
                    <td className="num">{r ? r.length : '—'}</td>
                    <td>{r ? <Pill c="g">Fait</Pill> : <Pill c="w">À faire</Pill>}</td>
                    <td className="muted">{noms.join(', ')}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          ) : <Empty titre="Aucun berger" texte="Ajoutez d'abord les bergers." />}
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHead id="bergers" sous={sous} />
      {corps}
      {sp.berger && await FenetreBerger({ s, id: sp.berger, mode: sp.mode, bergers, fideles, releve: releves.get(sp.berger), wk, base })}
    </>
  );
}

async function FenetreBerger({ s, id, mode, bergers, fideles, releve, wk, base }: {
  s: Session; id: string; mode?: string; bergers: Berger[]; fideles: Brebis[]; releve?: string[]; wk: string; base: string;
}) {
  const w = s.droits.bergers === 'w';
  const estBerger = s.profil.role_code === 'berger';
  if (id === 'nouveau' || mode === 'modifier') {
    const b = bergers.find(x => x.id === id);
    if (!w || (id === 'nouveau' && estBerger) || (id !== 'nouveau' && !b)) return null;
    return (
      <Modal titre={b ? 'Modifier le berger' : 'Nouveau berger'} retour={b ? `${base}?berger=${b.id}` : base}>
        <FormAction action={enregistrerBerger} className="form" bouton="Enregistrer" boutonClasse="btn primary">
          <input type="hidden" name="id" value={b?.id ?? ''} />
          <Champ k="nom" label="Nom" req v={b?.nom} />
          <Champ k="prenoms" label="Prénoms" v={b?.prenoms} />
          <Champ k="contact" label="Contact" type="tel" v={b?.contact} />
        </FormAction>
      </Modal>
    );
  }
  const b = bergers.find(x => x.id === id);
  if (!b) return null;
  const ici = `${base}?berger=${b.id}`;
  const brebis = fideles.filter(f => f.berger_id === b.id);
  const plein = brebis.length >= MAX;
  const absents = new Set(releve ?? []);
  let libres: { id: string; nom: string }[] = [];
  if (w && !plein) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('fideles_sans_berger');
    libres = (data ?? []) as { id: string; nom: string }[];
  }
  if (mode === 'brebis' && w && !plein) {
    return (
      <Modal titre={`Nouvelle brebis · ${fullName(b)}`} retour={ici}>
        <FormAction action={nouvelleBrebis} className="form" bouton="Enregistrer" boutonClasse="btn primary">
          <input type="hidden" name="berger" value={b.id} /><input type="hidden" name="retour" value={ici} />
          <Champ k="nom" label="Nom" req /><Champ k="prenoms" label="Prénoms" />
          <Champ k="sexe" label="Sexe" type="select" options={['Homme', 'Femme']} /><Champ k="date_naissance" label="Date de naissance" type="date" />
          <Champ k="telephone" label="Contact" type="tel" /><Champ k="commune" label="Commune" type="select" options={COMMUNES} />
          <Champ k="quartier" label="Quartier" /><Champ k="statut" label="Statut" type="select" options={STATUTS} v="Membre" />
          <Champ k="notes" label="Notes" type="textarea" />
        </FormAction>
      </Modal>
    );
  }
  return (
    <Modal titre={fullName(b)} retour={base} large pied={<>
      {w && !estBerger ? <DeleteButton action={() => supprimerBerger(b.id)} label="Supprimer le berger" confirmation="Confirmer : les brebis restent enregistrées" /> : <span />}
      <Link className="btn" href={base} scroll={false}>Fermer</Link>
    </>}>
      <dl className="kv"><dt>Contact</dt><dd className="mono">{b.contact || '—'}</dd><dt>Brebis suivies</dt><dd>{brebis.length} / {MAX} {plein && <Pill c="w">Complet</Pill>}</dd></dl>
      {w && (
        <div className="actions">
          {!plein && <Link className="btn sm" href={`${ici}&mode=brebis`} scroll={false}>+ Nouvelle brebis</Link>}
          {!estBerger && <Link className="btn sm" href={`${ici}&mode=modifier`} scroll={false}>Modifier le berger</Link>}
          {!plein && libres.length > 0 && (
            <FormAction action={rattacher} className="actions" bouton="Rattacher" boutonClasse="btn sm">
              <input type="hidden" name="berger" value={b.id} /><input type="hidden" name="retour" value={ici} />
              <select className="sel" name="fidele" aria-label="Rattacher un fidèle existant" defaultValue="">
                <option value="">Rattacher un fidèle existant…</option>
                {libres.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </select>
            </FormAction>
          )}
        </div>
      )}
      <Panel titre="Brebis (fidèles)">
        {brebis.length ? (
          <div className="tw"><table>
            <thead><tr><th>Nom et prénoms</th><th>Contacts</th><th /></tr></thead>
            <tbody>{brebis.map(f => (
              <tr key={f.id}><td>{fullName(f)}</td><td className="mono">{f.telephone || '—'}</td><td style={{ textAlign: 'right' }}><Link className="btn sm" href={`/fideles/liste?fiche=${f.id}`}>Fiche</Link></td></tr>
            ))}</tbody>
          </table></div>
        ) : <Empty titre="Aucune brebis" texte="Ajoutez jusqu'à quinze (15) personnes à suivre." />}
      </Panel>
      <Panel titre={`Absences · ${weekLabel(wk)}`} droite={releve ? <Pill c="g">Relevé enregistré</Pill> : <Pill c="w">Non relevé</Pill>}>
        <div className="body">
          {brebis.length ? (
            w ? (
              <FormAction action={enregistrerReleve} bouton="Enregistrer le relevé">
                <input type="hidden" name="berger" value={b.id} /><input type="hidden" name="semaine" value={wk} /><input type="hidden" name="retour" value={ici} />
                {brebis.map(f => (
                  <div className="check" key={f.id}>
                    <input type="checkbox" id={'ab-' + f.id} name="absent" value={f.id} defaultChecked={absents.has(f.id)} />
                    <label htmlFor={'ab-' + f.id}>{fullName(f)}</label>{absents.has(f.id) && <Pill c="b">Absent</Pill>}
                  </div>
                ))}
                <p className="muted" style={{ fontSize: 12.5, margin: '8px 0' }}>Cochez les absents de la semaine.</p>
              </FormAction>
            ) : brebis.map(f => <div className="check" key={f.id}><span style={{ flex: 1 }}>{fullName(f)}</span>{absents.has(f.id) && <Pill c="b">Absent</Pill>}</div>)
          ) : <p className="muted" style={{ margin: 0 }}>Ajoutez des brebis pour relever leurs absences.</p>}
        </div>
      </Panel>
    </Modal>
  );
}
