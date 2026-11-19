import Link from 'next/link';
import { LEADS, menu, type MenuId } from '@/lib/menus';

/** En-tête d'un menu : fil, titre, introduction et onglets des sous-menus. */
export function PageHead({ id, sous }: { id: MenuId; sous?: string }) {
  const m = menu(id)!;
  return (
    <>
      <div className="head"><div>
        <div className="crumb">{m.section || 'EMCV'}</div>
        <h1>{m.t}</h1>
        <p className="lead">{LEADS[id]}</p>
      </div></div>
      {m.subs.length > 1 && (
        <div className={'tabs' + (m.vert ? ' vie' : '')} role="tablist">
          {m.subs.map(([s, l]) => (
            <Link key={s} href={`/${id}/${s}`} role="tab" aria-selected={s === sous} className={s === sous ? 'on' : ''}>{l}</Link>
          ))}
        </div>
      )}
    </>
  );
}
