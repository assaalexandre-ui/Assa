import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { visibleMenus } from '@/lib/menus';
import { Sidebar } from '@/components/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect('/connexion');
  return (
    <div className="app">
      <Sidebar menus={visibleMenus(s.droits).map(m => m.id)} nom={s.profil.nom} role={s.roleLibelle} />
      <main id="main">
        <div className="testbar" role="note">Version de test : données fictives. N&apos;y saisissez pas de vraies personnes.</div>
        {children}
      </main>
    </div>
  );
}
