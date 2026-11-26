'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MENUS, type MenuDef, type MenuId } from '@/lib/menus';
import { Logo } from './Logo';
import { ChoixTheme } from './ChoixTheme';
import { seDeconnecter } from '@/app/connexion/actions';

type Props = { menus: MenuId[]; nom: string; role: string };

/** Menu en liste (style Synthex) : les menus autorisés, sans regroupement ; la flèche déplie les sous-menus. */
export function Sidebar({ menus, nom, role }: Props) {
  const path = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const visibles = MENUS.filter(m => menus.includes(m.id));
  const actif = (id: MenuId) => (id === 'accueil' ? path === '/' : path === '/' + id || path.startsWith('/' + id + '/'));
  const courant = visibles.find(m => actif(m.id))?.id ?? null;
  const [deplie, setDeplie] = useState<MenuId | null>(courant);
  useEffect(() => { setOuvert(false); setDeplie(courant); }, [path, courant]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);
  const initiales = nom.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const lien = (m: MenuDef) => (m.id === 'accueil' ? '/' : `/${m.id}/${m.subs[0][0]}`);
  return (
    <>
      <div className="topbar">
        <button className="menu-btn" type="button" onClick={() => setOuvert(true)} aria-expanded={ouvert} aria-controls="side">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>Menu
        </button>
        <Logo couleur="var(--ink)" className="logo" />
      </div>
      <aside id="side" className={ouvert ? 'open' : ''} aria-label="Navigation">
        <div className="brand"><Link href="/" aria-label="Accueil"><Logo couleur="var(--ink)" /></Link><span>Gestion de l&apos;église</span></div>
        <nav className="liste">
          {visibles.map(m => {
            const plusieurs = m.subs.length > 1, on = actif(m.id), plie = deplie !== m.id;
            return (
              <div key={m.id} className={'ligne' + (on ? ' on' : '')}>
                <div className="tete">
                  {plusieurs
                    ? <button type="button" className="fleche" aria-expanded={!plie} aria-label={`${plie ? 'Déplier' : 'Replier'} ${m.t}`} onClick={() => setDeplie(plie ? m.id : null)}>
                        <svg viewBox="0 0 12 12" aria-hidden="true" style={{ transform: plie ? 'rotate(-90deg)' : 'none' }}><path d="M3 4.5l3 3 3-3" /></svg>
                      </button>
                    : <span className="fleche" aria-hidden="true" />}
                  <Link href={lien(m)} className="nb" aria-current={on ? 'page' : undefined}>
                    <svg className="mi" viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: m.icone }} />{m.t}
                  </Link>
                </div>
                {plusieurs && !plie && (
                  <div className="subs">
                    {m.subs.map(([k, l]) => {
                      const ici = path === `/${m.id}/${k}`;
                      return <Link key={k} href={`/${m.id}/${k}`} className={ici ? 'on' : ''} aria-current={ici ? 'page' : undefined}>{l}</Link>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <ChoixTheme />
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
