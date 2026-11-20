'use client';
import { useState } from 'react';

export type Cible = { cle: string; libelle: string; contacts: [string, string | null][] };

/** Choix des destinataires, message et copie (message, numéros) à coller dans WhatsApp Business ou un outil SMS. */
export function PreparerMessage({ cibles }: { cibles: Cible[] }) {
  const [cle, setCle] = useState(cibles[0]?.cle ?? '');
  const [texte, setTexte] = useState('');
  const [info, setInfo] = useState('');
  const cible = cibles.find(c => c.cle === cle);
  const avecNumero = (cible?.contacts ?? []).filter(c => c[1]);
  const copier = async (valeur: string, ok: string) => {
    try { await navigator.clipboard.writeText(valeur); setInfo(ok); } catch { setInfo('La copie a échoué : sélectionnez le texte à la main.'); }
  };
  return (
    <>
      <section className="panel"><header><h2>Préparer un message</h2></header><div className="body">
        <div className="form">
          <div className="field"><label htmlFor="mcible">Destinataires</label>
            <select id="mcible" value={cle} onChange={e => { setCle(e.target.value); setInfo(''); }}>{cibles.map(c => <option key={c.cle} value={c.cle}>{c.libelle}</option>)}</select></div>
          <div className="field"><label>&nbsp;</label><span className="muted" style={{ paddingTop: 10 }}>{avecNumero.length} contact{avecNumero.length > 1 ? 's' : ''} avec numéro sur {cible?.contacts.length ?? 0}</span></div>
          <div className="field full"><label htmlFor="mtexte">Message</label>
            <textarea id="mtexte" value={texte} onChange={e => setTexte(e.target.value)} placeholder="Ex. Rappel : veillée de prière vendredi à 22 h au temple." /></div>
          <div className="field full"><div className="actions">
            <button className="btn primary" type="button" disabled={!texte.trim()} onClick={() => copier(texte.trim(), 'Message copié.')}>Copier le message</button>
            <button className="btn" type="button" disabled={!avecNumero.length} onClick={() => copier(avecNumero.map(c => c[1]).join('\n'), `${avecNumero.length} numéro${avecNumero.length > 1 ? 's' : ''} copié${avecNumero.length > 1 ? 's' : ''}.`)}>Copier les numéros</button>
            {info && <span className="muted" role="status">{info}</span>}
          </div></div>
        </div>
        <p className="muted" style={{ fontSize: 12.5, margin: '12px 0 0' }}>Copiez le message et les numéros, puis envoyez-les depuis WhatsApp Business ou votre outil SMS. L&apos;envoi automatique pourra être branché plus tard.</p>
      </div></section>
      <section className="panel"><header><h2>Contacts</h2></header>
        {avecNumero.length ? <div className="tw"><table><thead><tr><th>Nom</th><th>Numéro</th></tr></thead>
          <tbody>{avecNumero.map((c, i) => <tr key={i}><td>{c[0]}</td><td className="mono">{c[1]}</td></tr>)}</tbody></table></div>
          : <div className="empty"><b>Aucun numéro</b>Aucun contact avec numéro pour ces destinataires.</div>}
      </section>
    </>
  );
}
