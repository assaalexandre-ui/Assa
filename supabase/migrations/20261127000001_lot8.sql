-- Lot 8 : Recommandations (règles automatiques) et Rapports (complet ou partiel, PDF).
-- Les recommandations sont calculées par l'application à partir d'un résumé chiffré fourni par la base :
-- le conseil y a accès sans pouvoir lire le fichier des fidèles. Aucun nom de fidèle ni numéro n'y figure.

alter table role_menu drop constraint role_menu_menu_check;
alter table role_menu add constraint role_menu_menu_check
  check (menu in ('accueil', 'fideles', 'bergers', 'adnh', 'admin', 'cellules', 'gc', 'agenda', 'culte',
                  'formations', 'departements', 'reunions', 'organigramme',
                  'priere', 'enfants', 'rdv', 'evenements',
                  'pilotage', 'stats', 'objectifs', 'projets',
                  'dons', 'budget', 'communication', 'patrimoine',
                  'evangelisation', 'ceremonies',
                  'reco', 'rapports'));

-- Droits repris de l'artefact.
insert into role_menu (role_code, menu, acces) values
  ('admin', 'reco', 'w'), ('admin', 'rapports', 'w'),
  ('pasteur', 'reco', 'w'), ('pasteur', 'rapports', 'w'),
  ('secretariat', 'rapports', 'r'),
  ('conseil', 'reco', 'r'), ('conseil', 'rapports', 'r'),
  ('tresorier', 'rapports', 'r')
on conflict (role_code, menu) do update set acces = excluded.acces;

-- Résumé chiffré pour les recommandations. Les noms de cellules, de tâches et de projets y figurent (pas de fidèles).
-- La partie finances n'est remplie que pour qui lit les dîmes ou le budget.
create function donnees_recommandations(p_jour date default current_date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  e uuid := mon_eglise();
  v_mois text := to_char(p_jour, 'YYYY-MM');
  v_semaine text := to_char(p_jour, 'IYYY-"W"IW');
  fin jsonb := null;
begin
  if not peut('reco', 'r') then
    perform refuser('Vous n''avez pas le droit de voir les recommandations.');
  end if;
  if peut('dons', 'r') or peut('budget', 'r') then
    select jsonb_build_object(
      'encaisseMois', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY-MM') = v_mois),
      'moyenne3Mois', (select coalesce(sum(montant), 0) / 3.0 from don where eglise_id = e
                         and date >= date_trunc('month', p_jour) - interval '3 months' and date < date_trunc('month', p_jour)),
      'encaisseAnnee', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY') = to_char(p_jour, 'YYYY')),
      'mobileAnnee', (select coalesce(sum(montant), 0) from don where eglise_id = e and to_char(date, 'YYYY') = to_char(p_jour, 'YYYY')
                        and canal in ('Orange Money', 'MTN MoMo', 'Moov Money', 'Wave')),
      'donsAnnee', (select count(*) from don where eglise_id = e and to_char(date, 'YYYY') = to_char(p_jour, 'YYYY')),
      'donsNonValides', (select count(*) from don where eglise_id = e and statut <> 'Validé'),
      'depensesEnAttente', (select count(*) from depense where eglise_id = e and statut = 'Demandée' and date <= p_jour - 7),
      'lignesDepassees', (select count(*) from ligne_budget l where l.eglise_id = e
                            and (select coalesce(sum(d.montant), 0) from depense d where d.ligne_budget_id = l.id and d.statut in ('Validée', 'Payée')) > l.montant)
    ) into fin;
  end if;
  return jsonb_build_object(
    'jour', p_jour,
    'presence', (select jsonb_build_object(
        'recents', coalesce(avg(t) filter (where rang <= 4), 0), 'nbRecents', count(*) filter (where rang <= 4),
        'precedents', coalesce(avg(t) filter (where rang between 5 and 8), 0), 'nbPrecedents', count(*) filter (where rang between 5 and 8),
        'total', count(*))
      from (select coalesce(hommes, 0) + coalesce(femmes, 0) + coalesce(enfants, 0) as t, row_number() over (order by date desc) as rang
              from comptage where eglise_id = e and date <= p_jour) c),
    'nouveaux', (select count(*) from nouveau where eglise_id = e),
    'integres', (select count(*) from nouveau where eglise_id = e and statut = 'intégré'),
    'jamaisAppeles72h', (select count(*) from nouveau n where eglise_id = e and statut <> 'intégré' and date_venue <= p_jour - 3
                           and not exists (select 1 from appel a where a.nouveau_id = n.id)),
    'injoignables', (select count(*) from nouveau n where eglise_id = e and statut <> 'intégré'
                       and (select count(*) from appel a where a.nouveau_id = n.id and a.resultat in ('Pas de réponse', 'Numéro erroné')) >= 2),
    'bergers', (select count(*) from berger where eglise_id = e),
    'relevesSemaine', (select count(*) from releve_absence where eglise_id = e and semaine = v_semaine),
    'semaine', v_semaine,
    'sansBerger', (select count(*) from fidele where eglise_id = e and berger_id is null),
    'bergersSurcharges', (select count(*) from berger b where eglise_id = e and (select count(*) from fidele f where f.berger_id = b.id) > 15),
    'cellulesSansRapport', (select coalesce(jsonb_agg(nom order by nom), '[]') from cellule c where eglise_id = e
                              and not exists (select 1 from rapport_cellule r where r.cellule_id = c.id and r.date >= p_jour - 14)),
    'departements', (select count(*) from departement where eglise_id = e),
    'departementsSansRapport', (select count(*) from departement d where eglise_id = e
                                  and not exists (select 1 from rapport_departement r where r.departement_id = d.id and r.periode = v_mois)),
    'departementsVides', (select count(*) from departement where eglise_id = e and cardinality(membres) = 0),
    'inscritsAbsents', (select count(*) from inscription_formation i join session_formation s on s.id = i.session_id
                          where s.eglise_id = e and s.date_fin >= p_jour and i.absences >= 3),
    'tachesEnRetard', (select coalesce(jsonb_agg(titre order by echeance), '[]') from tache where eglise_id = e and statut <> 'Terminée' and echeance < p_jour),
    'actionsEnRetard', (select count(*) from projet_action a join projet p on p.id = a.projet_id where p.eglise_id = e and a.statut <> 'Fait' and a.echeance < p_jour),
    'projets', (select coalesce(jsonb_agg(jsonb_build_object(
        'nom', p.nom, 'statut', p.statut, 'echeance', p.echeance, 'budget', p.budget,
        'depense', (select coalesce(sum(d.montant), 0) from depense d where d.projet_id = p.id and d.statut in ('Validée', 'Payée')),
        'actions', (select count(*) from projet_action a where a.projet_id = p.id),
        'faites', (select count(*) from projet_action a where a.projet_id = p.id and a.statut = 'Fait')) order by p.echeance), '[]')
      from projet p where p.eglise_id = e),
    'gcIncomplets', (select count(*) from gc where eglise_id = e and (tribu is null or (select count(*) from unnest(responsables) r where trim(r) <> '') < 5)),
    'articlesAReparer', (select count(*) from article where eglise_id = e and etat = 'À réparer'),
    'entretiensDepasses', (select count(*) from entretien where eglise_id = e and prochaine < p_jour),
    'objectifs', (select coalesce(jsonb_agg(jsonb_build_object(
        'libelle', libelle, 'mesure', mesure, 'cible', cible, 'valeur', valeur, 'debut', date_debut, 'fin', date_fin, 'statut', statut) order by date_fin), '[]')
      from objectif_suivi where eglise_id = e),
    'finances', fin
  );
end $$;

revoke execute on function donnees_recommandations(date) from anon, public;
grant execute on function donnees_recommandations(date) to authenticated;
