import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FideleForm } from '@/components/FideleForm';
import { Empty, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { chargerRefs, libelle } from '@/lib/ref';
import { COLONNES_FIDELE, peutModifierFidele, refsFormulaire } from '@/lib/fideles';
import { frDate, fullName, today } from '@/lib/format';

type Fidele = { id: string; nom: string; prenoms: string | null; telephone: string | null; commune: string | null; quartier: string | null; statut: string; berger_id: string | null; cellule_id: string | null; gc_id: string | null; classe: number | null; date_naissance: string | null } & Record<string, string | number | null>;

export default async function Fideles({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['liste', 'anniversaires'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('fideles');
  const supabase = await createClient();
  const [{ data }, refs] = await Promise.all([supabase.from('fidele').select(COLONNES_FIDELE).order('nom').order('prenoms'), chargerRefs()]);
  const tous = (data ?? []) as Fidele[];
  const ecrit = s.droits.fideles === 'w';
  const base = `/fideles/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const avecQ = (extra: string) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), ...Object.fromEntries(new URLSearchParams(extra)) })}`;
  const retour = q ? `${base}?q=${encodeURIComponent(q)}` : base;

  let corps: React.ReactNode;
  if (sous === 'liste') {
    const rows = tous.filter(f => !q || [fullName(f), f.telephone, f.commune, f.quartier].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <div className="toolbar">
          <SearchBox q={sp.q} placeholder="Rechercher" />
          <div className="actions">{ecrit && <a className="btn primary" href={avecQ('fiche=nouveau')}>+ Nouveau fidèle</a>}</div>
        </div>
        <Panel>
          {rows.length ? (
            <div className="tw"><table>
              <thead><tr><th>Nom et prénoms</th><th>Contact</th><th>Commune</th><th>Berger</th><th>Cellule</th><th>GC</th><th>Classe</th><th>Statut</th></tr></thead>
              <tbody>{rows.map(f => (
                <tr key={f.id}>
                  <td><LienFiche href={avecQ('fiche=' + f.id)}>{fullName(f)}</LienFiche></td>
                  <td className="mono">{f.telephone || '—'}</td>
                  <td>{[f.commune, f.quartier].filter(Boolean).join(', ') || '—'}</td>
                  <td>{f.berger_id ? refs.noms[f.berger_id] ?? '—' : '—'}</td>
                  <td>{f.cellule_id ? refs.noms[f.cellule_id] ?? '—' : '—'}</td>
                  <td>{libelle(refs.gc, f.gc_id).split(' · ')[0]}</td>
                  <td>{f.classe ? 'Classe ' + f.classe : '—'}</td>
                  <td><Pill c={f.statut === 'Inactif' ? 'n' : f.statut === 'Nouveau' ? 'w' : 'a'}>{f.statut}</Pill></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <Empty titre={q ? 'Aucun résultat' : "Rien d'enregistré pour le moment"} texte={q ? 'Essayez un autre mot.' : ecrit ? 'Utilisez « + Nouveau fidèle » pour commencer.' : 'Les fiches apparaîtront ici.'} />}
        </Panel>
      </>
    );
  } else {
    const m = today().slice(5, 7);
    const mois = new Date().toLocaleDateString('fr-FR', { month: 'long' });
    const list = tous.filter(f => (f.date_naissance || '').slice(5, 7) === m).sort((a, b) => a.date_naissance!.slice(8).localeCompare(b.date_naissance!.slice(8)));
    corps = (
      <Panel titre={`Anniversaires de ${mois}`} droite={<span className="muted">{list.length}</span>}>
        {list.length ? (
          <div className="tw"><table>
            <thead><tr><th>Jour</th><th>Fidèle</th><th>Contact</th><th>Né(e) le</th></tr></thead>
            <tbody>{list.map(f => (
              <tr key={f.id}>
                <td>{Number(f.date_naissance!.slice(8))} {mois}{f.date_naissance!.slice(5) === today().slice(5) && <> <Pill c="a">Aujourd&apos;hui</Pill></>}</td>
                <td><LienFiche href={avecQ('fiche=' + f.id)}>{fullName(f)}</LienFiche></td>
                <td className="mono">{f.telephone || '—'}</td>
                <td>{frDate(f.date_naissance)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Empty titre="Aucun anniversaire ce mois-ci" texte="Renseignez la date de naissance dans la fiche des fidèles." />}
      </Panel>
    );
  }

  const ficheId = sp.fiche;
  const fiche = ficheId && ficheId !== 'nouveau' ? tous.find(f => f.id === ficheId) ?? null : null;
  const ouvrir = ficheId === 'nouveau' ? ecrit : !!fiche;
  const modifiable = ficheId === 'nouveau' ? ecrit : peutModifierFidele(s, fiche);
  return (
    <>
      <PageHead id="fideles" sous={sous} />
      {corps}
      {ouvrir && (
        <Modal titre={fiche ? fullName(fiche) : 'Nouveau fidèle'} retour={retour}>
          <FideleForm fiche={fiche} refs={refsFormulaire(refs)} ro={!modifiable} choixBerger={ecrit && s.profil.role_code !== 'berger'} suppression={ecrit} retour={retour} />
        </Modal>
      )}
    </>
  );
}
