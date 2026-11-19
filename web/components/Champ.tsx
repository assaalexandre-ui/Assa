// Champ de formulaire au format de l'artefact (libellé, saisie, aide).
type Base = { k: string; label: string; req?: boolean; full?: boolean; ro?: boolean; hint?: string; v?: string | number | null };
type Props = Base & ({ type?: 'text' | 'date' | 'email' | 'tel' | 'number' | 'textarea'; options?: never } | { type: 'select'; options: (string | [string, string])[] });

export function Champ({ k, label, req, full, ro, hint, v, type = 'text', options }: Props) {
  const id = 'f-' + k;
  const val = v == null ? '' : String(v);
  let input: React.ReactNode;
  if (type === 'select') {
    input = (
      <select id={id} name={k} defaultValue={val} required={req} disabled={ro}>
        <option value="">— Choisir —</option>
        {options!.map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return <option key={ov} value={ov}>{ol}</option>; })}
      </select>
    );
  } else if (type === 'textarea') {
    input = <textarea id={id} name={k} defaultValue={val} required={req} disabled={ro} />;
  } else {
    input = (
      <input id={id} name={k} type={type} defaultValue={val} required={req} disabled={ro}
        {...(type === 'tel' ? { inputMode: 'tel' as const, placeholder: '07 07 12 34 56' } : {})}
        {...(type === 'number' ? { inputMode: 'numeric' as const, min: 0, step: 1 } : {})} />
    );
  }
  return (
    <div className={'field' + (full || type === 'textarea' ? ' full' : '')}>
      <label htmlFor={id}>{label}{req ? ' *' : ''}</label>
      {input}
      {hint && <span className="muted" style={{ fontSize: 12 }}>{hint}</span>}
    </div>
  );
}
