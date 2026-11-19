# Ecclesia : nomenclature des menus, modèle de données et plan de construction

*Cadrage v1 : une seule église à Abidjan, architecture extensible (assemblées, pays, ministère international). Recherche web du 31 oct. 2026. Les points non vérifiés sont signalés « (non vérifié) ».*

---

## A. Synthèse : les 10 enseignements

1. **À copier, la séparation « personne / groupe / événement / don »** : ChMeetings, Planning Center et ChurchTrac s'organisent tous autour de 5 à 6 blocs (Personnes, Groupes, Événements/Présences, Dons, Communication, Administration). Ecclesia doit suivre ce découpage, avec des libellés ivoiriens.
2. **À copier, un seul objet « groupe » typé** : cellules, GC, départements, classes de formation et conseil sont tous des groupes avec un responsable, des membres et des présences. C'est l'option la plus simple à développer et à étendre.
3. **À copier, le suivi des nouveaux de Rock RMS** (« connection requests ») : chaque nouveau a une fiche de suivi avec un **état** (actif / à relancer à une date / intégré / inactif), un **statut** paramétrable (« non contacté », « en cours »…), un **responsable de suivi** et un **journal d'actions** (appel, appel manqué, visite). C'est exactement le besoin « Intégration des nouveaux ».
4. **À copier, le portail fidèle de Church Center** : mon profil, ma cellule, mes dons, l'agenda, les inscriptions, la vidéo du culte. Il servira de base à l'app mobile.
5. **À adapter, les dons** : les logiciels américains ne gèrent que Stripe, les cartes et l'ACH. En Côte d'Ivoire, il faut Wave, Orange Money, MTN MoMo et Moov via un agrégateur (CinetPay, PayDunya, Paystack, Moneroo). Les montants sont en entiers FCFA, sans décimales.
6. **À adapter, la communication** : WhatsApp est le canal principal. Depuis le 1er oct. 2026, Meta facture aussi les messages de service au-delà de 1 000 par mois et par numéro. Le SMS (Orange SMS API, environ 7,3 FCFA/SMS) reste le canal de secours et sert pour l'OTP.
7. **À adapter, le mobile d'abord et le hors ligne partiel** : comptage des présences, accueil et pointage des cellules doivent marcher sans réseau, avec synchronisation au retour de la connexion.
8. **À éviter, la multiplication des modules payants**, comme chez ChurchSuite (modules à la carte) ou Planning Center (une app par module). Pour une église ivoirienne, il faut une seule application avec des menus qui s'affichent selon le rôle.
9. **À éviter, les doublons de libellés** : dans les notes actuelles, « Accueil » désigne à la fois un menu et un département, et « Départements spécifiques » mélange un ministère (Femmes), une œuvre (Social), un sacrement (Sainte-Cène) et la finance (Trésorerie). Il faut les séparer (voir B).
10. **À ne pas oublier, la conformité** : les données religieuses sont des **données sensibles** au sens de la loi n° 2013-450. Leur traitement exige une **autorisation préalable de l'ARTCI**, et le transfert à l'étranger n'est permis que vers un pays offrant une protection équivalente. Ce point pèse sur le choix de l'hébergement.

---

## B. Nomenclature finale recommandée

### B.1 Corrections apportées aux libellés actuels

| Libellé actuel | Problème | Correction |
|---|---|---|
| Accueil (menu : parking, orientation, dispatching) | Homonyme du département « Accueil » et de la page d'accueil de l'appli | **Jour de culte** (opérations le jour J : accueil, parking, placement, comptage). Le département « Accueil » reste une équipe dans *Départements* |
| Intégration des nouveaux | Chevauche « Accueil » (premier contact) | **Nouveaux & intégration** : tout le parcours, de la carte de visiteur à l'intégration en cellule, en GC et en classe |
| Supervision | Mélange pilotage (KPI) et annuaire (organigramme) | **Pilotage** (rapports, objectifs, KPI) d'un côté, **Organigramme & responsables** de l'autre |
| Départements spécifiques | Catégorie fourre-tout | Éclatée en trois : Femmes → *Départements* (type « ministère ») ; Social et œuvres caritatives → *Œuvres sociales* ; Sainte-Cène → *Sacrements & cérémonies* ; Budget et trésorerie → *Finances* |
| Départements de service | Libellé correct mais à généraliser | **Départements & équipes** (types : service, ministère), avec un planning des équipes de service par culte |
| GC | Sigle non expliqué pour un nouvel utilisateur | **Groupes de communion (GC)** |
| Programmation | Correct | **Agenda & programmation** |
| Réunions | Ambigu (réunion de cellule ou du conseil ?) | **Réunions du conseil** (les rencontres de cellule et de GC se gèrent dans leur groupe) |

> **À confirmer avec le client** : la différence entre *cellule* et *GC*. Les notes les distinguent (le parcours d'intégration passe par « qualification, GC et classe de formation, cellules »), mais je n'ai trouvé aucune source publique qui précise la nuance (géographique ou par affinité ?). Le modèle de données gère les deux sans changement de code.

### B.2 Arborescence (6 sections, menus filtrés selon le rôle)

Rôles abrégés (définis en D) : **PP** pasteur principal, **PA** pasteur assistant, **CO** conseil/anciens, **DI** diacre, **RD** responsable de département, **BC** berger/responsable de cellule, **RG** responsable de GC, **TR** trésorier, **SE** secrétariat, **AP** équipe accueil/protocole, **FO** formateur, **FI** fidèle, **AD** administrateur technique.

#### 1. Tableau de bord

| Menu / sous-menu | EN | Route | Accès | Objectif |
|---|---|---|---|---|
| Tableau de bord | Dashboard | `/tableau-de-bord` | Tous (contenu selon le rôle) | Voir en un coup d'œil les présences, les nouveaux, les dons, les tâches et les anniversaires de son périmètre |

#### 2. Fidèles & croissance

| Menu / sous-menu | EN | Route | Accès | Objectif |
|---|---|---|---|---|
| **Fidèles** | Members | `/fideles` | PP, PA, SE (é) ; CO, DI (l) ; BC/RG (leur groupe) | Fichier central des membres et familles |
| ↳ Liste des fidèles | Member list | `/fideles` | idem | Rechercher et filtrer (commune, cellule, statut) |
| ↳ Fiche fidèle | Member profile | `/fideles/[id]` | idem | Identité, famille, parcours spirituel, groupes |
| ↳ Familles | Households | `/fideles/familles` | PP, PA, SE | Lier conjoints et enfants |
| ↳ Anniversaires & événements de vie | Life events | `/fideles/evenements` | PP, PA, SE, BC | Naissances, mariages, deuils, anniversaires |
| **Nouveaux & intégration** | Newcomers & follow-up | `/nouveaux` | PP, PA, SE, AP (création) ; responsables de suivi | Ne perdre aucun nouveau venu |
| ↳ Enregistrer un nouveau | New visitor | `/nouveaux/nouveau` | AP, SE | Carte de visiteur (papier ou QR) saisie le jour du culte |
| ↳ Suivi (appels, visites) | Follow-up | `/nouveaux/suivi` | Responsables de suivi, PA | File des fiches à traiter : état, statut, journal d'appels |
| ↳ Qualification & orientation | Placement | `/nouveaux/orientation` | PA, SE | Affecter à une cellule, un GC et la classe 1 |
| ↳ Statistiques | Stats | `/nouveaux/statistiques` | PP, PA, CO | Taux de rétention et délai d'intégration |
| **Cellules de maison** | Home cells | `/cellules` | PP, PA (tout) ; BC (sa cellule) | Animer et suivre les cellules par commune et quartier |
| ↳ Liste & carte | List & map | `/cellules` | idem | Cellules par commune et quartier d'Abidjan |
| ↳ Ma cellule | My cell | `/cellules/[id]` | BC | Membres, rencontres, présences, rapport |
| ↳ Rapports de cellule | Cell reports | `/cellules/rapports` | BC (saisie), PA (validation) | Rapport hebdomadaire : présents, nouveaux, offrande, sujets |
| **Groupes de communion (GC)** | Fellowship groups | `/gc` | PP, PA ; RG (son GC) | Gérer les 12 GC, leurs membres et leurs rencontres |
| ↳ Les 12 GC | Groups | `/gc` | idem | Liste, responsables, effectifs |
| ↳ Fiche GC | Group page | `/gc/[id]` | RG | Membres, présences, activités |
| **Formations** | Training classes | `/formations` | PP, PA, FO | Parcours de disciples en 5 classes |
| ↳ Classes (1 à 5) | Classes | `/formations/classes` | PP, PA (paramétrage) | Rôle, durée et prérequis de chaque classe (classe 4 = leaders/bergers) |
| ↳ Sessions | Sessions | `/formations/sessions` | FO, SE | Promotion : dates de début et de fin, formateur, inscrits |
| ↳ Présences & évaluations | Attendance & grades | `/formations/sessions/[id]` | FO | Pointage, notes, validation |
| ↳ Certificats | Certificates | `/formations/certificats` | SE, PA (validation) | Attestation de fin de classe (PDF) |

#### 3. Cultes & vie de l'église

| Menu / sous-menu | EN | Route | Accès | Objectif |
|---|---|---|---|---|
| **Agenda & programmation** | Calendar & planning | `/agenda` | Tous (l) ; SE, PA (é) | Planning de toutes les activités, avec historique |
| ↳ Calendrier | Calendar | `/agenda` | Tous | Cultes, veillées, conventions, séminaires, réunions |
| ↳ Programme annuel | Yearly plan | `/agenda/programme` | PP, PA, SE | Programmation de l'année, validée par le conseil |
| ↳ Historique | History | `/agenda/historique` | PP, PA, SE | Activités passées, avec bilan |
| ↳ Salles & matériel | Rooms & equipment | `/agenda/ressources` | SE, RD Patrimoine | Réserver les lieux et éviter les conflits |
| **Jour de culte** | Service day | `/culte` | AP, SE, PA | Gérer le culte en direct |
| ↳ Ordre du culte | Order of service | `/culte/[id]/deroulement` | PA, RD Louange, RD Sono | Déroulé : louange, annonces, prédication |
| ↳ Accueil & placement | Welcome & seating | `/culte/[id]/accueil` | AP | Dispatching des fidèles, orientation, informations |
| ↳ Parking | Parking | `/culte/[id]/parking` | AP (protocole) | Places, affectation des agents, incidents |
| ↳ Comptage des présences | Headcount | `/culte/[id]/presences` | AP, SE | Hommes, femmes, enfants, nouveaux (fonctionne hors ligne) |
| ↳ Offrandes du culte | Service offering | `/culte/[id]/offrandes` | TR, DI (comptage) | Comptage espèces à double signature, plus Mobile Money |
| **Sacrements & cérémonies** | Sacraments & ceremonies | `/ceremonies` | PP, PA, SE | Registres officiels |
| ↳ Baptêmes | Baptisms | `/ceremonies/baptemes` | PP, PA, SE | Candidats, préparation, registre |
| ↳ Sainte-Cène | Holy Communion | `/ceremonies/sainte-cene` | PA, DI | Planning, équipe de service, éléments |
| ↳ Consécrations | Ordinations | `/ceremonies/consecrations` | PP, CO | Anciens, diacres, diaconesses, attestations de consécration |
| ↳ Mariages, présentations & obsèques | Weddings, dedications, funerals | `/ceremonies/autres` | PP, PA, SE | Autres registres (selon la pratique de l'église) |
| **Départements & équipes** | Departments & teams | `/departements` | PP, PA (tout) ; RD (le sien) | Faire fonctionner les départements |
| ↳ Liste des départements | Departments | `/departements` | idem | Service : protocole et sécurité, entretien, accueil, médias, sono et régie, patrimoine et gestion, personnel de service, louange. Ministère : femmes, etc. |
| ↳ Fiche département | Department page | `/departements/[id]` | RD | Membres (ouvriers), activités, besoins |
| ↳ Planning des équipes | Service rota | `/departements/planning` | RD | Qui sert à quel culte, avec rappels WhatsApp |
| ↳ Rapports départementaux | Dept. reports | `/departements/rapports` | RD (saisie) | Rapport mensuel normalisé (alimente le Pilotage) |
| **Œuvres sociales** | Social care | `/social` | PP, PA, RD Social | Aide aux fidèles et actions caritatives |
| ↳ Demandes d'aide | Help requests | `/social/demandes` | RD Social, BC (signalement) | Dossiers : maladie, deuil, naissance, besoin, avec décision |
| ↳ Actions caritatives | Outreach | `/social/actions` | RD Social | Campagnes et dons en nature |

#### 4. Gouvernance & pilotage

| Menu / sous-menu | EN | Route | Accès | Objectif |
|---|---|---|---|---|
| **Réunions du conseil** | Board meetings | `/reunions` | PP, CO, SE ; PA (l) | Garder la mémoire des décisions |
| ↳ Calendrier & ordres du jour | Agenda | `/reunions` | idem | Objets des réunions |
| ↳ Compte rendu | Minutes | `/reunions/[id]` | SE (é), PP (validation) | Faits, discussions, décisions |
| ↳ Tâches du conseil | Action items | `/reunions/taches` | PP, CO, porteurs de tâches | Suivi des tâches : responsable, échéance, statut |
| ↳ Registre des décisions | Decision log | `/reunions/decisions` | PP, CO | Recherche dans toutes les décisions passées |
| **Pilotage** | Oversight | `/pilotage` | PP, PA, CO | Suivre résultats et objectifs |
| ↳ Objectifs | Goals | `/pilotage/objectifs` | PP (é), CO (l) | Objectifs annuels par département, cellule et GC |
| ↳ Indicateurs (KPI) | KPIs | `/pilotage/indicateurs` | PP, PA, CO | Présences, nouveaux, rétention, dons, formations |
| ↳ Rapports consolidés | Consolidated reports | `/pilotage/rapports` | PP, PA, CO | Synthèse mensuelle, export PDF/Excel |
| **Organigramme & responsables** | Org chart & leaders | `/organigramme` | Tous les responsables (l) ; SE (é) | Savoir qui dirige quoi et comment le joindre |
| ↳ Organigramme | Org chart | `/organigramme` | idem | Arbre : pasteurs, directeur des programmes, départements, cellules |
| ↳ Annuaire des responsables | Leaders directory | `/organigramme/annuaire` | idem | Nom, fonction, téléphone et WhatsApp en un clic |

#### 5. Finances & communication

| Menu / sous-menu | EN | Route | Accès | Objectif |
|---|---|---|---|---|
| **Dîmes & offrandes** | Tithes & offerings | `/dons` | TR, PP ; FI (ses propres dons) | Encaisser et tracer chaque franc |
| ↳ Encaissements | Receipts | `/dons` | TR | Espèces, Mobile Money, virement, par fonds |
| ↳ Paiements Mobile Money | Mobile Money payments | `/dons/mobile-money` | TR | Transactions de l'agrégateur, rapprochement |
| ↳ Fonds & campagnes | Funds & campaigns | `/dons/fonds` | TR, PP | Dîme, offrande, construction, mission, avec engagements |
| ↳ Reçus & relevés | Receipts & statements | `/dons/releves` | TR, FI | Reçu par SMS/WhatsApp, relevé annuel |
| **Budget & trésorerie** | Budget & treasury | `/finances` | TR, PP ; CO (l) | Gérer le budget de l'église |
| ↳ Budget | Budget | `/finances/budget` | TR, PP (validation CO) | Budget annuel par département |
| ↳ Dépenses & décaissements | Expenses | `/finances/depenses` | RD (demande), TR, PP (validation) | Demande, validation, paiement, justificatif |
| ↳ Caisse & comptes | Cash & accounts | `/finances/comptes` | TR | Caisse, banque, wallets Mobile Money |
| ↳ États financiers | Reports | `/finances/etats` | TR, PP, CO | Recettes et dépenses, budget comparé au réalisé |
| **Communication** | Messaging | `/communication` | PP, PA, SE ; RD, BC, RG (leurs groupes) | Informer vite, au bon groupe |
| ↳ Nouveau message | Compose | `/communication/nouveau` | idem | WhatsApp, SMS ou notification push, avec ciblage par groupe |
| ↳ Modèles | Templates | `/communication/modeles` | SE | Modèles WhatsApp approuvés par Meta, FR/EN |
| ↳ Historique & coûts | History & costs | `/communication/historique` | SE, TR | Statut d'envoi et coût par campagne |
| ↳ Annonces | Announcements | `/communication/annonces` | SE | Fil d'actualité de l'app fidèles |

#### 6. Administration

| Menu / sous-menu | EN | Route | Accès | Objectif |
|---|---|---|---|---|
| **Paramètres** | Settings | `/parametres` | AD, PP | Configurer l'église |
| ↳ Église & sites | Church & sites | `/parametres/eglise` | AD, PP | Nom, logo, lieux de culte (structure `unite`) |
| ↳ Utilisateurs & rôles | Users & roles | `/parametres/utilisateurs` | AD, PP | Comptes, rôles, périmètres |
| ↳ Référentiels | Reference data | `/parametres/referentiels` | AD, SE | Communes, quartiers, types d'activité, statuts |
| ↳ Paiements & messagerie | Integrations | `/parametres/integrations` | AD, TR | Clés de l'agrégateur, WhatsApp, SMS |
| ↳ Journal d'audit | Audit log | `/parametres/audit` | AD, PP | Qui a fait quoi, et quand |
| ↳ Données personnelles | Privacy | `/parametres/donnees` | AD, PP | Consentements, export ou suppression sur demande |

**App mobile fidèles** (Expo, ce n'est pas un menu de l'admin) : Accueil (annonces), Agenda, Donner, Ma cellule, Mes formations, Culte en direct/replay, Mon profil. Les responsables (BC, RG, RD) y trouvent en plus « Mon groupe » : pointage hors ligne et rapport.

---

## C. Guide de développement

### C.1 Modèle de données transversal (extensible)

```sql
-- Arbre organisationnel. En v1 : 1 ligne « ministere » + 1 ligne « assemblee ».
unite(id uuid pk, parent_id uuid fk unite, type text check (type in
      ('ministere','pays','region','assemblee','site')),
      nom text, code text, chemin ltree, pays_iso char(2) default 'CI',
      fuseau text default 'Africa/Abidjan', devise char(3) default 'XOF',
      langue_defaut text default 'fr', actif bool, cree_le timestamptz)

-- Toute table métier porte unite_id. La RLS filtre sur le sous-arbre autorisé.
personne(id, unite_id, nom, prenoms, sexe, date_naissance, telephone_e164,
         whatsapp_e164, email, commune_id, quartier_id, statut
         ('visiteur','nouveau','membre','ouvrier','responsable','inactif'),
         date_conversion, date_bapteme, famille_id, photo_url,
         consentement_donnees_le, consentement_communication bool, cree_le)
famille(id, unite_id, nom, chef_famille_id)
utilisateur(id = auth.users.id, personne_id, langue, actif)   -- compte ≠ fidèle

-- Objet unique « groupe » : cellule, GC, département, classe, équipe, conseil.
groupe(id, unite_id, parent_groupe_id, type ('cellule','gc','departement',
       'ministere','classe_session','equipe','conseil'), sous_type, nom,
       commune_id, quartier_id, lieu, jour_rencontre, heure, actif)
groupe_membre(groupe_id, personne_id, role_groupe ('responsable','adjoint',
       'membre','formateur'), date_debut, date_fin)

evenement(id, unite_id, groupe_id null, type ('culte','veillee','convention',
       'seminaire','reunion_conseil','rencontre_groupe','formation','autre'),
       titre_fr, titre_en, debut, fin, lieu, statut, recurrence_rrule)
presence(id, evenement_id, personne_id null, statut ('present','absent','excuse'),
       saisi_par, saisi_le, client_uuid)                   -- client_uuid : idempotence hors ligne
comptage(id, evenement_id, hommes int, femmes int, enfants int, nouveaux int,
       saisi_par, client_uuid)

referentiel_commune(id, nom)  -- 13 communes du District + sous-préfecture Brofodoumé
referentiel_quartier(id, commune_id, nom)                  -- à saisir par l'église
fichier(id, unite_id, bucket, chemin, type, lie_a_table, lie_a_id)
journal_audit(id, unite_id, utilisateur_id, action, table_cible, cible_id,
       avant jsonb, apres jsonb, ip, le timestamptz)
```

**Règles transverses** :
- Téléphone stocké au format E.164 et validé par `^\+225(01|05|07|21|25|27)\d{8}$`. Saisie acceptée : « 07 07 12 34 56 » ou « +225… ».
- Montants en `bigint montant_xof` : entier, jamais de `numeric` à décimales, affichage « 25 000 FCFA ».
- Libellés métier bilingues en colonnes `_fr` et `_en`, ou en jsonb `libelles`.
- Suppression logique (`supprime_le`) et audit sur les tables sensibles.

### C.2 RBAC simple

```sql
role(id, code, libelle_fr, libelle_en, systeme bool)          -- rôles de D
module(code)  -- fideles, nouveaux, cellules, gc, formations, agenda, culte,
              -- ceremonies, departements, social, reunions, pilotage,
              -- organigramme, dons, finances, communication, parametres
role_permission(role_id, module_code, peut_lire bool, peut_ecrire bool,
                peut_valider bool, portee ('unite','sous_arbre','mes_groupes','moi'))
affectation_role(utilisateur_id, role_id, unite_id, groupe_id null, debut, fin)
```

- **Portée** : `mes_groupes` limite un berger à sa cellule (jointure `groupe_membre`) ; `moi` limite un fidèle à ses dons et à son profil ; `sous_arbre` prépare le multi-assemblées (un pasteur régional verra toutes les assemblées de sa région).
- **RLS Supabase** : fonction `a_permission(module, action, unite_id, groupe_id)` en `SECURITY DEFINER`, appelée dans les politiques `USING` et `WITH CHECK`. Les permissions sont mises en cache dans le JWT (custom claims) pour limiter les jointures.
- **« Valider »** : une écriture crée un brouillon et une validation change le statut. Cas d'usage : rapports, décaissements, comptes rendus, certificats.
- **Finances** : séparation des tâches. Celui qui saisit une dépense ne peut pas la valider.

### C.3 Par module : tables, back-end, écrans, priorité

Back-end : Next.js App Router (Server Actions + Route Handlers `/api/...`) pour l'admin web ; Supabase Edge Functions pour les webhooks et les tâches planifiées (pg_cron).

| # | Module | Tables principales (en plus du socle C.1) | Actions / endpoints clés | Écrans | Lot |
|---|---|---|---|---|---|
| 0 | Socle | unite, utilisateur, role*, journal_audit, referentiels | `auth.otp.envoyer`, `auth.otp.verifier` (Send SMS hook), `utilisateurs.inviter`, `roles.affecter` | Connexion OTP, paramètres, utilisateurs | MVP 1 |
| 1 | Fidèles | personne, famille, personne_etape(type: conversion, bapteme, classe_n, consecration, date) | `fideles.creer/maj/rechercher/importer_csv/fusionner_doublons` | Liste, fiche, import | MVP 1 |
| 2 | Nouveaux & intégration | suivi_nouveau(personne_id, etat, statut, responsable_id, relance_le, source), suivi_action(type: appel, appel_manque, whatsapp, visite ; note ; le) | `nouveaux.enregistrer` (formulaire public QR), `suivi.attribuer`, `suivi.journaliser`, `suivi.orienter(groupe_ids)` | Formulaire visiteur, file de suivi (kanban), fiche | MVP 1 |
| 3 | Cellules & GC | groupe, groupe_membre, rapport_groupe(groupe_id, evenement_id, presents, nouveaux, offrande_xof, sujets, statut) | `groupes.crud`, `rencontre.pointer` (hors ligne), `rapport.soumettre/valider` | Liste et carte, ma cellule, rapport | MVP 1 |
| 4 | Agenda & jour de culte | evenement, presence, comptage, ordre_culte(evenement_id, ordre, element, responsable_id), poste_accueil(evenement_id, zone, agent_id), incident | `evenements.crud`, `comptage.saisir` (hors ligne), `accueil.affecter` | Calendrier, écran tablette de comptage, accueil/parking | MVP 1 |
| 5 | Dîmes & offrandes | fonds, don(personne_id null, fonds_id, montant_xof, canal: especes, wave, orange_money, mtn_momo, moov_money, virement ; statut ; ref_externe ; evenement_id), transaction_paiement(fournisseur, payload jsonb, statut, signature_ok), recu | `dons.initier_paiement` → URL de l'agrégateur ; `POST /api/webhooks/paiement` (signature vérifiée côté serveur puis re-vérification du statut auprès de l'agrégateur) ; `dons.saisir_especes` (double comptage) ; `recus.envoyer` | Encaissements, rapprochement, page « Donner » | MVP 2 |
| 6 | Communication | message_modele(canal, code, langue, statut_meta), campagne(cible jsonb, canal, statut, cout_estime_xof), message_envoi(personne_id, canal, statut, ref_fournisseur, cout_xof) | `campagnes.cibler/estimer/envoyer` (file pg_cron), `POST /api/webhooks/whatsapp` (statuts et messages entrants), opt-out | Composer, modèles, historique | MVP 2 |
| 7 | Formations | classe(numero 1–5, nom, role, duree_semaines, prerequis), groupe type=classe_session, evaluation(session_id, personne_id, note, valide), certificat | `sessions.ouvrir`, `inscrire`, `pointer`, `certifier` (PDF) | Classes, sessions, pointage, certificats | Lot 3 |
| 8 | Départements & planning | groupe type=departement, creneau_service(evenement_id, groupe_id, poste, personne_id, confirme), rapport_departement(periode, indicateurs jsonb, statut) | `planning.generer/notifier/confirmer`, `rapports.soumettre/valider` | Liste, fiche, planning, rapports | Lot 3 |
| 9 | Réunions du conseil | reunion(evenement_id, ordre_du_jour), point_ordre_jour, decision(reunion_id, texte, vote), tache(origine_reunion_id, responsable_id, echeance, statut) | `reunions.crud`, `cr.valider`, `taches.relancer` (rappel WhatsApp J-2) | Réunions, compte rendu, tâches, registre | Lot 3 |
| 10 | Pilotage & organigramme | objectif(unite/groupe, indicateur, cible, periode), vues SQL `v_kpi_*` (matérialisées, rafraîchies la nuit) | `kpi.calculer`, `rapports.exporter(pdf/xlsx)` | Tableaux KPI, objectifs, organigramme (arbre) | Lot 4 |
| 11 | Budget & trésorerie | compte(type: caisse, banque, wallet), budget_ligne(departement_id, annee, montant_xof), depense(demandeur, montant_xof, statut, justificatif_id), ecriture(compte_id, sens, montant_xof, source) | `depenses.demander/valider/payer`, `etats.generer` | Budget, dépenses, comptes, états | Lot 4 |
| 12 | Sacrements & social | ceremonie(type, date, officiant_id), ceremonie_participant, demande_aide(personne_id, type, montant_xof, decision) | `registres.crud`, `attestation.pdf`, `aides.decider` | Registres, dossiers d'aide | Lot 4 |
| 13 | App fidèles (Expo) | réutilise tout ; device_push(token) | Supabase JS + RLS `portee=moi` ; Expo Notifications | Accueil, agenda, donner, ma cellule, profil | Lot 5 |

**Ordre de construction** : socle → fidèles → nouveaux → cellules/GC → culte et présences (**MVP 1**, utilisable dès le premier dimanche) → dons Mobile Money + WhatsApp/SMS (**MVP 2**) → formations, départements, conseil → pilotage, finances, sacrements → app Expo. Avant l'app native, l'admin web est livré en **PWA installable** : il couvre le mobile tout de suite.

---

## D. Rôles adaptés à une église ivoirienne

| Code | Rôle (FR / EN) | Portée par défaut | Droits principaux |
|---|---|---|---|
| AD | Administrateur technique / *System admin* | unité | Paramètres, utilisateurs, intégrations (aucun accès aux montants individuels par défaut) |
| PP | Pasteur principal / *Senior pastor* | sous-arbre | Lecture de tout ; validation des décisions, budget et consécrations |
| PA | Pasteur assistant / *Associate pastor* | unité (ou pôle confié) | Écriture sur fidèles, nouveaux, cellules, GC, culte ; validation des rapports |
| CO | Ancien / membre du conseil / *Elder, board member* | unité | Réunions (é), pilotage et finances (l) |
| DI | Diacre, diaconesse / *Deacon, deaconess* | unité | Culte (offrandes, Sainte-Cène), social (l/é selon affectation) |
| DP | Directeur des programmes / *Programs director* | unité | Agenda (é), départements (l), pilotage (l) |
| RD | Responsable de département / *Department head* | mes_groupes | Son département : membres, planning, rapports, demandes de dépense |
| BC | Berger / responsable de cellule / *Cell leader* | mes_groupes | Sa cellule : membres, pointage, rapport, signalement social |
| RG | Responsable de GC / *Fellowship group leader* | mes_groupes | Son GC : membres, pointage, rapport |
| TR | Trésorier / *Treasurer* | unité | Dons, budget, dépenses, états (é) ; ne valide pas ses propres saisies |
| SE | Secrétariat / *Church office* | unité | Fidèles, agenda, comptes rendus, communication (é) |
| AP | Équipe accueil & protocole / *Ushers & protocol* | unité, jour de culte | Accueil, parking, comptage, enregistrement des nouveaux |
| SU | Chargé de suivi des nouveaux / *Follow-up worker* | fiches attribuées | Journal d'appels, orientation proposée |
| FO | Formateur / *Instructor* | mes_groupes (sessions) | Pointage, évaluations |
| FI | Fidèle / *Member* | moi | Profil, dons, agenda, inscriptions, sa cellule (l) |

*Vocabulaire confirmé par les sources (section F)* : pasteur (stagiaire, proposant, titulaire), ordination ou consécration, attestation de consécration, anciens, diacres, diaconesses, conseil apostolique, pasteur régional, communauté locale, assemblée, temple, région ecclésiastique, départements (jeunesse, action missionnaire, œuvres sociales…), culte de semaine (mardi/jeudi) et culte dominical, convention, école biblique.
*Non confirmé par les sources consultées* : « berger », « ouvrier », « veillée », « cellule de maison » et « GC » n'apparaissent pas dans les pages lues. Ils viennent des notes du client, et un usage local courant est probable mais non vérifié. Tous les libellés de rôles et de groupes doivent donc rester **paramétrables**.

---

## E. Déploiement : points d'attention et estimation

| Sujet | Recommandation | Coûts et faits vérifiés |
|---|---|---|
| Hébergement | Supabase **Pro** (sans mise en veille), Next.js sur Vercel ou un VPS (Docker) | Supabase Free : mise en veille après 1 semaine d'inactivité, pas de sauvegarde. Pro : dès 25 $/mois, sauvegardes quotidiennes conservées 7 jours, PITR à 100 $/mois. Prix Vercel non vérifié |
| Localisation des données | Les données religieuses sont sensibles : il faut l'**autorisation préalable de l'ARTCI**, et un transfert hors de Côte d'Ivoire n'est permis que vers un pays à protection équivalente. Déposer le dossier ARTCI avant la mise en production, ou prévoir un hébergement local (VPS en CI + Postgres auto-hébergé) | Régions Supabase non vérifiées. Je n'ai pas trouvé de mention d'une exception pour les associations religieuses |
| Sauvegardes | Sauvegarde quotidienne Supabase + `pg_dump` chiffré chaque nuit vers un second stockage, avec test de restauration mensuel | — |
| Hors ligne | PWA : service worker + file IndexedDB pour comptage, pointage et enregistrement des nouveaux, avec `client_uuid` pour l'idempotence. Expo : SQLite local + synchronisation (outils à évaluer : PowerSync, WatermelonDB, non testés ici) | Hypothèse : usage majoritairement mobile, réseau instable |
| OTP téléphone | Connexion par numéro +225 et OTP. Le **Send SMS hook** de Supabase permet un fournisseur local ou WhatsApp. En natif, WhatsApp OTP n'existe qu'avec Twilio | OTP : 1 demande/60 s, expiration 1 h par défaut |
| SMS | Orange SMS API CI, à acheter en paquets | 1 000 SMS = 7 260 FCFA ; 10 000 = 72 600 FCFA (paiement par crédit ou Orange Money) |
| WhatsApp | WhatsApp Business Platform (Cloud API) : modèles approuvés, opt-in obligatoire, numéro dédié à l'église | Facturation par message livré. La CI est dans la zone « Rest of Africa ». Depuis le 1er oct. 2026, les messages de service sont payants au-delà de 1 000/mois. Les organismes à but non lucratif éligibles en restent exemptés jusqu'au 31 déc. 2027 : vérifier l'éligibilité de l'église |
| Mobile Money | Passer par un agrégateur plutôt que 4 intégrations directes. Webhook signé, vérifié côté serveur, puis contrôle du statut. Ne jamais se fier à la redirection côté client | CinetPay : Wave, Orange, MTN, Moov et cartes, commission 1,5 à 2 % selon Kolonell (source commerciale). PayDunya SoftPay CI : Orange, MTN, Moov, Wave, Djamo. Moneroo : `orange_ci`, `mtn_ci`, `moov_ci`, `wave_ci`. Paystack CI : Orange, MTN, Moov et cartes (Wave non cité). Dons récurrents natifs : seulement Orange et MTN, selon Kolonell |
| Préfixes | 01 Moov, 05 MTN, 07 Orange (mobiles) ; 21/25/27 (fixes). Faire **choisir l'opérateur** au paiement plutôt que le déduire du préfixe (portabilité non vérifiée) | Passage à 10 chiffres le 31 janv. 2021 |
| Sécurité | RLS sur toutes les tables, audit, 2FA pour TR, PP et AD, chiffrement des notes pastorales, consentement à l'inscription | — |

**Estimation MVP** (1 développeur full-stack senior, à temps plein ; c'est une estimation, pas une mesure) :

| Lot | Contenu | Durée |
|---|---|---|
| MVP 1 | Socle, OTP, RBAC/RLS, fidèles, nouveaux, cellules et GC, agenda, jour de culte (PWA hors ligne) | **6 à 7 semaines** |
| MVP 2 | Dîmes Mobile Money (1 agrégateur), reçus, WhatsApp et SMS | **3 à 4 semaines** |
| Lot 3 | Formations, départements et planning, réunions du conseil | 4 semaines |
| Lot 4 | Pilotage KPI, budget et trésorerie, sacrements, social | 4 semaines |
| Lot 5 | App Expo fidèles (stores) | 4 à 5 semaines |

**MVP exploitable (MVP 1 + 2) : environ 10 semaines**, plus 1 à 2 semaines de recette avec l'église (import des fidèles, formation des secrétaires et des bergers). **Version complète : environ 22 à 25 semaines.**

---

## F. Sources consultées

**Logiciels de gestion d'église**
- ChMeetings, fonctionnalités : https://chmeetings.com/all-features
- Planning Center, applications : https://www.planningcenter.com/apps
- Planning Center, Church Center : https://planningcenter.com/church-center
- Rock RMS, Connections : https://community.rockrms.com/Rock/BookContent/30
- ChurchSuite (fiche fonctionnalités) : https://www.techjockey.com/us/detail/churchsuite
- ChurchTrac, fonctionnalités : https://www.churchtrac.com/features
- Elvanto et Breeze (Tithely) : https://help.tithe.ly/hc/en-us/articles/21499945346839-Comparison-Chart-for-Elvanto-ChMS-and-Breeze-ChMS-Features
- Logiciels américains et Afrique : https://churchmemberpro.pages.dev/blog/why-us-church-software-doesnt-work-for-african-churches
- Ekklesia CMS (open source, Afrique francophone) : https://kwasiezor.github.io/ekklesia-cms/
- Alternatives (Appvizer FR) : https://www.appvizer.fr/organisations/eglises/church-affairs/alternatives

**Églises en Côte d'Ivoire**
- MEI-CI, 54 pasteurs reconnus (AIP) : https://www.aip.ci/cote-divoire-aip-54-nouveaux-pasteurs-de-leglise-mission-evangelique-internationale-recoivent-la-reconnaissance-du-bureau-national/
- EERI-CI, consécration d'anciens, diacres et diaconesses (AIP) : https://www.aip.ci/cote-divoire-aip-plus-de-200-dignitaires-consacres-a-leglise-de-reveil-international-dabidjan-nord/?amp=1
- EEADCI (Assemblées de Dieu CI), organisation et horaires : https://erooamba.com/posts/assemblees-de-dieu-cote-ivoire-eeadci-assemblees-horaires-2026
- UNEBAM-CI (Wikipédia) : https://en.wikipedia.org/wiki/Union_of_Missionary_Baptist_Churches_in_Ivory_Coast
- S. K. Dossou, « Le christianisme en Côte d'Ivoire » (Globethics) : https://repository.globethics.net/server/api/core/bitstreams/f971f9e9-fb54-49f9-9472-35ae515fb674/content
- CMCI/CMFI (site de Bertoua, Cameroun) : https://cmcibertoua.lovable.app/en/a-propos
- Non trouvé : aucune source exploitable sur l'organisation interne de la CMCI en CI ni de l'Église Protestante Baptiste Œuvres et Mission (cellules, départements).

**Réalités ivoiriennes**
- Mobile Money et dons religieux (Ecofin, chiffres ARTCI) : https://www.ecofinagency.com/news-digital/0403-53443-ramadan-and-lent-go-digital-in-cote-d-ivoire-as-mobile-money-facilitates-transfers-and-payments
- Passerelles de paiement CI 2026 (Kolonell) : https://kolonell.com/en/blog/payment-gateway-cote-divoire-wave-orange-mtn-2026
- PayDunya SoftPay : https://developers.paydunya.com/doc/EN/api_softpay_index
- Moneroo, méthodes : https://docs.moneroo.io/fr/payments/methodes-disponibles
- Paystack CI : https://mctaba.com/learn/paystack/payment-methods-available-on-paystack-in-cote-d-ivoire
- CinetPay docs : https://docs.cinetpay.com/api/1.0-fr/checkout/tableau (accès refusé par robots.txt, non lu)
- Numérotation à 10 chiffres (Fratmat) : https://www.fratmat.info/article/210755/economie/telephonie-mobilebasculement-a-10-chiffres-les-precisions-de-lartci
- Communes du District d'Abidjan : https://economie-ivoirienne.ci/pole-competitif/district-autonome-dabidjan.html
- Loi 2013-450 et ARTCI (Cio Mag) : https://cio-mag.com/cote-divoire-artci-le-traitement-des-donnees-personnelles-desormais-soumis-a-une-autorisation-prealable
- Loi 2013-450, fiche (données sensibles, transferts) : https://dataprotection.africa/?p=3968
- Orange SMS API CI, tarifs : https://developer.orange.com/apis/sms-ci/pricing
- WhatsApp Business Platform, tarification : https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing.md

**Stack**
- Supabase, tarifs : https://supabase.com/pricing
- Supabase, Phone Login : https://supabase.com/docs/guides/auth/phone-login.md
- Supabase, Send SMS hook : https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
