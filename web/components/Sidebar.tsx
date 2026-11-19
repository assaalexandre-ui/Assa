'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MENUS, type MenuId } from '@/lib/menus';
import { Logo } from './Logo';
import { seDeconnecter } from '@/app/connexion/actions';

type Props = { menus: MenuId[]; nom: string; role: string };

export function Sidebar({ menus, nom, role }: Props) {
  const path = usePathname();
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => setOuvert(false), [path]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);
  const visibles = MENUS.filter(m => menus.includes(m.id));
  const actif = (id: MenuId) => (id === 'accueil' ? path === '/' : path.startsWith('/' + id));
  let section = '';
  const initiales = nom.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <>
      <div className="topbar">
        <button className="menu-btn" type="button" onClick={() => setOuvert(true)} aria-expanded={ouvert} aria-controls="side">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>Menu
        </button>
        <Logo couleur="var(--ink)" className="logo" />
      </div>
      <aside id="side" className={ouvert ? 'open' : ''} aria-label="Navigation">
        <div className="brand"><Link href="/" aria-label="Accueil"><Logo /></Link><span>Gestion de l&apos;église</span></div>
        <nav>
          {visibles.map(m => {
            const titre = m.section !== section ? (section = m.section) : null;
            return (
              <div key={m.id} style={{ display: 'contents' }}>
                {titre && <div className={'sec' + (m.vert ? ' vie' : '')}>{titre}</div>}
                <Link href={m.id === 'accueil' ? '/' : `/${m.id}/${m.subs[0][0]}`} className={(m.vert ? 'vie ' : '') + (actif(m.id) ? 'on' : '')} aria-current={actif(m.id) ? 'page' : undefined}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: m.icone }} />
                  {m.t}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="me">
          <span className="avatar" aria-hidden="true">{initiales || '?'}</span>
          <div>
            <b>{nom}</b>
            <span>{role}</span>
            <div className="links">
              <Link href="/profil">Mon profil</Link>
              <form action={seDeconnecter}><button type="submit">Se déconnecter</button></form>
            </div>
          </div>
        </div>
      </aside>
      <div className={'scrim' + (ouvert ? ' open' : '')} onClick={() => setOuvert(false)} />
    </>
  );
}
