import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { Champ } from '@/components/Champ';
import { FormCompte } from '@/components/FormCompte';
import { LienFiche, Panel, Pill } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { chargerRefs } from '@/lib/ref';
import { MENUS } from '@/lib/menus';
import { FormAction } from '@/components/FormAction';
import { COMMUNES } from '@/lib/entites';
import { creerUtilisateur, enregistrerEglise, modifierUtilisateur, reinitialiserMotDePasse } from '../actions';

type Compte = { id: string; nom: string; email: string | null; role_code: string; fonction: string | null; berger_id: string | null; gc_id: string | null; departement_id: string | null; actif: boolean };

export default async function Admin({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['utilisateurs', 'roles', 'eglise', 'journal'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('admin');
  const supabase = await createClient();
  const [{ data: roles }, { data: rm }] = await Promise.all([
    supabase.from('role').select('code, libelle, description').order('ordre'),
    supabase.from('role_menu').select('role_code, menu, acces'),
  ]);
  const optRoles = (roles ?? []).map(r => [r.code, r.libelle] as [string, string]);
  const libRole = (c: string) => optRoles.find(r => r[0] === c)?.[1] ?? c;

  if (sous === 'eglise') {
    const { data: e } = await supabase.from('eglise').select('id, nom, nom_complet, pasteur, telephone, adresse, commune, email, horaires').single();
    const ro = s.droits.admin !== 'w';
    return (
      <>
        <PageHead id="admin" sous={sous} />
        <Panel titre="Informations de l'église">
          <div className="body">
            <FormAction action={enregistrerEglise} className="form" bouton="Enregistrer" boutonClasse="btn primary">
              <input type="hidden" name="id" value={e?.id ?? ''} />
              <Champ k="nom_complet" label="Nom complet de l'église" full v={e?.nom_complet} ro={ro} />
              <Champ k="pasteur" label="Pasteur principal" v={e?.pasteur} ro={ro} />
              <Champ k="telephone" label="Téléphone" type="tel" v={e?.telephone} ro={ro} />
              <Champ k="adresse" label="Adresse du temple" full v={e?.adresse} ro={ro} />
              <Champ k="commune" label="Commune" type="select" options={COMMUNES} v={e?.commune} ro={ro} />
              <Champ k="email" label="Email" type="email" v={e?.email} ro={ro} />
              <Champ k="horaires" label="Horaires des cultes" type="textarea" full v={e?.horaires} ro={ro} />
            </FormAction>
          </div>
        </Panel>
        <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Ces informations apparaîtront en tête des rapports. Seul l&apos;administrateur peut les modifier.</p>
      </>
    );
  }

  if (sous === 'journal') {
    const { data: j, error } = await supabase.rpc('dernieres_modifications', { p_limite: 60 });
    const lignes = (j ?? []) as { quand: string; fiche: string; menu: string; par: string }[];
    return (
      <>
        <PageHead id="admin" sous={sous} />
        <p className="lead" style={{ margin: 0 }}>Les 60 dernières fiches créées ou modifiées, avec la personne qui l&apos;a fait.</p>
        <Panel>{error ? <div className="body err">Le journal n&apos;a pas pu être chargé.</div> : lignes.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Fiche</th><th>Menu</th><th>Par</th></tr></thead>
            <tbody>{lignes.map((x, i) => (
              <tr key={i}><td className="mono">{new Date(x.quand).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Abidjan' })}</td><td>{x.fiche}</td><td><Pill c="n">{x.menu}</Pill></td><td>{x.par}</td></tr>
            ))}</tbody></table></div>
        ) : <div className="empty"><b>Aucune modification</b>Les dernières fiches créées ou modifiées apparaîtront ici.</div>}</Panel>
      </>
    );
  }

  if (sous === 'roles') {
    const menus = MENUS.filter(m => m.id !== 'accueil');
    const acces = (r: string, m: string) => rm?.find(x => x.role_code === r && x.menu === m)?.acces;
    return (
      <>
        <PageHead id="admin" sous={sous} />
        <Panel titre="Rôles"><div className="tw"><table><thead><tr><th>Rôle</th><th>Accès</th></tr></thead>
          <tbody>{(roles ?? []).map(r => <tr key={r.code}><td><b>{r.libelle}</b></td><td className="muted">{r.description}</td></tr>)}</tbody></table></div></Panel>
        <Panel titre="Accès par menu" droite={<span className="muted"><span className="dot w" /> modification &nbsp; <span className="dot r" /> lecture</span>}>
          <div className="tw"><table className="matrix"><thead><tr><th>Menu</th>{(roles ?? []).map(r => <th key={r.code}>{r.libelle}</th>)}</tr></thead>
            <tbody>{menus.map(m => <tr key={m.id}><td>{m.t}</td>{(roles ?? []).map(r => { const a = acces(r.code, m.id); return <td key={r.code}>{a && <span className={`dot ${a}`} title={a === 'w' ? 'Modification' : 'Lecture'} />}</td>; })}</tr>)}</tbody>
          </table></div>
        </Panel>
        <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Ces droits sont appliqués par la base de données. Les bergers ne voient que leurs propres brebis quand leur compte est relié à leur fiche. Tous les rôles ont accès à l&apos;Accueil.</p>
      </>
    );
  }

  const [{ data: comptes }, refs, { data: depsData }] = await Promise.all([supabase.from('profil').select('id, nom, email, role_code, fonction, berger_id, gc_id, departement_id, actif').order('nom'), chargerRefs(), supabase.from('departement').select('id, nom').order('ordre')]);
  const optDeps = (depsData ?? []).map(d => [d.id, d.nom] as [string, string]);
  const liste = (comptes ?? []) as Compte[];
  const edit = sp.compte ? liste.find(c => c.id === sp.compte) : undefined;
  return (
    <>
      <PageHead id="admin" sous={sous} />
      <div className="banner info">Chaque testeur a son compte. Après la création, transmettez-lui son email et le mot de passe provisoire : il le changera dans « Mon profil ».</div>
      <Panel titre="Ajouter une personne">
        <div className="body">
          <FormCompte action={creerUtilisateur} id="creer" bouton="Créer le compte">
            <Champ k="nom" label="Nom et prénoms" req />
            <Champ k="email" label="Email" type="email" req />
            <Champ k="role_code" label="Rôle" type="select" options={optRoles} req v="membre" />
            <Champ k="fonction" label="Fonction dans l'église" />
            <Champ k="berger_id" label="Fiche de berger (pour un berger)" type="select" options={refs.bergers} />
            <Champ k="gc_id" label="GC (pour un responsable de GC)" type="select" options={refs.gc} />
            <Champ k="departement_id" label="Département (pour un responsable de département)" type="select" options={optDeps} full />
          </FormCompte>
        </div>
      </Panel>
      <Panel titre={`Utilisateurs (${liste.length})`}>
        <div className="tw"><table><thead><tr><th>Personne</th><th>Email</th><th>Rôle</th><th>Fonction</th><th>Rattachement</th><th>État</th></tr></thead>
          <tbody>{liste.map(c => (
            <tr key={c.id}>
              <td><LienFiche href={`/admin/utilisateurs?compte=${c.id}`}>{c.nom}</LienFiche>{c.id === s.userId && <> <Pill c="a">vous</Pill></>}</td>
              <td className="mono">{c.email ?? '—'}</td><td><Pill>{libRole(c.role_code)}</Pill></td><td>{c.fonction || '—'}</td>
              <td>{c.berger_id ? 'Berger : ' + (refs.noms[c.berger_id] ?? '—') : c.gc_id ? 'GC : ' + (refs.gc.find(g => g[0] === c.gc_id)?.[1] ?? '—') : c.departement_id ? optDeps.find(d => d[0] === c.departement_id)?.[1] ?? '—' : '—'}</td>
              <td>{c.actif ? <Pill c="g">Actif</Pill> : <Pill c="n">Désactivé</Pill>}</td>
            </tr>
          ))}</tbody></table></div>
      </Panel>
      {edit && (
        <Modal titre={`Compte de ${edit.nom}`} retour="/admin/utilisateurs" pied={<><span /><Link className="btn" href="/admin/utilisateurs" scroll={false}>Fermer</Link></>}>
          <FormCompte action={modifierUtilisateur} bouton="Enregistrer">
            <input type="hidden" name="id" value={edit.id} />
            <Champ k="nom" label="Nom et prénoms" req v={edit.nom} full />
            <Champ k="role_code" label="Rôle" type="select" options={optRoles} req v={edit.role_code} />
            <Champ k="fonction" label="Fonction dans l'église" v={edit.fonction} />
            <Champ k="berger_id" label="Fiche de berger (pour un berger)" type="select" options={refs.bergers} v={edit.berger_id} />
            <Champ k="gc_id" label="GC (pour un responsable de GC)" type="select" options={refs.gc} v={edit.gc_id} />
            <Champ k="departement_id" label="Département (pour un responsable de département)" type="select" options={optDeps} v={edit.departement_id} full />
            <div className="field full"><label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500, color: 'var(--ink)' }}><input type="checkbox" name="actif" defaultChecked={edit.actif} style={{ width: 18, height: 18, minHeight: 0 }} /> Compte actif</label></div>
          </FormCompte>
          <FormCompte action={reinitialiserMotDePasse} className="" bouton="Générer un nouveau mot de passe" boutonClasse="btn sm">
            <input type="hidden" name="id" value={edit.id} />
          </FormCompte>
        </Modal>
      )}
    </>
  );
}
