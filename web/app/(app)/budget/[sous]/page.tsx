import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { Modal } from '@/components/Modal';
import { FicheForm } from '@/components/FicheForm';
import { BoutonAction } from '@/components/BoutonAction';
import { Empty, Kpis, LienFiche, Panel, Pill, SearchBox } from '@/components/ui';
import { requireMenu } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';
import { frDate, frMonth, money, today } from '@/lib/format';
import { statuerDepense } from '../actions';

type Ligne = { id: string; annee: number; poste: string; departement_id: string | null; montant: number };
type Depense = { id: string; date: string; objet: string; montant: number; ligne_budget_id: string | null; projet_id: string | null; demandeur: string | null; beneficiaire: string | null;
  canal: string | null; statut: string; notes: string | null; cree_par: string | null };

const somme = (l: { montant: number }[]) => l.reduce((t, x) => t + Number(x.montant), 0);
const engagee = (x: Depense) => x.statut === 'Validée' || x.statut === 'Payée';
const tonDepense = (st: string) => (st === 'Payée' ? 'g' : st === 'Refusée' ? 'n' : st === 'Validée' ? 'a' : 'w') as 'g' | 'n' | 'a' | 'w';

export default async function Budget({ params, searchParams }: { params: Promise<{ sous: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { sous } = await params;
  if (!['budget', 'depenses', 'etats'].includes(sous)) notFound();
  const sp = await searchParams;
  const s = await requireMenu('budget');
  const w = s.droits.budget === 'w';
  const supabase = await createClient();
  const [{ data: l }, { data: d }, { data: r }, { data: dep }, { data: pr }] = await Promise.all([
    supabase.from('ligne_budget').select('id, annee, poste, departement_id, montant').order('poste'),
    supabase.from('depense').select('id, date, objet, montant, ligne_budget_id, projet_id, demandeur, beneficiaire, canal, statut, notes, cree_par').order('date', { ascending: false }),
    s.droits.dons ? supabase.from('don').select('date, montant') : Promise.resolve({ data: [] }),
    supabase.from('departement').select('id, nom').order('ordre'),
    supabase.from('projet').select('id, nom').order('nom'),
  ]);
  const lignes = ((l ?? []) as Ligne[]).map(x => ({ ...x, montant: Number(x.montant) }));
  const depenses = ((d ?? []) as Depense[]).map(x => ({ ...x, montant: Number(x.montant) }));
  const recettes = ((r ?? []) as { date: string; montant: number }[]).map(x => ({ ...x, montant: Number(x.montant) }));
  const deps = (dep ?? []) as { id: string; nom: string }[], projets = (pr ?? []) as { id: string; nom: string }[];
  const auj = today(), annee = auj.slice(0, 4);
  const base = `/budget/${sous}`;
  const q = (sp.q ?? '').trim().toLowerCase();
  const poste = (id: string | null) => lignes.find(x => x.id === id)?.poste ?? '—';

  let corps: React.ReactNode;
  if (sous === 'budget') {
    const an = /^\d{4}$/.test(sp.annee ?? '') ? sp.annee! : annee;
    const list = lignes.filter(x => String(x.annee) === an);
    const prevu = somme(list), depense = somme(depenses.filter(x => engagee(x) && list.some(y => y.id === x.ligne_budget_id)));
    corps = (
      <>
        <div className="toolbar">
          <div className="actions"><Link className="btn sm" href={`${base}?annee=${Number(an) - 1}`} aria-label="Année précédente">‹</Link><b style={{ fontSize: 17, minWidth: 56, textAlign: 'center' }}>{an}</b><Link className="btn sm" href={`${base}?annee=${Number(an) + 1}`} aria-label="Année suivante">›</Link></div>
          <div className="actions">{w && <Link className="btn primary" href={`${base}?annee=${an}&fiche=nouveau`} scroll={false}>+ Nouvelle ligne</Link>}</div>
        </div>
        <Kpis items={[['Budget prévu', money(prevu)], ['Dépensé', money(depense), prevu ? Math.round(depense / prevu * 100) + ' % consommé' : ''], ['Reste', money(prevu - depense)]]} />
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Poste</th><th>Département</th><th className="num">Prévu</th><th className="num">Dépensé</th><th>Consommation</th></tr></thead>
            <tbody>{list.map(x => {
              const dp = somme(depenses.filter(y => y.ligne_budget_id === x.id && engagee(y))), p = x.montant ? Math.round(dp / x.montant * 100) : 0;
              return (
                <tr key={x.id}><td><LienFiche href={`${base}?annee=${an}&fiche=${x.id}`}>{x.poste}</LienFiche></td><td>{deps.find(y => y.id === x.departement_id)?.nom ?? '—'}</td>
                  <td className="num">{money(x.montant)}</td><td className="num" style={{ color: dp > x.montant ? 'var(--bad)' : undefined }}>{money(dp)}</td>
                  <td><div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 150 }}><span className="meter" style={{ flex: 1 }}><i style={{ width: `${Math.min(100, p)}%`, background: p > 100 ? 'var(--bad)' : undefined }} /></span><span className="mono">{p} %</span></div></td></tr>
              );
            })}</tbody></table></div>
        ) : <Empty titre="Aucune ligne de budget" texte={`Aucun budget saisi pour ${an}.`} />}</Panel>
      </>
    );
  } else if (sous === 'depenses') {
    const list = depenses.filter(x => !q || [x.objet, x.demandeur, x.beneficiaire, poste(x.ligne_budget_id)].join(' ').toLowerCase().includes(q));
    corps = (
      <>
        <Kpis items={[['Demandes à valider', depenses.filter(x => x.statut === 'Demandée').length, 'par une autre personne'], ['Validées à payer', depenses.filter(x => x.statut === 'Validée').length],
          ['Payé cette année', money(somme(depenses.filter(x => x.statut === 'Payée' && x.date.startsWith(annee))))]]} />
        <div className="toolbar"><SearchBox q={sp.q} placeholder="Rechercher une dépense" /><div className="actions">{w && <Link className="btn primary" href={`${base}?fiche=nouveau`} scroll={false}>+ Nouvelle dépense</Link>}</div></div>
        <Panel>{list.length ? (
          <div className="tw"><table><thead><tr><th>Date</th><th>Objet</th><th>Ligne</th><th>Demandeur</th><th className="num">Montant</th><th>Statut</th><th /></tr></thead>
            <tbody>{list.map(x => {
              const autre = x.cree_par !== s.userId;
              return (
                <tr key={x.id}><td><LienFiche href={`${base}?fiche=${x.id}`}>{frDate(x.date)}</LienFiche></td><td><b>{x.objet}</b></td><td>{poste(x.ligne_budget_id)}</td>
                  <td>{x.demandeur || '—'}</td><td className="num">{money(x.montant)}</td><td><Pill c={tonDepense(x.statut)}>{x.statut}</Pill></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{w && <div className="actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                    {x.statut === 'Demandée' && autre && <><BoutonAction action={statuerDepense.bind(null, x.id, 'Validée')}>Valider</BoutonAction><BoutonAction action={statuerDepense.bind(null, x.id, 'Refusée')}>Refuser</BoutonAction></>}
                    {x.statut === 'Demandée' && !autre && <span className="muted" style={{ fontSize: 12.5 }}>À valider par une autre personne</span>}
                    {x.statut === 'Validée' && <BoutonAction action={statuerDepense.bind(null, x.id, 'Payée')}>Marquer payée</BoutonAction>}
                  </div>}</td></tr>
              );
            })}</tbody></table></div>
        ) : <Empty titre="Aucune dépense" texte="Les demandes de dépense apparaîtront ici." />}</Panel>
      </>
    );
  } else {
    const rows: { k: string; rec: number; dep: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const k = `${annee}-${String(m).padStart(2, '0')}`;
      if (k > auj.slice(0, 7)) break;
      rows.push({ k, rec: somme(recettes.filter(x => x.date.startsWith(k))), dep: somme(depenses.filter(x => x.date.startsWith(k) && engagee(x))) });
    }
    const tr = rows.reduce((t, x) => t + x.rec, 0), td = rows.reduce((t, x) => t + x.dep, 0);
    const prevu = somme(lignes.filter(x => String(x.annee) === annee));
    corps = (
      <>
        {!s.droits.dons && <div className="banner info">Les recettes ne s&apos;affichent qu&apos;aux comptes qui ont accès aux dîmes et offrandes.</div>}
        <Kpis items={[['Recettes ' + annee, money(tr)], ['Dépenses ' + annee, money(td)], ['Solde', money(tr - td)], ['Budget prévu', prevu ? money(prevu) : '—', prevu ? Math.round(td / prevu * 100) + ' % consommé' : '']]} />
        <Panel titre="Recettes et dépenses par mois">
          <div className="tw"><table><thead><tr><th>Mois</th><th className="num">Recettes</th><th className="num">Dépenses</th><th className="num">Solde</th></tr></thead>
            <tbody>{[...rows].reverse().map(x => (
              <tr key={x.k}><td style={{ textTransform: 'capitalize' }}>{frMonth(x.k)}</td><td className="num">{money(x.rec)}</td><td className="num">{money(x.dep)}</td>
                <td className="num" style={{ color: x.rec - x.dep < 0 ? 'var(--bad)' : undefined }}>{money(x.rec - x.dep)}</td></tr>
            ))}</tbody></table></div>
        </Panel>
      </>
    );
  }

  let fenetre: React.ReactNode = null;
  if (sp.fiche && sous !== 'etats') {
    const nouveau = sp.fiche === 'nouveau';
    const entite = sous === 'budget' ? 'ligne_budget' : 'depense';
    const v = sous === 'budget' ? lignes.find(x => x.id === sp.fiche) : depenses.find(x => x.id === sp.fiche);
    const retour = sous === 'budget' && sp.annee ? `${base}?annee=${sp.annee}` : base;
    if ((nouveau && w) || v) {
      const valeurs = (v ? { ...v } : sous === 'budget' ? { annee: Number(sp.annee ?? annee) } : { date: auj, statut: 'Demandée' }) as Record<string, string | number | null>;
      fenetre = (
        <Modal titre={nouveau ? (sous === 'budget' ? 'Nouvelle ligne de budget' : 'Nouvelle dépense') : sous === 'budget' ? 'Ligne de budget' : 'Dépense'} retour={retour}>
          <FicheForm entite={entite} id={nouveau ? null : sp.fiche} valeurs={valeurs} ro={!w} suppression={w} retour={retour}
            dyn={{ departements: deps.map(x => [x.id, x.nom]), lignes: lignes.map(x => [x.id, `${x.annee} · ${x.poste}`]), projets: projets.map(x => [x.id, x.nom]) }} />
        </Modal>
      );
    }
  }
  return (<><PageHead id="budget" sous={sous} />{corps}{fenetre}</>);
}
