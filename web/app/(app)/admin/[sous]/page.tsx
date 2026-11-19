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
import { creerUtilisateur, modifierUtilisateur, reinitialiserMotDePasse } from '../actions';

type Compte = { id: string; nom: string; email: string | null; role_code: string; fonction: string | null; berger_id: string | null; actif: boolean };

export default async function Admin({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['utilisateurs', 'roles'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('admin');
  const supabase = await createClient();
  const [{ data: roles }, { data: rm }] = await Promise.all([
    supabase.from('role').select('code, libelle, description').order('ordre'),
    supabase.from('role_menu').select('role_code, menu, acces'),
  ]);
  const optRoles = (roles ?? []).map(r => [r.code, r.libelle] as [string, string]);
  const libRole = (c: string) => optRoles.find(r => r[0] === c)?.[1] ?? c;

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

  const [{ data: comptes }, refs] = await Promise.all([supabase.from('profil').select('id, nom, email, role_code, fonction, berger_id, actif').order('nom'), chargerRefs()]);
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
            <Champ k="berger_id" label="Fiche de berger (pour un berger)" type="select" options={refs.bergers} full />
          </FormCompte>
        </div>
      </Panel>
      <Panel titre={`Utilisateurs (${liste.length})`}>
        <div className="tw"><table><thead><tr><th>Personne</th><th>Email</th><th>Rôle</th><th>Fonction</th><th>Rattachement</th><th>État</th></tr></thead>
          <tbody>{liste.map(c => (
            <tr key={c.id}>
              <td><LienFiche href={`/admin/utilisateurs?compte=${c.id}`}>{c.nom}</LienFiche>{c.id === s.userId && <> <Pill c="a">vous</Pill></>}</td>
              <td className="mono">{c.email ?? '—'}</td><td><Pill>{libRole(c.role_code)}</Pill></td><td>{c.fonction || '—'}</td>
              <td>{c.berger_id ? 'Berger : ' + (refs.noms[c.berger_id] ?? '—') : '—'}</td>
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
            <Champ k="berger_id" label="Fiche de berger (pour un berger)" type="select" options={refs.bergers} v={edit.berger_id} full />
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
