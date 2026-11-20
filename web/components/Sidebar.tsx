'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MENUS, type MenuDef, type MenuId } from '@/lib/menus';
import { Logo } from './Logo';
import { seDeconnecter } from '@/app/connexion/actions';

type Props = { menus: MenuId[]; nom: string; role: string };

// Icône et libellé de chaque section dans la barre (piste « Vitrail » : grandes icônes empilées).
const SECTIONS: Record<string, { court: string; icone: string; ton?: string }> = {
  "Structure de l'église": { court: "Structure de l'église", ton: 'emeraude', icone: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5v5.5M12 15v5.5M3.5 12H9M15 12h5.5M6 6l3.9 3.9M14.1 14.1L18 18M18 6l-3.9 3.9M9.9 14.1L6 18"/>' },
  'Tableau de bord': { court: 'Tableau de bord', ton: 'amethyste', icone: '<path d="M4 20V13M9.5 20V8M15 20v-5M20.5 20V5"/><path d="M3 20.5h18"/>' },
  'Fidèles et pastorale': { court: 'Fidèles et pastorale', ton: 'rubis', icone: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14 14.6c3.4-.6 6.5 1.6 7 5.4"/>' },
  'Cultes et activités': { court: 'Cultes et activités', ton: 'ambre', icone: '<path d="M12 3v5M9.5 5.5h5"/><path d="M5 21V12l7-4 7 4v9"/><path d="M10 21v-4h4v4"/>' },
  'Finances et ressources': { court: 'Finances et ressources', ton: 'ciel', icone: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14.5" r="1.5"/>' },
};

type Groupe = { section: string; menus: MenuDef[] };

/** Regroupe les menus visibles par section, dans l'ordre de l'artefact. */
function grouper(visibles: MenuDef[]): Groupe[] {
  const out: Groupe[] = [];
  for (const m of visibles) {
    const g = out[out.length - 1];
    if (g && g.section === m.section && m.section) g.menus.push(m);
    else out.push({ section: m.section, menus: [m] });
  }
  return out;
}

export function Sidebar({ menus, nom, role }: Props) {
  const path = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const visibles = MENUS.filter(m => menus.includes(m.id));
  const groupes = grouper(visibles);
  const actif = (id: MenuId) => (id === 'accueil' ? path === '/' : path === '/' + id || path.startsWith('/' + id + '/'));
  const courante = groupes.find(g => g.menus.length > 1 && g.menus.some(m => actif(m.id)))?.section ?? '';
  const [deplie, setDeplie] = useState(courante);
  useEffect(() => { setOuvert(false); if (courante) setDeplie(courante); }, [path, courante]);
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
        <div className="brand"><Link href="/" aria-label="Accueil"><Logo /></Link><span>Gestion de l&apos;église</span></div>
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
        <nav className="vitrail">
          {groupes.map(g => {
            if (g.menus.length === 1) {
              const m = g.menus[0];
              return (
                <Link key={m.id} href={lien(m)} className={'nb' + (actif(m.id) ? ' on' : '')} aria-current={actif(m.id) ? 'page' : undefined}>
                  <span className="bille" style={{ ['--j' as string]: `var(--${m.id === 'admin' ? 'amethyste' : 'saphir'})` }}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: m.icone }} /></span>
                  {m.t}
                </Link>
              );
            }
            const s = SECTIONS[g.section] ?? { court: g.section, icone: g.menus[0].icone };
            const ouverte = deplie === g.section;
            const dedans = g.menus.some(m => actif(m.id));
            const id = 'sec-' + g.menus[0].id;
            return (
              <div key={g.section}>
                <button type="button" className={'nb' + (dedans ? ' on' : ouverte ? ' open' : '')} aria-expanded={ouverte} aria-controls={id} onClick={() => setDeplie(ouverte ? '' : g.section)}>
                  <span className="bille" style={{ ['--j' as string]: `var(--${s.ton ?? 'saphir'})` }}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: s.icone }} /></span>
                  {s.court}
                </button>
                <div id={id} className={'subs' + (g.menus[0].vert ? ' vie' : '')} hidden={!ouverte}>
                  {g.menus.map(m => (
                    <Link key={m.id} href={lien(m)} className={actif(m.id) ? 'on' : ''} aria-current={actif(m.id) ? 'page' : undefined}>{m.t}</Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className={'scrim' + (ouvert ? ' open' : '')} onClick={() => setOuvert(false)} />
    </>
  );
}
