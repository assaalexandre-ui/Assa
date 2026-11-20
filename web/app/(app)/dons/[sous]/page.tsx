import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { BoutonAction } from '@/components/BoutonAction';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, fullName, money, today } from '@/lib/format';
import { MOBILE_MONEY } from '@/lib/entites';
import { validerDon } from '../actions';

type Fonds = { id: string; nom: string; type: string; objectif: number | null; fin: string | null; description: string | null };
type Don = { id: string; date: string; fonds_id: string; montant: number; canal: string; fidele_id: string | null; reference: string | null; statut: string; notes: string | null; cree_par: string | null };

const somme = (l: { montant: number }[]) => l.reduce((t, x) => t + Number(x.montant), 0);

export default async function Dons({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['encaissements', 'fonds', 'releve'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('dons');
  const w = s.droits.dons === 'w';
  const supabase = await createClient();
  const [{ data: f }, { data: d }, { data: fi }] = await Promise.all([
    supabase.from('fonds').select('id, nom, type, objectif, fin, description').order('nom'),
    supabase.from('don').select('id, date, fonds_id, montant, canal, fidele_id, reference, statut, notes, cree_par').order('date', { ascending: false }),
    supabase.from('fidele').select('id, nom, prenoms').order('nom'),
  ]);
  const fonds = (f ?? []) as Fonds[], dons = ((d ?? []) as Don[]).map(x => ({ ...x, montant: Number(x.montant) }));
  const fideles = (fi ?? []) as { id: string; nom: string; prenoms: string | null }[];
  const nomFonds = (id: string) => fonds.find(x => x.id === id)?.nom ?? '—';
  const nomFidele = (id: string | null) => (id ? fullName(fideles.find(x => x.id === id)) : 'Collecte');
  const auj = today(), mois = auj.slice(0, 7), annee = auj.slice(0, 4);
  const base = `/dons/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();

  let corps: React.ReactNode;
  if (sous === 'encaissements') {
    const duMois = dons.filter(x => x.date.startsWith(mois)), tot = somme(duMois);
    const mm = somme(duMois.filter(x => MOBILE_MONEY.includes(x.canal)));
    const list = dons.filter(x => !q || [nomFonds(x.fonds_id), nomFidele(x.fidele_id), x.canal, x.reference].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <Kpis items={[['Ce mois', money(tot)], ['Dont Mobile Money', tot ? Math.round(mm / tot * 100) + ' %' : '—'],
          ['Depuis janvier', money(somme(dons.filter(x => x.date.startsWith(annee))))], ['À valider', dons.filter(x => x.statut !== 'Validé').length, 'par une autre personne']]} />
        {!fonds.length && <div className="banner info">Créez d&apos;abord les fonds (dîme, offrande, construction…) dans « Fonds et campagnes ».</div>}
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher un fonds, un fidèle, une référence" /><div className="actions">{w && fonds.length > 0 && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Saisir un encaissement</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Fonds</th><th>Donateur</th><th>Moyen</th><th className="num">Montant</th><th>Statut</th><th /></tr></thead>
            <tbody>{list.map(x => (
              <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frDate(x.date)}</LienFiche></td><td>{nomFonds(x.fonds_id)}</td><td>{nomFidele(x.fidele_id)}</td>
                <td><Pill c="n">{x.canal}</Pill></td><td className="num"><b>{money(x.montant)}</b></td>
                <td><Pill c={x.statut === 'Validé' ? 'g' : 'w'}>{x.statut}</Pill></td>
                <td style={{ textAlign: 'right' }}>{w && x.statut !== 'Validé' && x.cree_par !== s.userId && <BoutonAction action={validerDon.bind(null, x.id)}>Valider</BoutonAction>}</td></tr>
            ))}</tbody></table></div>
        ) : <Empty titre="Aucun encaissement" texte="Les dîmes, offrandes et dons saisis apparaîtront ici." />}</Panel>
      </>
    );
  } else if (sous === 'fonds') {
    corps = (
      <>
        <div className="toolbar"><span /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouveau fonds</Link>}</div></div>
        <Panel>{fonds.length ? (
          <div className="tw"><table><thead><tr><th>Fonds</th><th>Type</th><th className="num">Collecté</th><th>Objectif</th></tr></thead>
            <tbody>{fonds.map(x => {
              const c = somme(dons.filter(y => y.fonds_id === x.id)), p = x.objectif ? Math.min(100, Math.round(c / Number(x.objectif) * 100)) : 0;
              return (
                <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{x.nom}</LienFiche></td><td><Pill c={x.type === 'Campagne' ? 'a' : 'n'}>{x.type}</Pill></td>
                  <td className="num">{money(c)}</td>
                  <td>{x.objectif ? <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 200 }}><span className="meter" style={{ flex: 1 }}><i className={p >= 100 ? 'full' : ''} style={{ width: `${p}%` }} /></span><span className="mono">{p} % de {money(x.objectif)}</span></div> : '—'}</td></tr>
              );
            })}</tbody></table></div>
        ) : <Empty titre="Aucun fonds" texte="Créez les fonds permanents (dîme, offrande) et les campagnes (construction…)." />}</Panel>
      </>
    );
  } else {
    const fid = fideles.find(x => x.id === sp.fidele);
    const list = fid ? dons.filter(x => x.fidele_id === fid.id) : [];
    corps = (
      <>
        <form className="toolbar" action="">
          <div className="actions"><label htmlFor="rfid" className="muted" style={{ fontWeight: 600, fontSize: 12.5 }}>Fidèle</label>
            <select className="sel" id="rfid" name="fidele" defaultValue={sp.fidele ?? ''}><option value="">— Choisir un fidèle —</option>{fideles.map(x => <option key={x.id} value={x.id}>{fullName(x)}</option>)}</select>
            <button className="btn sm" type="submit">Afficher</button></div>
        </form>
        {fid ? (
          <>
            <Kpis items={[['Total donné', money(somme(list))], ['Cette année', money(somme(list.filter(x => x.date.startsWith(annee))))], ['Nombre de dons', list.length]]} />
            <Panel titre={`Relevé de ${fullName(fid)}`}>{list.length ? (
              <div className="tw"><table><thead><tr><th>Date</th><th>Fonds</th><th>Moyen</th><th className="num">Montant</th></tr></thead>
                <tbody>{list.map(x => <tr key={x.id}><td>{frDate(x.date)}</td><td>{nomFonds(x.fonds_id)}</td><td>{x.canal}</td><td className="num">{money(x.montant)}</td></tr>)}</tbody></table></div>
            ) : <Empty titre="Aucun don enregistré" texte="Aucun encaissement n'est rattaché à ce fidèle." />}</Panel>
          </>
        ) : <Panel><Empty titre="Choisissez un fidèle" texte="Le relevé liste tous ses dons enregistrés." /></Panel>}
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche && sous !== 'releve') {
    const nouveau = sp.fiche === 'nouveau';
    const entite = sous === 'fonds' ? 'fonds' : 'don';
    const v = sous === 'fonds' ? fonds.find(x => x.id === sp.fiche) : dons.find(x => x.id === sp.fiche);
    if ((nouveau && w) || v) {
      const valeurs = (v ? { ...v } : sous === 'fonds' ? { type: 'Fonds permanent' } : { date: auj, canal: 'Espèces', statut: 'Saisi' }) as Record<string, string | number | null>;
      fenetre = (
        <Modal titre={nouveau ? (sous === 'fonds' ? 'Nouveau fonds' : 'Saisir un encaissement') : sous === 'fonds' ? 'Fonds ou campagne' : 'Encaissement'} retour={base}>
          <FicheForm entite={entite} id={nouveau ? null : sp.fiche} valeurs={valeurs} ro={!w} suppression={w} retour={base}
            dyn={{ fonds: fonds.map(x => [x.id, x.nom]), fideles: fideles.map(x => [x.id, fullName(x)]) }} />
        </Modal>
      );
    }
  }
  return (<><PageHead id="dons" sous={sous} />{corps}{fenetre}</>);
}
