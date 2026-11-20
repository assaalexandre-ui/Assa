// Graphiques du tableau de bord, repris de l'artefact : barres verticales (évolution) et barres horizontales (classement).
// Chaque graphique garde son tableau de valeurs dépliable, pour les lecteurs d'écran et pour vérifier un chiffre.

const nombre = (v: number) => Math.round(v).toLocaleString('fr-FR').replace(/[  ]/g, ' ');
const graduation = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }).replace(/[  ]/g, ' ');
const court = (v: number) => (v >= 1e6 ? (Math.round(v / 1e5) / 10).toString().replace('.', ',') + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' k' : String(v));
const valeur = (v: number, f?: 'money' | 'pct') => (f === 'money' ? nombre(v) + ' FCFA' : f === 'pct' ? nombre(v) + ' %' : nombre(v));

type Point = [string, number, string?];

function Entete({ titre, sous }: { titre: string; sous?: string }) {
  return <header><div><h2>{titre}</h2>{sous && <span className="muted" style={{ fontSize: 12.5 }}>{sous}</span>}</div></header>;
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
      <Entete titre={titre} sous={sous} />
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
