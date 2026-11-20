import Link from 'next/link';
import { LEADS, menu, sousMenus, type MenuId } from '@/lib/menus';
import { getSession } from '@/lib/session';

/** En-tête d'un menu : fil, titre, introduction et onglets des sous-menus. */
export async function PageHead({ id, sous }: { id: MenuId; sous?: string }) {
  const m = menu(id)!;
  const s = await getSession();
  const subs = s ? sousMenus(m, s.droits) : m.subs;
  return (
    <>
      <div className="head"><div>
        <div className="crumb">{m.section || 'EMCV'}</div>
        <h1>{m.t}</h1>
        <span className="vitre" aria-hidden="true" />
        <p className="lead">{LEADS[id]}</p>
      </div></div>
      {subs.length > 1 && (
        <div className={'tabs' + (m.vert ? ' vie' : '')} role="tablist">
          {subs.map(([k, l]) => (
            <Link key={k} href={`/${id}/${k}`} role="tab" aria-selected={k === sous} className={k === sous ? 'on' : ''}>{l}</Link>
          ))}
        </div>
      )}
    </>
  );
}
