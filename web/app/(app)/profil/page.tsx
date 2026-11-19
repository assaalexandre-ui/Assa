import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { FormMdp } from './FormMdp';

export default async function Profil() {
  const s = await getSession();
  if (!s) redirect('/connexion');
  return (
    <>
      <div className="head"><div><div className="crumb">EMCV</div><h1>Mon profil</h1></div></div>
      <section className="panel"><header><h2>Mon compte</h2></header><div className="body">
        <dl className="kv"><dt>Nom</dt><dd>{s.profil.nom}</dd><dt>Email</dt><dd>{s.profil.email ?? '—'}</dd><dt>Rôle</dt><dd>{s.roleLibelle}</dd>{s.profil.fonction && <><dt>Fonction</dt><dd>{s.profil.fonction}</dd></>}</dl>
      </div></section>
      <section className="panel"><header><h2>Changer mon mot de passe</h2></header><div className="body"><FormMdp /></div></section>
    </>
  );
}
