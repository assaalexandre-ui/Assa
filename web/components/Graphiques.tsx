// Graphiques du tableau de bord, repris de l'artefact : barres verticales (évolution) et barres horizontales (classement).
// Chaque graphique garde son tableau de valeurs dépliable, pour les lecteurs d'écran et pour vérifier un chiffre.

const nombre = (v: number) => Math.round(v).toLocaleString('fr-FR').replace(/[  ]/g, ' ');
const graduation = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }).replace(/[  ]/g, ' ');
const court = (v: number) => (v >= 1e6 ? (Math.round(v / 1e5) / 10).toString().replace('.', ',') + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' k' : String(v));
const valeur = (v: number, f?: 'money' | 'pct') => (f === 'money' ? nombre(v) + ' FCFA' : f === 'pct' ? nombre(v) + ' %' : nombre(v));

type Point = [string, number, string?];

const TONS_ENTETE = ['saphir', 'rubis', 'emeraude', 'ambre', 'amethyste', 'ciel'];
/** En-tête d'un graphique : icône ronde (barres ou classement), titre, sous-titre. */
function Entete({ titre, sous, classement }: { titre: string; sous?: string; classement?: boolean }) {
  let h = 0;
  for (const c of titre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const trace = classement ? '<path d="M4 6h10M4 12h16M4 18h7"/>' : '<path d="M4 20V13M9.5 20V8M15 20v-5M20.5 20V5"/>';
  return (
    <header>
      <span className="pico" style={{ ['--j' as string]: `var(--${TONS_ENTETE[h % 6]})` }}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: trace }} /></span>
      <div style={{ flex: 1, minWidth: 0 }}><h2>{titre}</h2>{sous && <span className="muted" style={{ fontSize: 12.5 }}>{sous}</span>}</div>
    </header>
  );
}

/** Barres verticales : une période par barre ; la dernière et la plus haute portent leur valeur. */
export function BarresV({ titre, sous, data, f }: { titre: string; sous?: string; data: Point[]; f?: 'money' }) {
  const W = 600, H = 230, L = 50, B = 30, T = 20, n = Math.max(1, data.length);
  const max = Math.max(1, ...data.map(d => d[1]));
  const step = (W - L - 8) / n, bw = Math.max(6, Math.min(34, step * 0.62));
  const p = Math.pow(10, Math.floor(Math.log10(max))), m = max / p;
  const haut = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  const y = (v: number) => T + (H - T - B) * (1 - v / haut);
  const iMax = data.reduce((bi, d, i) => (d[1] > data[bi][1] ? i : bi), 0);
  return (
    <section className="panel chart">
      <Entete titre={titre} sous={sous} />
      <div className="body">
        <div className="tw">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titre} style={{ width: '100%', minWidth: 380, height: 'auto', display: 'block' }}>
            {[0, haut / 2, haut].map(t => (
              <g key={t}><line x1={L} x2={W - 4} y1={y(t)} y2={y(t)} className="cg" />
                <text x={L - 8} y={y(t) + 4} textAnchor="end" className="cx">{f === 'money' ? court(t) : graduation(t)}</text></g>
            ))}
            {data.map((d, i) => {
              const x = L + i * step + (step - bw) / 2, h = Math.max(0, y(0) - y(d[1])), r = Math.min(4, h / 2, bw / 2);
              const chemin = h > 0 ? `M${x},${y(0)} V${y(d[1]) + r} Q${x},${y(d[1])} ${x + r},${y(d[1])} H${x + bw - r} Q${x + bw},${y(d[1])} ${x + bw},${y(d[1]) + r} V${y(0)} Z` : '';
              const info = `${d[0]} : ${valeur(d[1], f)}`;
              return (
                <g key={d[0]} className="bar">
                  <rect x={L + i * step} y={T} width={step} height={H - T - B} fill="transparent"><title>{info}</title></rect>
                  {chemin && <path d={chemin} fill="var(--accent)"><title>{info}</title></path>}
                  {(i === n - 1 || i === iMax) && d[1] > 0 && <text x={x + bw / 2} y={y(d[1]) - 6} textAnchor="middle" className="cv">{f === 'money' ? court(d[1]) : nombre(d[1])}</text>}
                  <text x={x + bw / 2} y={H - 9} textAnchor="middle" className="cx">{d[2] ?? d[0]}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <details><summary>Voir le tableau</summary>
          <div className="tw"><table><thead><tr><th>Période</th><th className="num">Valeur</th></tr></thead>
            <tbody>{data.map(d => <tr key={d[0]}><td>{d[0]}</td><td className="num">{valeur(d[1], f)}</td></tr>)}</tbody></table></div>
        </details>
      </div>
    </section>
  );
}

/** Barres horizontales triées : un classement (10 premiers), valeur à droite. */
export function BarresH({ titre, sous, data, f, tri = true }: { titre: string; sous?: string; data: Point[]; f?: 'money' | 'pct'; tri?: boolean }) {
  const lignes = data.filter(d => d[1] > 0);
  if (tri) lignes.sort((a, b) => b[1] - a[1]);
  const rows = lignes.slice(0, 10);
  const max = f === 'pct' ? 100 : Math.max(1, ...rows.map(d => d[1]));
  return (
    <section className="panel chart">
      <Entete titre={titre} sous={sous} classement />
      <div className="body">
        {rows.length ? (
          <div className="hb">{rows.map(d => (
            <div className="hbr" key={d[0]} title={`${d[0]} : ${valeur(d[1], f)}`}>
              <span className="hbl">{d[0]}</span><span className="hbt"><i style={{ width: `${Math.max(2, (d[1] / max) * 100)}%` }} /></span><span className="hbv">{valeur(d[1], f)}</span>
            </div>
          ))}</div>
        ) : <p className="muted" style={{ margin: 0 }}>Pas encore de données.</p>}
      </div>
    </section>
  );
}

const TONS = ['var(--saphir)', 'var(--rubis)', 'var(--emeraude)', 'var(--ambre)', 'var(--amethyste)', 'var(--ciel)'];

/** Rosace : un pétale par groupe, sa longueur suit le pourcentage (comme une rosace de vitrail). Sans relevé : pétale en pointillé. */
export function Rosace({ data, centre, legende }: { data: [string, number | null][]; centre: string; legende: string }) {
  const n = Math.max(1, data.length), c = 150, r0 = 36;
  const pt = (r: number, a: number) => `${(c + r * Math.cos(a)).toFixed(1)} ${(c + r * Math.sin(a)).toFixed(1)}`;
  const petale = (i: number, pct: number) => {
    const a1 = (-90 + (i * 360) / n + 1.5) * Math.PI / 180, a2 = (-90 + ((i + 1) * 360) / n - 1.5) * Math.PI / 180, r = r0 + Math.max(4, pct) * 1.05;
    const grand = (a2 - a1) > Math.PI ? 1 : 0;
    return `M${pt(r0, a1)}L${pt(r, a1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 ${grand} 1 ${pt(r, a2)}L${pt(r0, a2)}A${r0} ${r0} 0 ${grand} 0 ${pt(r0, a1)}Z`;
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
      <svg viewBox="-14 -14 328 328" role="img" aria-label={legende} style={{ flex: '1 1 220px', maxWidth: 290, height: 'auto' }}>
        <circle cx={c} cy={c} r={140} fill="none" stroke="var(--lead)" />
        <circle cx={c} cy={c} r={r0 + 52} fill="none" stroke="var(--lead)" strokeDasharray="3 4" />
        {data.map(([l, p], i) => p == null
          ? <path key={l} d={petale(i, 6)} fill="none" stroke="var(--line)" strokeDasharray="2 3"><title>{`${l} : pas de relevé`}</title></path>
          : <path key={l} d={petale(i, p)} fill={TONS[i % 6]}><title>{`${l} : ${p} %`}</title></path>)}
        <circle cx={c} cy={c} r={30} fill="var(--ink)" />
        <text x={c} y={c - 2} textAnchor="middle" fill="var(--bg)" fontFamily="var(--f-disp)" fontSize="17" fontWeight="700">{centre}</text>
        <text x={c} y={c + 13} textAnchor="middle" fill="var(--bg)" fontSize="8.5">moyenne</text>
      </svg>
      <ol style={{ flex: '1 1 170px', margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: '6px 14px', fontSize: 12.5 }}>
        {data.map(([l, p], i) => (
          <li key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, minWidth: 0 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 6, background: p == null ? 'var(--line)' : TONS[i % 6] }} />{l}</span>
            <b style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{p == null ? '—' : p + ' %'}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Anneau de répartition (statuts, catégories), total au centre et légende à droite. */
export function Anneau({ parts, total, unite }: { parts: [string, number][]; total: number; unite: string }) {
  const somme = Math.max(1, parts.reduce((t, p) => t + p[1], 0));
  let acc = 0;
  const arcs = parts.map(([, v], i) => { const a = acc; acc += (v / somme) * 100; return `${TONS[i % 6]} ${a}% ${acc}%`; }).join(', ');
  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
      <div role="img" aria-label={parts.map(p => `${p[0]} ${p[1]}`).join(', ')} style={{ width: 150, height: 150, borderRadius: '50%', background: `conic-gradient(${arcs || 'var(--line) 0 100%'})`, display: 'grid', placeItems: 'center', flex: 'none' }}>
        <div style={{ width: 92, height: 92, borderRadius: '50%', background: 'var(--bg)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div><div className="disp" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{total}</div><div className="muted" style={{ fontSize: 11 }}>{unite}</div></div>
        </div>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13, flex: '1 1 120px' }}>
        {parts.map(([l, v], i) => (
          <li key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: TONS[i % 6], marginRight: 8 }} />{l}</span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</b></li>
        ))}
      </ul>
    </div>
  );
}

/** Barres empilées par période (ex. hommes, femmes, enfants à chaque culte). */
export function BarresEmpilees({ data, series }: { data: { l: string; court: string; parts: number[] }[]; series: string[] }) {
  const max = Math.max(1, ...data.map(d => d.parts.reduce((t, v) => t + v, 0)));
  const p = Math.pow(10, Math.floor(Math.log10(max))), m = max / p;
  const haut = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  return (
    <>
      <div className="legende" style={{ marginBottom: 10 }}>{series.map((s, i) => <span key={s}><i style={{ background: TONS[i % 6] }} />{s}</span>)}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="muted" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 11.5, textAlign: 'right', height: 200, fontVariantNumeric: 'tabular-nums' }}>{nombre(haut)}<span>{nombre(haut / 2)}</span><span>0</span></div>
        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, minWidth: Math.max(260, data.length * 36), borderBottom: '1px solid var(--line)', backgroundImage: 'linear-gradient(var(--tint) 1px, transparent 1px)', backgroundSize: '100% 50%' }}>
            {data.map(d => {
              const t = d.parts.reduce((a, v) => a + v, 0);
              return (
                <div key={d.l} title={`${d.l} : ${nombre(t)} (${d.parts.map((v, i) => `${series[i]} ${v}`).join(', ')})`} style={{ flex: 1, height: `${(t / haut) * 100}%`, display: 'flex', flexDirection: 'column-reverse', borderRadius: '3px 3px 0 0', overflow: 'hidden', maxWidth: 46, margin: '0 auto' }}>
                  {d.parts.map((v, i) => <span key={i} style={{ height: `${t ? (v / t) * 100 : 0}%`, background: TONS[i % 6] }} />)}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, minWidth: Math.max(260, data.length * 36) }}>{data.map(d => <span key={d.l} className="muted" style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>{d.court}</span>)}</div>
        </div>
      </div>
      <details style={{ marginTop: 8 }}><summary className="link">Voir le tableau</summary>
        <div className="tw"><table><thead><tr><th>Date</th>{series.map(s => <th key={s} className="num">{s}</th>)}<th className="num">Total</th></tr></thead>
          <tbody>{data.map(d => <tr key={d.l}><td>{d.l}</td>{d.parts.map((v, i) => <td key={i} className="num">{nombre(v)}</td>)}<td className="num">{nombre(d.parts.reduce((a, v) => a + v, 0))}</td></tr>)}</tbody></table></div>
      </details>
    </>
  );
}
