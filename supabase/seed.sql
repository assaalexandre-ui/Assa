-- Données FICTIVES de test, générées par scripts/seed.mjs. Ne pas y saisir de vraies personnes.

insert into berger (id, eglise_id, nom, prenoms, contact) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Koffi', 'Jean-Marc', '+225 07 00 00 00 01'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Yao', 'Christelle', '+225 07 00 00 00 02'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Ismaël', '+225 07 00 00 00 03'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'N''Guessan', 'Ruth', '+225 07 00 00 00 04');

insert into fidele (id, eglise_id, nom, prenoms, sexe, date_naissance, telephone, commune, quartier, statut, berger_id, gc_id, classe, notes, origine) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Esther', 'Femme', '1977-04-26', '+225 07 00 00 00 05', 'Plateau', 'Akouédo', 'Responsable', '10000000-0000-0000-0000-000000000001', 'gc09', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Assi', 'Ismaël', 'Homme', '1976-05-09', '+225 07 00 00 00 06', 'Bingerville', 'Riviera', 'Responsable', '10000000-0000-0000-0000-000000000001', 'gc02', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Koffi', 'Franck', 'Homme', '1984-10-07', '+225 07 00 00 00 07', 'Koumassi', 'Akouédo', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc08', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Aka', 'Nadège', 'Femme', '1964-07-09', '+225 07 00 00 00 08', 'Adjamé', 'Zone 4', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc11', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Kouassi', 'Prisca', 'Femme', '1995-06-20', '+225 07 00 00 00 09', 'Marcory', 'Zone 4', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc09', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Assi', 'Franck', 'Homme', '2001-11-02', '+225 07 00 00 00 10', 'Cocody', 'Akouédo', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc02', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Ehouman', 'Arnaud', 'Homme', '1995-02-03', '+225 07 00 00 00 11', 'Abobo', 'Sogefiha', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc10', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Christelle', 'Femme', '1995-11-19', '+225 07 00 00 00 12', 'Abobo', 'Zone 4', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc01', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Konan', 'Ruth', 'Femme', '2005-06-04', '+225 07 00 00 00 13', 'Abobo', 'Zone 4', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc07', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Touré', 'Franck', 'Homme', '1967-01-19', '+225 07 00 00 00 14', 'Bingerville', 'Angré', 'Ouvrier', '10000000-0000-0000-0000-000000000001', 'gc03', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Mariam', 'Femme', '1978-02-02', '+225 07 00 00 00 15', 'Koumassi', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc04', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Konan', 'Grâce', 'Femme', '2006-02-23', '+225 07 00 00 00 16', 'Adjamé', 'Angré', 'Membre', '10000000-0000-0000-0000-000000000001', 'gc10', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Diomandé', 'Prisca', 'Femme', '1981-02-28', '+225 07 00 00 00 17', 'Abobo', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc03', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Gnagne', 'Christelle', 'Femme', '1969-01-26', '+225 07 00 00 00 18', 'Abobo', 'Belleville', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc04', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Mariam', 'Femme', '1961-04-13', '+225 07 00 00 00 19', 'Koumassi', 'Akouédo', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc06', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Ismaël', 'Homme', '2006-12-18', '+225 07 00 00 00 20', 'Yopougon', 'Abobo-Gare', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc07', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Assi', 'Christelle', 'Femme', '1982-06-07', '+225 07 00 00 00 21', 'Port-Bouët', 'Williamsville', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc07', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'Coulibaly', 'Patricia', 'Femme', '1962-12-10', '+225 07 00 00 00 22', 'Plateau', 'Akouédo', 'Ouvrier', '10000000-0000-0000-0000-000000000002', 'gc03', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'Coulibaly', 'Patricia', 'Femme', '1966-06-19', '+225 07 00 00 00 23', 'Cocody', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc04', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Touré', 'Serge', 'Homme', '1968-12-03', '+225 07 00 00 00 24', 'Plateau', 'Sogefiha', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc08', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Yao', 'Christelle', 'Femme', '1964-11-14', '+225 07 00 00 00 25', 'Treichville', 'Niangon', 'Responsable', '10000000-0000-0000-0000-000000000002', 'gc11', 3, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Ehouman', 'Aïcha', 'Femme', '2006-05-05', '+225 07 00 00 00 26', 'Treichville', 'Zone 4', 'Membre', '10000000-0000-0000-0000-000000000002', 'gc01', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Kouassi', 'Serge', 'Homme', '1968-02-27', '+225 07 00 00 00 27', 'Cocody', 'Williamsville', 'Responsable', '10000000-0000-0000-0000-000000000003', 'gc01', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'Brou', 'Franck', 'Homme', '1968-02-26', '+225 07 00 00 00 28', 'Bingerville', 'Belleville', 'Responsable', '10000000-0000-0000-0000-000000000003', 'gc09', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'Assi', 'Aïcha', 'Femme', '1989-11-15', '+225 07 00 00 00 29', 'Marcory', 'Williamsville', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc06', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'Ehouman', 'Esther', 'Femme', '2007-06-08', '+225 07 00 00 00 30', 'Yopougon', 'Akouédo', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc04', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'Diomandé', 'Prisca', 'Femme', '1977-08-21', '+225 07 00 00 00 31', 'Abobo', 'Sogefiha', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc09', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'N''Guessan', 'Hervé', 'Homme', '1995-08-07', '+225 07 00 00 00 32', 'Marcory', 'Vridi', 'Membre', '10000000-0000-0000-0000-000000000003', 'gc03', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'Gnagne', 'Ange', 'Homme', '1995-03-02', '+225 07 00 00 00 33', 'Yopougon', 'Williamsville', 'Membre', '10000000-0000-0000-0000-000000000004', 'gc02', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'Traoré', 'Aïcha', 'Femme', '1996-05-28', '+225 07 00 00 00 34', 'Port-Bouët', 'Williamsville', 'Responsable', '10000000-0000-0000-0000-000000000004', 'gc02', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'Coulibaly', 'Jean', 'Homme', '1984-12-02', '+225 07 00 00 00 35', 'Marcory', 'Vridi', 'Responsable', '10000000-0000-0000-0000-000000000004', 'gc08', 1, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'Koné', 'Didier', 'Homme', '2006-11-23', '+225 07 00 00 00 36', 'Port-Bouët', 'Riviera', 'Membre', '10000000-0000-0000-0000-000000000004', 'gc06', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'Yao', 'Yannick', 'Homme', '1965-01-05', '+225 07 00 00 00 45', 'Yopougon', 'Riviera', 'Nouveau', null, 'gc03', 2, 'Fiche fictive de test', 'ADNH'),
  ('20000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'Kouassi', 'Ange', 'Femme', '1970-05-22', '+225 07 00 00 00 46', 'Abobo', 'Akouédo', 'Nouveau', null, 'gc07', 2, 'Fiche fictive de test', 'ADNH'),
  ('20000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 'Gnagne', 'Ismaël', 'Homme', '1988-06-07', '+225 07 00 00 00 47', 'Adjamé', 'Akouédo', 'Nouveau', null, 'gc11', 2, 'Fiche fictive de test', 'ADNH'),
  ('20000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 'Bamba', 'Jean', 'Homme', '1960-11-02', '+225 07 00 00 00 40', 'Abobo', 'Zone 4', 'Responsable', null, 'gc10', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 'Konan', 'Nadège', 'Femme', '1980-09-10', '+225 07 00 00 00 41', 'Port-Bouët', 'Zone 4', 'Responsable', null, 'gc11', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', 'Koné', 'Arnaud', 'Homme', '1976-10-04', '+225 07 00 00 00 42', 'Treichville', 'Riviera', 'Membre', null, 'gc11', 2, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', 'Kouamé', 'Mariam', 'Femme', '1989-04-20', '+225 07 00 00 00 43', 'Adjamé', 'Sogefiha', 'Membre', null, 'gc10', 4, 'Fiche fictive de test', null),
  ('20000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'Zadi', 'Jean', 'Homme', '1963-07-25', '+225 07 00 00 00 44', 'Marcory', 'Niangon', 'Membre', null, 'gc11', 4, 'Fiche fictive de test', null);

insert into nouveau (id, eglise_id, date_venue, nom, contact, commune, origine, statut, gc_id, classe, fidele_id) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08-02', 'Yao Yannick', '+225 07 00 00 00 45', 'Yopougon', 'Culte du dimanche', 'intégré', 'gc03', 2, '20000000-0000-0000-0000-000000000033'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08-07', 'Kouassi Ange', '+225 07 00 00 00 46', 'Abobo', 'Culte du dimanche', 'intégré', 'gc07', 2, '20000000-0000-0000-0000-000000000034'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-08-12', 'Gnagne Ismaël', '+225 07 00 00 00 47', 'Adjamé', 'Culte du dimanche', 'intégré', 'gc11', 2, '20000000-0000-0000-0000-000000000035'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-09-17', 'Kouassi Serge', '+225 07 00 00 00 48', 'Port-Bouët', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-09-05', 'Coulibaly Prisca', '+225 07 00 00 00 49', 'Bingerville', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-09-10', 'Aka Jean', '+225 07 00 00 00 50', 'Yopougon', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-10-15', 'Gnagne Christelle', '+225 07 00 00 00 51', 'Port-Bouët', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-10-03', 'Koné Christelle', '+225 07 00 00 00 52', 'Marcory', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2026-10-08', 'Ouattara Hervé', '+225 07 00 00 00 53', 'Bingerville', 'Culte du dimanche', 'en suivi', null, null, null),
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '2026-11-13', 'N''Guessan Jean', '+225 07 00 00 00 54', 'Plateau', 'Culte du dimanche', 'en suivi', null, null, null);

insert into appel (id, eglise_id, nouveau_id, date, resultat, note) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-08-04', 'Joint', 'A confirmé sa venue au culte.'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '2026-08-09', 'Joint', 'A confirmé sa venue au culte.'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '2026-08-14', 'Joint', 'A confirmé sa venue au culte.'),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', '2026-09-19', 'Pas de réponse', 'À rappeler en semaine.'),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '2026-09-07', 'Rappeler plus tard', 'À rappeler en semaine.');

-- Données FICTIVES du lot 2 (cellules, GC, programmation, jour de culte).

insert into cellule (id, eglise_id, nom, lieu, commune, famille_accueil, berger_id, jour, infos) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Cellule Riviera', 'Domicile de la famille Kouamé', 'Cocody', 'Famille Traoré', '10000000-0000-0000-0000-000000000001', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Cellule Angré', 'Domicile de la famille Yao', 'Cocody', 'Famille Diomandé', '10000000-0000-0000-0000-000000000001', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Cellule Niangon', 'Domicile de la famille Brou', 'Yopougon', 'Famille Ouattara', '10000000-0000-0000-0000-000000000002', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Cellule Sogefiha', 'Domicile de la famille Aka', 'Yopougon', 'Famille Brou', '10000000-0000-0000-0000-000000000002', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Cellule Zone 4', 'Domicile de la famille Gnagne', 'Marcory', 'Famille Brou', '10000000-0000-0000-0000-000000000003', 'Jeudi', 'Cellule fictive de test'),
  ('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Cellule Abobo-Gare', 'Domicile de la famille Yao', 'Abobo', 'Famille Bamba', '10000000-0000-0000-0000-000000000004', 'Vendredi', 'Cellule fictive de test');

update fidele set cellule_id = '50000000-0000-0000-0000-000000000001' where id in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000011');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000002' where id in ('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000012');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000003' where id in ('20000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000021');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000004' where id in ('20000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000022');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000005' where id in ('20000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000028');
update fidele set cellule_id = '50000000-0000-0000-0000-000000000006' where id in ('20000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000032');

insert into rapport_cellule (id, eglise_id, cellule_id, date, presents, nouveaux, offrande, sujets) values
  ('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-11-04', 4, 1, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-11-11', 5, 0, 3000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '2026-11-04', 6, 0, 8000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '2026-11-11', 5, 0, 4000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', '2026-11-04', 3, 1, 8000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', '2026-11-11', 3, 1, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', '2026-11-04', 3, 0, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', '2026-11-11', 3, 1, 9000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', '2026-11-04', 5, 1, 3000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', '2026-11-11', 5, 1, 7000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', '2026-11-04', 4, 1, 6000, 'Prière pour les familles et les malades.'),
  ('51000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', '2026-11-11', 2, 0, 8000, 'Prière pour les familles et les malades.');

update gc set tribu = 'Juda', responsables = array['Zadi Serge', 'Diomandé Patricia', 'Zadi Franck', '', ''] where id = 'gc01';
update gc set tribu = 'Lévi', responsables = array['Bamba Grâce', 'N''Guessan Prisca', 'Aka Arnaud', '', ''] where id = 'gc02';
update gc set tribu = 'Benjamin', responsables = array['Assi Hervé', 'Zadi Jean', 'Diomandé Patricia', '', ''] where id = 'gc03';
update gc set tribu = 'Éphraïm', responsables = array['Gnagne Serge', 'Yao Yannick', 'Assi Franck', '', ''] where id = 'gc04';
update gc set tribu = 'Manassé', responsables = array['Assi Serge', 'Yao Arnaud', 'Kouassi Serge', '', ''] where id = 'gc05';
update gc set tribu = 'Ruben', responsables = array['Yao Ange', 'Touré Yannick', 'Brou Nadège', '', ''] where id = 'gc06';
update gc set tribu = 'Siméon', responsables = array['Touré Serge', 'Traoré Christelle', 'Kouassi Ange', '', ''] where id = 'gc07';
update gc set tribu = 'Issacar', responsables = array['Ouattara Serge', 'Aka Marie', 'Aka Nadège', '', ''] where id = 'gc08';
update gc set tribu = 'Zabulon', responsables = array['Yao Arnaud', 'Koné Christelle', 'Konan Yannick', '', ''] where id = 'gc09';
update gc set tribu = 'Dan', responsables = array['Ehouman Patricia', 'Assi Arnaud', 'Kouamé Prisca', '', ''] where id = 'gc10';
update gc set tribu = 'Nephtali', responsables = array['Aka Nadège', 'Ouattara Marie', 'N''Guessan Ismaël', '', ''] where id = 'gc11';
update gc set tribu = 'Gad', responsables = array['Bamba Fabrice', 'Zadi Nadège', 'Konan Christelle', '', ''] where id = 'gc12';

insert into gc_presence (id, eglise_id, gc_id, date, presents) values
  ('52000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'gc01', '2026-11-15', 1),
  ('52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'gc02', '2026-11-15', 2),
  ('52000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'gc03', '2026-11-15', 3);
insert into gc_absence (presence_id, fidele_id) values
  ('52000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000008'),
  ('52000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000022'),
  ('52000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('52000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006'),
  ('52000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000010'),
  ('52000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000013');

insert into gc_passage (id, eglise_id, gc_id, date, note) values
  ('53000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'gc01', '2026-11-08', 'Accueil du culte du dimanche'),
  ('53000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'gc02', '2026-11-15', 'Placement dans la nef'),
  ('53000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'gc03', '2026-11-22', 'Accueil du culte du dimanche'),
  ('53000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'gc04', '2026-11-29', 'Nettoyage du temple');

insert into assemblee (id, eglise_id, nom, ville, commune, pasteur) values
  ('54000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'EMCV Abidjan (siège)', 'Abidjan', 'Cocody', 'Pasteur Traoré'),
  ('54000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'EMCV Yopougon', 'Abidjan', 'Yopougon', 'Pasteur Zadi'),
  ('54000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'EMCV Bouaké', 'Bouaké', 'Centre', 'Pasteur Touré');

insert into evenement (id, eglise_id, titre, type, assemblee_id, date, date_fin, heure, lieu, responsable, description) values
  ('55000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Convention annuelle', 'Convention', '54000000-0000-0000-0000-000000000001', '2026-01-16', '2026-01-18', '08:30', 'Temple principal', 'Pasteur Bamba', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Retraite des responsables', 'Retraite', '54000000-0000-0000-0000-000000000001', '2026-02-20', '2026-02-22', '08:30', 'Salle polyvalente', 'Pasteur Kouassi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Séminaire des couples', 'Séminaire', '54000000-0000-0000-0000-000000000002', '2026-03-14', null, '08:30', 'Esplanade du temple', 'Pasteur Yao', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Culte de Pâques', 'Culte', '54000000-0000-0000-0000-000000000001', '2026-04-05', null, '08:30', 'Temple principal', 'Pasteur Kouadio', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Croisade d''évangélisation', 'Croisade', '54000000-0000-0000-0000-000000000003', '2026-05-22', '2026-05-24', '08:30', 'Salle polyvalente', 'Pasteur Kouassi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Veillée de prière', 'Veillée de prière', '54000000-0000-0000-0000-000000000001', '2026-06-26', null, '21:00', 'Esplanade du temple', 'Pasteur N''Guessan', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Séminaire des jeunes', 'Séminaire', '54000000-0000-0000-0000-000000000002', '2026-08-08', null, '08:30', 'Temple principal', 'Pasteur Kouassi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Rentrée des cellules', 'Réunion', '54000000-0000-0000-0000-000000000001', '2026-09-06', null, '08:30', 'Salle polyvalente', 'Pasteur Gnagne', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Formation des bergers', 'Formation', '54000000-0000-0000-0000-000000000001', '2026-10-10', null, '08:30', 'Esplanade du temple', 'Pasteur Traoré', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Veillée de prière', 'Veillée de prière', '54000000-0000-0000-0000-000000000002', '2026-11-27', null, '21:00', 'Temple principal', 'Pasteur Diomandé', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Étude biblique', 'Étude biblique', '54000000-0000-0000-0000-000000000001', '2026-12-02', null, '08:30', 'Salle polyvalente', 'Pasteur Zadi', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Veillée de Noël', 'Veillée de prière', '54000000-0000-0000-0000-000000000001', '2026-12-24', null, '21:00', 'Esplanade du temple', 'Pasteur Traoré', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Culte de Noël', 'Culte', '54000000-0000-0000-0000-000000000001', '2026-12-25', null, '08:30', 'Temple principal', 'Pasteur Coulibaly', 'Activité fictive de test'),
  ('55000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Culte de fin d''année', 'Culte', '54000000-0000-0000-0000-000000000003', '2026-12-31', null, '08:30', 'Salle polyvalente', 'Pasteur Kouamé', 'Activité fictive de test');

insert into comptage (id, eglise_id, date, culte, hommes, femmes, enfants, nouveaux) values
  ('56000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09-27', 'Culte du dimanche – 1er service', 316, 461, 117, 3),
  ('56000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-10-04', 'Culte du dimanche – 1er service', 294, 461, 115, 3),
  ('56000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-10-11', 'Culte du dimanche – 1er service', 307, 444, 115, 1),
  ('56000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-10-18', 'Culte du dimanche – 1er service', 296, 433, 113, 3),
  ('56000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-10-25', 'Culte du dimanche – 1er service', 291, 442, 117, 2),
  ('56000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-11-01', 'Culte du dimanche – 1er service', 307, 440, 136, 5),
  ('56000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-11-08', 'Culte du dimanche – 1er service', 299, 421, 126, 4),
  ('56000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Culte du dimanche – 1er service', 302, 465, 115, 7);

insert into poste_accueil (id, eglise_id, date, poste, agent, contact, places) values
  ('57000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Entrée principale', 'Koffi Fabrice', '+225 07 00 00 00 55', null),
  ('57000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Parking', 'Kouadio Prisca', '+225 07 00 00 00 56', 64),
  ('57000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Accueil des nouveaux', 'Coulibaly Esther', '+225 07 00 00 00 57', null),
  ('57000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Salle des enfants', 'Konan Mariam', '+225 07 00 00 00 58', null);

-- Données FICTIVES du lot 3 (formations, départements, réunions, organigramme).

insert into session_formation (id, eglise_id, classe, date_debut, date_fin, formateur, lieu) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, '2026-09-07', '2026-12-13', 'Formateur Ouattara', 'Salle de formation'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2, '2027-01-11', '2027-04-18', 'Formateur Aka', 'Salle de formation'),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 3, '2026-03-02', '2026-06-14', 'Formateur Ouattara', 'Salle de formation');

insert into inscription_formation (id, session_id, fidele_id, absences, valide) values
  ('61000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 0, false),
  ('61000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 1, false),
  ('61000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 2, false),
  ('61000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 1, false),
  ('61000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 2, false),
  ('61000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000009', 2, false),
  ('61000000-0000-0000-0000-000000000007', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000010', 0, false),
  ('61000000-0000-0000-0000-000000000008', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000013', 2, false),
  ('61000000-0000-0000-0000-000000000009', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000014', 2, false),
  ('61000000-0000-0000-0000-000000000010', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000023', 0, false),
  ('61000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', 0, true),
  ('61000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', 1, true),
  ('61000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000017', 0, true),
  ('61000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000019', 2, true),
  ('61000000-0000-0000-0000-000000000015', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000021', 0, false);

update departement set responsable = 'Koffi Mariam', contact = '+225 07 00 00 00 59', jour = 'Mardi soir', membres = array['Kouassi Serge', 'Bamba Didier', 'Koffi Serge', 'Diomandé Fabrice'] where id = 'd01';
update departement set responsable = 'Koffi Arnaud', contact = '+225 07 00 00 00 60', jour = 'Mardi soir', membres = array['Gnagne Hervé', 'Kouadio Serge', 'Kouadio Ismaël', 'Traoré Ange'] where id = 'd02';
update departement set responsable = 'Bamba Didier', contact = '+225 07 00 00 00 61', jour = 'Mardi soir', membres = array['Ouattara Ismaël', 'Assi Ange'] where id = 'd03';
update departement set responsable = 'Kouamé Yannick', contact = '+225 07 00 00 00 62', jour = 'Samedi matin', membres = array['Koffi Hervé', 'Ehouman Franck', 'Kouadio Hervé', 'Traoré Jean', 'Aka Serge'] where id = 'd04';
update departement set responsable = 'Traoré Ruth', contact = '+225 07 00 00 00 63', jour = 'Jeudi soir', membres = array['Koné Jean', 'Gnagne Mariam', 'Kouamé Yannick', 'Konan Marie', 'Zadi Ruth'] where id = 'd05';
update departement set responsable = 'Konan Franck', contact = '+225 07 00 00 00 64', jour = 'Mardi soir', membres = array['Kouadio Mariam', 'Koffi Fabrice', 'Ehouman Patricia', 'Koné Grâce', 'Ouattara Mariam'] where id = 'd06';
update departement set responsable = 'Zadi Grâce', contact = '+225 07 00 00 00 65', jour = 'Jeudi soir', membres = array['Koffi Fabrice', 'Aka Ange', 'Gnagne Ange', 'Assi Marie'] where id = 'd07';
update departement set responsable = 'Kouassi Fabrice', contact = '+225 07 00 00 00 66', jour = 'Mardi soir', membres = array['Aka Ruth', 'Kouadio Serge', 'Kouassi Patricia'] where id = 'd08';
update departement set responsable = 'Aka Ruth', contact = '+225 07 00 00 00 67', jour = 'Mardi soir', membres = array['Assi Aïcha', 'Bamba Jean', 'Gnagne Aïcha'] where id = 'd09';
update departement set responsable = 'Gnagne Patricia', contact = '+225 07 00 00 00 68', jour = 'Samedi matin', membres = array['Zadi Yannick', 'Zadi Fabrice', 'Zadi Fabrice', 'Koffi Ruth', 'Kouadio Didier'] where id = 'd10';
update departement set responsable = 'Brou Aïcha', contact = '+225 07 00 00 00 69', jour = 'Samedi matin', membres = array['N''Guessan Nadège', 'Yao Ruth'] where id = 'd11';
update departement set responsable = 'Kouadio Mariam', contact = '+225 07 00 00 00 70', jour = 'Samedi matin', membres = array['Ouattara Arnaud', 'Zadi Ange', 'Konan Christelle', 'Assi Fabrice'] where id = 'd12';

insert into planning_service (id, eglise_id, date, activite, departement_id, poste, personne, contact, confirme) values
  ('62000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-22', 'Culte du dimanche', 'd01', 'Entrée principale', 'Koffi Franck', '+225 07 00 00 00 71', true),
  ('62000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-22', 'Culte du dimanche', 'd04', 'Caméra 1', 'Assi Patricia', '+225 07 00 00 00 72', true),
  ('62000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-22', 'Culte du dimanche', 'd05', 'Console son', 'N''Guessan Esther', '+225 07 00 00 00 73', false),
  ('62000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-29', 'Culte du dimanche', 'd01', 'Placement', 'Traoré Nadège', '+225 07 00 00 00 74', true),
  ('62000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-29', 'Culte du dimanche', 'd07', 'Chant', 'Yao Didier', '+225 07 00 00 00 75', true),
  ('62000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-11-29', 'Culte du dimanche', 'd08', 'Classe des 6-9 ans', 'Assi Jean', '+225 07 00 00 00 76', false);

insert into rapport_departement (id, eglise_id, departement_id, periode, activites, resultats, difficultes, effectif, statut) values
  ('63000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'd04', '2026-10', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 6, 'Validé'),
  ('63000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'd04', '2026-11', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 5, 'Soumis'),
  ('63000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'd07', '2026-11', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 11, 'Soumis'),
  ('63000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'd08', '2026-10', 'Service assuré à chaque culte du mois.', 'Équipe au complet trois dimanches sur quatre.', 'Besoin de deux volontaires supplémentaires.', 6, 'À revoir');

insert into reunion (id, eglise_id, date, instance, assemblee_id, lieu, objet, presents, discussions, decisions) values
  ('64000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09-08', 'Conseil', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Rentrée des cellules', 'Membres du conseil (fictifs)', 'Calendrier de rentrée
Répartition des bergers', 'Rentrée des cellules le 6 septembre'),
  ('64000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-10-13', 'Responsables', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Préparation de la convention 2027', 'Membres du conseil (fictifs)', 'Lieu et budget
Transport des participants', 'Réserver la salle avant fin novembre
Frais d''inscription fixés à 5 000 FCFA'),
  ('64000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-10', 'Conseil', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Budget 2027', 'Membres du conseil (fictifs)', 'Prévisions de dépenses
Travaux du temple', 'Adopter le budget en décembre'),
  ('64000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-17', 'Pasteurs', '54000000-0000-0000-0000-000000000001', 'Bureau pastoral', 'Suivi des nouveaux', 'Membres du conseil (fictifs)', 'Taux d''intégration
Appels non faits', 'Appeler chaque nouveau dans la semaine');

insert into tache (id, eglise_id, titre, responsable, echeance, statut, reunion_id) values
  ('65000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Réserver la salle de la convention', 'Aka Ruth', '2026-11-30', 'En cours', '64000000-0000-0000-0000-000000000002'),
  ('65000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Publier les frais d''inscription', 'Kouadio Fabrice', '2026-11-15', 'À faire', '64000000-0000-0000-0000-000000000002'),
  ('65000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Préparer le projet de budget', 'Kouassi Grâce', '2026-12-05', 'En cours', '64000000-0000-0000-0000-000000000003'),
  ('65000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Obtenir les devis des travaux', 'N''Guessan Yannick', '2026-11-12', 'À faire', '64000000-0000-0000-0000-000000000003'),
  ('65000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Envoyer la liste des nouveaux aux bergers', 'Brou Prisca', '2026-11-20', 'Terminée', '64000000-0000-0000-0000-000000000004'),
  ('65000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Former deux nouveaux bergers', 'Traoré Patricia', '2026-10-30', 'Terminée', '64000000-0000-0000-0000-000000000001');

insert into responsable (id, eglise_id, fonction, nom, contact, whatsapp, niveau, ordre) values
  ('66000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Pasteur principal', 'Konan Fabrice', '+225 07 00 00 00 77', '+225 07 00 00 00 77', 'Direction', 1),
  ('66000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pasteur adjoint', 'Ehouman Hervé', '+225 07 00 00 00 78', '+225 07 00 00 00 78', 'Pasteurs', 2),
  ('66000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Pasteur des jeunes', 'Coulibaly Franck', '+225 07 00 00 00 79', '+225 07 00 00 00 79', 'Pasteurs', 3),
  ('66000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Ancien', 'Koné Nadège', '+225 07 00 00 00 80', '+225 07 00 00 00 80', 'Conseil', 4),
  ('66000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Ancien', 'Koffi Fabrice', '+225 07 00 00 00 81', '+225 07 00 00 00 81', 'Conseil', 5),
  ('66000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Secrétaire du conseil', 'Ouattara Aïcha', '+225 07 00 00 00 82', '+225 07 00 00 00 82', 'Conseil', 6),
  ('66000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Responsable de la louange', 'Assi Serge', '+225 07 00 00 00 83', '+225 07 00 00 00 83', 'Responsables de ministère', 7),
  ('66000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Responsable de l''ADNH', 'N''Guessan Fabrice', '+225 07 00 00 00 84', '+225 07 00 00 00 84', 'Responsables de ministère', 8);

-- Données FICTIVES du lot 4 (requêtes de prière, enfants, rendez-vous pastoraux, événements).

insert into priere (id, eglise_id, date, demandeur, visibilite, sujet, statut, temoignage) values
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-02', 'Diomandé Didier', 'Publique', 'Pour la convention de janvier.', 'En prière', null),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-05', 'Yao Arnaud', 'Équipe d''intercession', 'Pour un travail stable.', 'Reçue', null),
  ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-08', 'Gnagne Grâce', 'Confidentielle', 'Situation familiale difficile.', 'En prière', null),
  ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-09', 'Gnagne Fabrice', 'Publique', 'Pour la santé de ma mère.', 'Exaucée', 'Ma mère est sortie de l''hôpital, gloire à Dieu.'),
  ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-12', 'Ouattara Didier', 'Équipe d''intercession', 'Pour la réussite aux examens.', 'Reçue', null),
  ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-11-15', 'Bamba Yannick', 'Confidentielle', 'Décision importante à prendre.', 'Reçue', null),
  ('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-10-20', 'Koné Yannick', 'Publique', 'Pour un logement.', 'Exaucée', 'Nous avons trouvé un logement à Cocody.'),
  ('70000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-11-17', 'Assi Grâce', 'Publique', 'Pour les nouveaux de l''église.', 'En prière', null);

insert into enfant (id, eglise_id, nom, groupe, parent, contact, code, notes) values
  ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Bamba Arnaud', '0–3 ans', 'Touré Mariam', '+225 07 00 00 00 85', 'JJXX', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Koné Hervé', '4–6 ans', 'Ouattara Ange', '+225 07 00 00 00 86', 'R8X8', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ehouman Esther', '7–9 ans', 'Konan Nadège', '+225 07 00 00 00 87', 'SZ5X', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Konan Christelle', '10–12 ans', 'Traoré Aïcha', '+225 07 00 00 00 88', 'AQN7', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'N''Guessan Christelle', '13 ans et plus', 'Konan Grâce', '+225 07 00 00 00 89', 'E2WF', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Zadi Serge', '0–3 ans', 'Coulibaly Arnaud', '+225 07 00 00 00 90', 'LYT8', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'N''Guessan Nadège', '4–6 ans', 'Ouattara Ange', '+225 07 00 00 00 91', 'XHMJ', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'N''Guessan Hervé', '7–9 ans', 'Aka Ange', '+225 07 00 00 00 92', '2BE2', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Ehouman Ismaël', '10–12 ans', 'Bamba Franck', '+225 07 00 00 00 93', 'ZJ2J', 'Fiche fictive de test'),
  ('71000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Kouamé Esther', '13 ans et plus', 'Ehouman Esther', '+225 07 00 00 00 94', 'ZAZT', 'Fiche fictive de test');

insert into pointage_enfant (id, eglise_id, enfant_id, date, arrivee, sortie) values
  ('72000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000003', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000004', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000005', '2026-11-15', true, true),
  ('72000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000006', '2026-11-15', true, false),
  ('72000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000007', '2026-11-15', true, false);

insert into rdv (id, eglise_id, date, heure, personne, contact, type, pasteur, motif, statut) values
  ('73000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-11-10', '10:00', 'Famille Diomandé', '+225 07 00 00 00 95', 'Bureau', 'Pasteur Bamba', 'Conseil conjugal', 'Fait'),
  ('73000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-11-13', '10:00', 'Famille Diomandé', '+225 07 00 00 00 96', 'Visite à l''hôpital', 'Pasteur Kouamé', 'Visite après une opération', 'Fait'),
  ('73000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-11-18', '10:00', 'Famille Kouadio', '+225 07 00 00 00 97', 'Visite à domicile', 'Pasteur Assi', 'Présentation d''un nouveau-né', 'Reporté'),
  ('73000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-26', '10:00', 'Famille Konan', '+225 07 00 00 00 98', 'Bureau', 'Pasteur Coulibaly', 'Préparation au mariage', 'Prévu'),
  ('73000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-28', '10:00', 'Famille Aka', '+225 07 00 00 00 99', 'Appel', 'Pasteur Gnagne', 'Suivi d''un nouveau', 'Prévu'),
  ('73000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-12-03', '10:00', 'Famille Yao', '+225 07 00 00 01 00', 'Visite à domicile', 'Pasteur Kouadio', 'Visite de soutien', 'Prévu');

insert into evenement (id, eglise_id, titre, type, assemblee_id, date, date_fin, heure, lieu, responsable, frais, description) values
  ('55000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Convention annuelle 2027', 'Convention', '54000000-0000-0000-0000-000000000001', '2027-01-15', '2027-01-17', '08:30', 'Esplanade du temple', 'Pasteur Touré', 5000, 'Activité fictive de test');

insert into inscription_evenement (id, eglise_id, evenement_id, nom, contact, montant, canal, car, depart) values
  ('74000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Yao Ruth', '+225 07 00 00 01 01', 5000, 'Orange Money', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Gnagne Franck', '+225 07 00 00 01 02', 5000, 'Espèces', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Touré Nadège', '+225 07 00 00 01 03', 5000, 'Wave', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Koné Ange', '+225 07 00 00 01 04', 2000, 'MTN MoMo', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Koffi Ange', '+225 07 00 00 01 05', 5000, 'Orange Money', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Kouassi Mariam', '+225 07 00 00 01 06', 5000, 'Wave', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Kouassi Yannick', '+225 07 00 00 01 07', 5000, 'Espèces', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Koné Arnaud', '+225 07 00 00 01 08', 2000, 'Espèces', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Diomandé Grâce', '+225 07 00 00 01 09', 5000, 'Orange Money', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Zadi Grâce', '+225 07 00 00 01 10', 5000, 'Espèces', 'Car 2', 'Yopougon'),
  ('74000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Touré Prisca', '+225 07 00 00 01 11', 5000, 'Wave', 'Car 1', 'Cocody'),
  ('74000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000015', 'Zadi Hervé', '+225 07 00 00 01 12', 2000, 'Espèces', 'Car 2', 'Yopougon');

-- Données FICTIVES du lot 5 (objectifs, projets).

insert into objectif (id, eglise_id, libelle, but, mesure, cible, realise, date_debut, date_fin, departement_id, responsable) values
  ('75000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Accueillir 40 nouveaux venus en 2026', 'Faire grandir l''église par l''accueil.', 'nouveaux', 40, null, '2026-01-01', '2026-12-31', null, 'Responsable Aka'),
  ('75000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Intégrer la moitié des nouveaux', 'Que chaque nouveau trouve sa place.', 'integres', 5, null, '2026-01-01', '2026-12-31', null, 'Responsable Gnagne'),
  ('75000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Confier chaque fidèle à un berger', 'Aucun fidèle sans suivi.', 'suivis', 40, null, '2026-01-01', '2026-12-31', null, 'Responsable Ehouman'),
  ('75000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Six cellules actives', 'Couvrir les communes d''Abidjan.', 'cellules', 6, null, '2026-01-01', '2026-12-31', null, 'Responsable Aka'),
  ('75000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Former 8 opérateurs caméra', 'Assurer la diffusion des cultes.', 'manuel', 8, 5, '2026-01-01', '2026-12-31', 'd04', 'Responsable Aka'),
  ('75000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Deux nouveaux chants par mois', 'Renouveler la louange.', 'manuel', 12, 12, '2026-06-01', '2026-11-30', 'd07', 'Responsable Gnagne'),
  ('75000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Présence moyenne de 350 au 1er semestre', 'Mesurer la fidélité aux cultes.', 'presence', 350, null, '2026-01-01', '2026-06-30', null, 'Responsable Ouattara');

insert into projet (id, eglise_id, nom, description, departement_id, date_debut, echeance, priorite, statut, budget, responsable) values
  ('76000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Réfection de la toiture du temple', 'Remplacer les tôles abîmées avant la saison des pluies.', 'd06', '2026-10-01', '2027-03-31', 'Haute', 'En cours', 4500000, 'Frère Brou'),
  ('76000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Convention annuelle 2027', 'Organisation, hébergement et transport des participants.', null, '2026-09-15', '2027-01-17', 'Haute', 'En cours', 3000000, 'Frère Assi'),
  ('76000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Équipement de la régie vidéo', 'Deuxième caméra et ordinateur de diffusion.', 'd04', '2026-11-01', '2027-02-28', 'Moyenne', 'À lancer', 1800000, 'Frère Brou'),
  ('76000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Rentrée de l''école du dimanche', 'Nouveaux supports et formation des moniteurs.', 'd08', '2026-08-01', '2026-10-15', 'Basse', 'Terminé', 350000, 'Frère Bamba');

insert into projet_action (id, eglise_id, projet_id, titre, echeance, statut, responsable) values
  ('77000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Obtenir trois devis', '2026-11-10', 'Fait', 'Ouattara Franck'),
  ('77000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Choisir l''entreprise', '2026-11-18', 'En cours', 'Brou Didier'),
  ('77000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Collecte spéciale pour la toiture', '2026-11-23', 'À faire', 'N''Guessan Jean'),
  ('77000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', 'Début des travaux', '2027-01-12', 'À faire', 'Konan Ruth'),
  ('77000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Réserver l''esplanade', '2026-10-01', 'Fait', 'Traoré Ruth'),
  ('77000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Louer les cars', '2026-11-27', 'À faire', 'Traoré Serge'),
  ('77000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Ouvrir les inscriptions', '2026-11-05', 'Fait', 'Ehouman Patricia'),
  ('77000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', 'Programme des orateurs', '2026-12-15', 'À faire', 'Brou Fabrice'),
  ('77000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000003', 'Comparer les caméras', '2026-11-20', 'À faire', 'Ehouman Fabrice'),
  ('77000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000003', 'Présenter le budget au conseil', '2026-12-05', 'À faire', 'Konan Christelle'),
  ('77000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000004', 'Commander les supports', '2026-08-20', 'Fait', 'Aka Patricia'),
  ('77000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000004', 'Former les moniteurs', '2026-09-26', 'Fait', 'Ouattara Patricia');

insert into projet_journal (id, eglise_id, projet_id, date, type, texte) values
  ('78000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', '2026-10-05', 'Décision', 'Le conseil valide le lancement du projet.'),
  ('78000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000001', '2026-11-12', 'Difficulté', 'Un devis dépasse le budget prévu de 15 %.'),
  ('78000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000002', '2026-11-05', 'Note', 'Les inscriptions sont ouvertes.'),
  ('78000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '76000000-0000-0000-0000-000000000004', '2026-10-15', 'Note', 'Projet terminé dans les temps.');

-- Données FICTIVES du lot 6 (finances, communication, patrimoine).

insert into fonds (id, eglise_id, nom, type, objectif, fin, description) values
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Dîmes', 'Fonds permanent', null, null, 'Fonds fictif de test'),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Offrandes', 'Fonds permanent', null, null, 'Fonds fictif de test'),
  ('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Construction du temple', 'Campagne', 15000000, '2027-06-30', 'Fonds fictif de test'),
  ('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Missions', 'Fonds permanent', null, null, 'Fonds fictif de test');

insert into don (id, eglise_id, date, fonds_id, montant, canal, fidele_id, reference, statut) values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2025-12-03', '80000000-0000-0000-0000-000000000002', 164000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2025-12-03', '80000000-0000-0000-0000-000000000003', 25000, 'Orange Money', null, 'TX000002', 'Validé'),
  ('81000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2025-12-10', '80000000-0000-0000-0000-000000000002', 206000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2025-12-10', '80000000-0000-0000-0000-000000000003', 38000, 'Wave', null, 'TX000004', 'Validé'),
  ('81000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2025-12-17', '80000000-0000-0000-0000-000000000002', 229000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2025-12-17', '80000000-0000-0000-0000-000000000003', 45000, 'MTN MoMo', null, 'TX000006', 'Validé'),
  ('81000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2025-12-24', '80000000-0000-0000-0000-000000000002', 205000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2025-12-24', '80000000-0000-0000-0000-000000000003', 67000, 'MTN MoMo', null, 'TX000008', 'Validé'),
  ('81000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2025-12-05', '80000000-0000-0000-0000-000000000001', 15000, 'Moov Money', '20000000-0000-0000-0000-000000000015', 'TX000009', 'Validé'),
  ('81000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '2025-12-10', '80000000-0000-0000-0000-000000000001', 26000, 'MTN MoMo', '20000000-0000-0000-0000-000000000027', 'TX000010', 'Validé'),
  ('81000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '2025-12-15', '80000000-0000-0000-0000-000000000001', 38000, 'MTN MoMo', '20000000-0000-0000-0000-000000000010', 'TX000011', 'Validé'),
  ('81000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '2025-12-20', '80000000-0000-0000-0000-000000000001', 15000, 'Espèces', '20000000-0000-0000-0000-000000000033', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '2026-01-03', '80000000-0000-0000-0000-000000000002', 153000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '2026-01-03', '80000000-0000-0000-0000-000000000003', 41000, 'Wave', null, 'TX000014', 'Validé'),
  ('81000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '2026-01-10', '80000000-0000-0000-0000-000000000002', 191000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '2026-01-17', '80000000-0000-0000-0000-000000000002', 217000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '2026-01-17', '80000000-0000-0000-0000-000000000003', 66000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '2026-01-24', '80000000-0000-0000-0000-000000000002', 204000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '2026-01-05', '80000000-0000-0000-0000-000000000001', 21000, 'Espèces', '20000000-0000-0000-0000-000000000013', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '2026-01-10', '80000000-0000-0000-0000-000000000001', 30000, 'Espèces', '20000000-0000-0000-0000-000000000025', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '2026-01-15', '80000000-0000-0000-0000-000000000001', 27000, 'Espèces', '20000000-0000-0000-0000-000000000008', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '2026-01-20', '80000000-0000-0000-0000-000000000001', 17000, 'Wave', '20000000-0000-0000-0000-000000000016', 'TX000022', 'Validé'),
  ('81000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '2026-02-03', '80000000-0000-0000-0000-000000000002', 154000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '2026-02-10', '80000000-0000-0000-0000-000000000002', 161000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '2026-02-10', '80000000-0000-0000-0000-000000000003', 44000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '2026-02-17', '80000000-0000-0000-0000-000000000002', 193000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '2026-02-17', '80000000-0000-0000-0000-000000000003', 71000, 'Moov Money', null, 'TX000027', 'Validé'),
  ('81000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '2026-02-24', '80000000-0000-0000-0000-000000000002', 160000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '2026-02-05', '80000000-0000-0000-0000-000000000001', 46000, 'MTN MoMo', '20000000-0000-0000-0000-000000000011', 'TX000029', 'Validé'),
  ('81000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '2026-02-10', '80000000-0000-0000-0000-000000000001', 48000, 'Moov Money', '20000000-0000-0000-0000-000000000013', 'TX000030', 'Validé'),
  ('81000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '2026-02-15', '80000000-0000-0000-0000-000000000001', 36000, 'Espèces', '20000000-0000-0000-0000-000000000034', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '2026-02-20', '80000000-0000-0000-0000-000000000001', 37000, 'Orange Money', '20000000-0000-0000-0000-000000000011', 'TX000032', 'Validé'),
  ('81000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '2026-02-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000033', 'Validé'),
  ('81000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '2026-03-03', '80000000-0000-0000-0000-000000000002', 220000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '2026-03-10', '80000000-0000-0000-0000-000000000002', 187000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', '2026-03-10', '80000000-0000-0000-0000-000000000003', 55000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', '2026-03-17', '80000000-0000-0000-0000-000000000002', 198000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', '2026-03-24', '80000000-0000-0000-0000-000000000002', 226000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', '2026-03-24', '80000000-0000-0000-0000-000000000003', 71000, 'MTN MoMo', null, 'TX000039', 'Validé'),
  ('81000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', '2026-03-05', '80000000-0000-0000-0000-000000000001', 20000, 'Moov Money', '20000000-0000-0000-0000-000000000040', 'TX000040', 'Validé'),
  ('81000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', '2026-03-10', '80000000-0000-0000-0000-000000000001', 14000, 'Orange Money', '20000000-0000-0000-0000-000000000035', 'TX000041', 'Validé'),
  ('81000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', '2026-03-15', '80000000-0000-0000-0000-000000000001', 18000, 'Wave', '20000000-0000-0000-0000-000000000004', 'TX000042', 'Validé'),
  ('81000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', '2026-03-20', '80000000-0000-0000-0000-000000000001', 24000, 'Moov Money', '20000000-0000-0000-0000-000000000032', 'TX000043', 'Validé'),
  ('81000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', '2026-04-03', '80000000-0000-0000-0000-000000000002', 158000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', '2026-04-03', '80000000-0000-0000-0000-000000000003', 73000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', '2026-04-10', '80000000-0000-0000-0000-000000000002', 171000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', '2026-04-10', '80000000-0000-0000-0000-000000000003', 74000, 'Orange Money', null, 'TX000047', 'Validé'),
  ('81000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', '2026-04-17', '80000000-0000-0000-0000-000000000002', 187000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', '2026-04-17', '80000000-0000-0000-0000-000000000003', 32000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', '2026-04-24', '80000000-0000-0000-0000-000000000002', 179000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', '2026-04-24', '80000000-0000-0000-0000-000000000003', 32000, 'Wave', null, 'TX000051', 'Validé'),
  ('81000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', '2026-04-05', '80000000-0000-0000-0000-000000000001', 49000, 'MTN MoMo', '20000000-0000-0000-0000-000000000008', 'TX000052', 'Validé'),
  ('81000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', '2026-04-10', '80000000-0000-0000-0000-000000000001', 42000, 'Wave', '20000000-0000-0000-0000-000000000018', 'TX000053', 'Validé'),
  ('81000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000001', '2026-04-15', '80000000-0000-0000-0000-000000000001', 25000, 'Orange Money', '20000000-0000-0000-0000-000000000021', 'TX000054', 'Validé'),
  ('81000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001', '2026-04-20', '80000000-0000-0000-0000-000000000001', 39000, 'Espèces', '20000000-0000-0000-0000-000000000018', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000056', '00000000-0000-0000-0000-000000000001', '2026-05-03', '80000000-0000-0000-0000-000000000002', 207000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000057', '00000000-0000-0000-0000-000000000001', '2026-05-03', '80000000-0000-0000-0000-000000000003', 67000, 'MTN MoMo', null, 'TX000057', 'Validé'),
  ('81000000-0000-0000-0000-000000000058', '00000000-0000-0000-0000-000000000001', '2026-05-10', '80000000-0000-0000-0000-000000000002', 157000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000059', '00000000-0000-0000-0000-000000000001', '2026-05-10', '80000000-0000-0000-0000-000000000003', 33000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000001', '2026-05-17', '80000000-0000-0000-0000-000000000002', 215000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000001', '2026-05-17', '80000000-0000-0000-0000-000000000003', 56000, 'Moov Money', null, 'TX000061', 'Validé'),
  ('81000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000001', '2026-05-24', '80000000-0000-0000-0000-000000000002', 167000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000001', '2026-05-05', '80000000-0000-0000-0000-000000000001', 23000, 'MTN MoMo', '20000000-0000-0000-0000-000000000031', 'TX000063', 'Validé'),
  ('81000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000001', '2026-05-10', '80000000-0000-0000-0000-000000000001', 38000, 'Espèces', '20000000-0000-0000-0000-000000000039', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000001', '2026-05-15', '80000000-0000-0000-0000-000000000001', 25000, 'Orange Money', '20000000-0000-0000-0000-000000000019', 'TX000065', 'Validé'),
  ('81000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000001', '2026-05-20', '80000000-0000-0000-0000-000000000001', 40000, 'Espèces', '20000000-0000-0000-0000-000000000027', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000067', '00000000-0000-0000-0000-000000000001', '2026-05-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000067', 'Validé'),
  ('81000000-0000-0000-0000-000000000068', '00000000-0000-0000-0000-000000000001', '2026-06-03', '80000000-0000-0000-0000-000000000002', 210000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000069', '00000000-0000-0000-0000-000000000001', '2026-06-03', '80000000-0000-0000-0000-000000000003', 65000, 'Moov Money', null, 'TX000069', 'Validé'),
  ('81000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000001', '2026-06-10', '80000000-0000-0000-0000-000000000002', 195000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001', '2026-06-10', '80000000-0000-0000-0000-000000000003', 69000, 'Moov Money', null, 'TX000071', 'Validé'),
  ('81000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000001', '2026-06-17', '80000000-0000-0000-0000-000000000002', 204000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000001', '2026-06-24', '80000000-0000-0000-0000-000000000002', 177000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000001', '2026-06-05', '80000000-0000-0000-0000-000000000001', 37000, 'Espèces', '20000000-0000-0000-0000-000000000001', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000001', '2026-06-10', '80000000-0000-0000-0000-000000000001', 36000, 'Orange Money', '20000000-0000-0000-0000-000000000008', 'TX000075', 'Validé'),
  ('81000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000001', '2026-06-15', '80000000-0000-0000-0000-000000000001', 43000, 'Espèces', '20000000-0000-0000-0000-000000000011', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000077', '00000000-0000-0000-0000-000000000001', '2026-06-20', '80000000-0000-0000-0000-000000000001', 22000, 'Espèces', '20000000-0000-0000-0000-000000000028', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000001', '2026-07-03', '80000000-0000-0000-0000-000000000002', 169000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000079', '00000000-0000-0000-0000-000000000001', '2026-07-03', '80000000-0000-0000-0000-000000000003', 58000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000001', '2026-07-10', '80000000-0000-0000-0000-000000000002', 157000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000001', '2026-07-10', '80000000-0000-0000-0000-000000000003', 71000, 'Orange Money', null, 'TX000081', 'Validé'),
  ('81000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000001', '2026-07-17', '80000000-0000-0000-0000-000000000002', 190000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000001', '2026-07-17', '80000000-0000-0000-0000-000000000003', 72000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000001', '2026-07-24', '80000000-0000-0000-0000-000000000002', 205000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000085', '00000000-0000-0000-0000-000000000001', '2026-07-24', '80000000-0000-0000-0000-000000000003', 70000, 'MTN MoMo', null, 'TX000085', 'Validé'),
  ('81000000-0000-0000-0000-000000000086', '00000000-0000-0000-0000-000000000001', '2026-07-05', '80000000-0000-0000-0000-000000000001', 19000, 'MTN MoMo', '20000000-0000-0000-0000-000000000013', 'TX000086', 'Validé'),
  ('81000000-0000-0000-0000-000000000087', '00000000-0000-0000-0000-000000000001', '2026-07-10', '80000000-0000-0000-0000-000000000001', 45000, 'Espèces', '20000000-0000-0000-0000-000000000014', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000088', '00000000-0000-0000-0000-000000000001', '2026-07-15', '80000000-0000-0000-0000-000000000001', 30000, 'Espèces', '20000000-0000-0000-0000-000000000033', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000089', '00000000-0000-0000-0000-000000000001', '2026-07-20', '80000000-0000-0000-0000-000000000001', 36000, 'MTN MoMo', '20000000-0000-0000-0000-000000000033', 'TX000089', 'Validé'),
  ('81000000-0000-0000-0000-000000000090', '00000000-0000-0000-0000-000000000001', '2026-08-03', '80000000-0000-0000-0000-000000000002', 182000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000001', '2026-08-10', '80000000-0000-0000-0000-000000000002', 158000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000001', '2026-08-17', '80000000-0000-0000-0000-000000000002', 184000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000093', '00000000-0000-0000-0000-000000000001', '2026-08-24', '80000000-0000-0000-0000-000000000002', 173000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000094', '00000000-0000-0000-0000-000000000001', '2026-08-05', '80000000-0000-0000-0000-000000000001', 27000, 'MTN MoMo', '20000000-0000-0000-0000-000000000008', 'TX000094', 'Validé'),
  ('81000000-0000-0000-0000-000000000095', '00000000-0000-0000-0000-000000000001', '2026-08-10', '80000000-0000-0000-0000-000000000001', 37000, 'Espèces', '20000000-0000-0000-0000-000000000001', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000096', '00000000-0000-0000-0000-000000000001', '2026-08-15', '80000000-0000-0000-0000-000000000001', 34000, 'Moov Money', '20000000-0000-0000-0000-000000000035', 'TX000096', 'Validé'),
  ('81000000-0000-0000-0000-000000000097', '00000000-0000-0000-0000-000000000001', '2026-08-20', '80000000-0000-0000-0000-000000000001', 28000, 'Espèces', '20000000-0000-0000-0000-000000000021', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000098', '00000000-0000-0000-0000-000000000001', '2026-08-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000098', 'Validé'),
  ('81000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000001', '2026-09-03', '80000000-0000-0000-0000-000000000002', 183000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', '2026-09-03', '80000000-0000-0000-0000-000000000003', 54000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '2026-09-10', '80000000-0000-0000-0000-000000000002', 214000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '2026-09-10', '80000000-0000-0000-0000-000000000003', 50000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '2026-09-17', '80000000-0000-0000-0000-000000000002', 158000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '2026-09-24', '80000000-0000-0000-0000-000000000002', 183000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', '2026-09-24', '80000000-0000-0000-0000-000000000003', 73000, 'Moov Money', null, 'TX000105', 'Validé'),
  ('81000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', '2026-09-05', '80000000-0000-0000-0000-000000000001', 15000, 'Wave', '20000000-0000-0000-0000-000000000035', 'TX000106', 'Validé'),
  ('81000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', '2026-09-10', '80000000-0000-0000-0000-000000000001', 38000, 'Espèces', '20000000-0000-0000-0000-000000000020', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001', '2026-09-15', '80000000-0000-0000-0000-000000000001', 15000, 'Espèces', '20000000-0000-0000-0000-000000000040', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000001', '2026-09-20', '80000000-0000-0000-0000-000000000001', 30000, 'Orange Money', '20000000-0000-0000-0000-000000000021', 'TX000109', 'Validé'),
  ('81000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001', '2026-10-03', '80000000-0000-0000-0000-000000000002', 181000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001', '2026-10-03', '80000000-0000-0000-0000-000000000003', 64000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000001', '2026-10-10', '80000000-0000-0000-0000-000000000002', 174000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000001', '2026-10-17', '80000000-0000-0000-0000-000000000002', 199000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000001', '2026-10-17', '80000000-0000-0000-0000-000000000003', 59000, 'Orange Money', null, 'TX000114', 'Validé'),
  ('81000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000001', '2026-10-24', '80000000-0000-0000-0000-000000000002', 182000, 'Espèces', null, null, 'Validé'),
  ('81000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000001', '2026-10-05', '80000000-0000-0000-0000-000000000001', 40000, 'Espèces', '20000000-0000-0000-0000-000000000026', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000001', '2026-10-10', '80000000-0000-0000-0000-000000000001', 38000, 'Espèces', '20000000-0000-0000-0000-000000000019', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000001', '2026-10-15', '80000000-0000-0000-0000-000000000001', 43000, 'Espèces', '20000000-0000-0000-0000-000000000004', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000001', '2026-10-20', '80000000-0000-0000-0000-000000000001', 17000, 'Espèces', '20000000-0000-0000-0000-000000000030', null, 'Validé'),
  ('81000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000001', '2026-11-03', '80000000-0000-0000-0000-000000000002', 206000, 'Espèces', null, null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000001', '2026-11-10', '80000000-0000-0000-0000-000000000002', 200000, 'Espèces', null, null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000001', '2026-11-17', '80000000-0000-0000-0000-000000000002', 163000, 'Espèces', null, null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000001', '2026-11-05', '80000000-0000-0000-0000-000000000001', 41000, 'Wave', '20000000-0000-0000-0000-000000000014', 'TX000123', 'Saisi'),
  ('81000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-000000000001', '2026-11-10', '80000000-0000-0000-0000-000000000001', 24000, 'Wave', '20000000-0000-0000-0000-000000000035', 'TX000124', 'Saisi'),
  ('81000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000001', '2026-11-15', '80000000-0000-0000-0000-000000000001', 12000, 'Moov Money', '20000000-0000-0000-0000-000000000016', 'TX000125', 'Saisi'),
  ('81000000-0000-0000-0000-000000000126', '00000000-0000-0000-0000-000000000001', '2026-11-20', '80000000-0000-0000-0000-000000000001', 11000, 'Espèces', '20000000-0000-0000-0000-000000000026', null, 'Saisi'),
  ('81000000-0000-0000-0000-000000000127', '00000000-0000-0000-0000-000000000001', '2026-11-15', '80000000-0000-0000-0000-000000000004', 50000, 'Virement', null, 'TX000127', 'Saisi');

insert into ligne_budget (id, eglise_id, annee, poste, departement_id, montant) values
  ('82000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2026, 'Loyer et charges du temple', 'd06', 6000000),
  ('82000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2026, 'Électricité et eau', 'd06', 2400000),
  ('82000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 2026, 'Sono et médias', 'd04', 1800000),
  ('82000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 2026, 'École du dimanche', 'd08', 600000),
  ('82000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 2026, 'Œuvres caritatives', 'd10', 1500000),
  ('82000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 2026, 'Évangélisation et missions', null, 2000000),
  ('82000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 2026, 'Entretien et hygiène', 'd03', 900000),
  ('82000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 2026, 'Toiture du temple', 'd06', 4500000);

insert into depense (id, eglise_id, date, objet, montant, ligne_budget_id, projet_id, demandeur, beneficiaire, canal, statut) values
  ('83000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-01-05', 'Loyer de janvier', 500000, '82000000-0000-0000-0000-000000000001', null, 'Konan Ruth', 'Prestataire fictif', 'Espèces', 'Payée'),
  ('83000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-02-05', 'Loyer de février', 500000, '82000000-0000-0000-0000-000000000001', null, 'Ouattara Didier', 'Prestataire fictif', 'Virement', 'Payée'),
  ('83000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-03-05', 'Loyer de mars', 500000, '82000000-0000-0000-0000-000000000001', null, 'Assi Nadège', 'Prestataire fictif', 'Espèces', 'Payée'),
  ('83000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-04-12', 'Facture CIE (électricité)', 210000, '82000000-0000-0000-0000-000000000002', null, 'Koné Yannick', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-05-20', 'Câbles et micros', 320000, '82000000-0000-0000-0000-000000000003', null, 'Ouattara Esther', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2026-06-08', 'Supports de l''école du dimanche', 180000, '82000000-0000-0000-0000-000000000004', null, 'N''Guessan Ruth', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2026-07-14', 'Dons alimentaires aux familles', 400000, '82000000-0000-0000-0000-000000000005', null, 'Kouamé Ruth', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2026-08-22', 'Croisade de Yopougon', 650000, '82000000-0000-0000-0000-000000000006', null, 'N''Guessan Fabrice', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2026-09-10', 'Produits d''entretien', 95000, '82000000-0000-0000-0000-000000000007', null, 'Kouamé Ismaël', 'Prestataire fictif', 'Orange Money', 'Payée'),
  ('83000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '2026-10-05', 'Loyer d''octobre', 500000, '82000000-0000-0000-0000-000000000001', null, 'Brou Fabrice', 'Prestataire fictif', 'Virement', 'Payée'),
  ('83000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '2026-11-05', 'Loyer de novembre', 500000, '82000000-0000-0000-0000-000000000001', null, 'Zadi Ismaël', 'Prestataire fictif', 'Virement', 'Validée'),
  ('83000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '2026-11-12', 'Acompte toiture (tôles)', 1200000, '82000000-0000-0000-0000-000000000008', '76000000-0000-0000-0000-000000000001', 'Ouattara Mariam', 'Prestataire fictif', 'Espèces', 'Validée'),
  ('83000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '2026-11-16', 'Facture SODECI (eau)', 75000, '82000000-0000-0000-0000-000000000002', null, 'Diomandé Marie', 'Prestataire fictif', 'Espèces', 'Demandée'),
  ('83000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '2026-11-18', 'Location de cars pour la convention', 900000, '82000000-0000-0000-0000-000000000006', '76000000-0000-0000-0000-000000000002', 'Ouattara Grâce', 'Prestataire fictif', 'Virement', 'Demandée'),
  ('83000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '2026-11-19', 'Ordinateur de diffusion', 650000, '82000000-0000-0000-0000-000000000003', '76000000-0000-0000-0000-000000000003', 'Koné Nadège', 'Prestataire fictif', 'Virement', 'Refusée');

insert into annonce (id, eglise_id, titre, date, jusquau, texte, publie) values
  ('84000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Veillée de prière', '2026-11-16', '2026-11-28', 'Veillée de prière vendredi 27 novembre à 22 h au temple. Venez nombreux.', true),
  ('84000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Inscriptions à la convention 2027', '2026-11-05', '2027-01-10', 'Les inscriptions à la convention annuelle sont ouvertes auprès du secrétariat (5 000 F, transport compris).', true),
  ('84000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Collecte pour la toiture', '2026-11-12', null, 'Une collecte spéciale pour la réfection de la toiture aura lieu le dimanche 23 novembre.', true),
  ('84000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Programme de Noël', '2026-11-19', null, 'Brouillon à compléter : horaires des cultes de Noël et du Nouvel An.', false);

insert into article (id, eglise_id, article, categorie, quantite, affectation, etat, valeur, date_achat, notes) values
  ('85000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Console de mixage 24 pistes', 'Sono et instruments', 1, 'Régie', 'Bon', 1800000, '2024-03-10', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Micros sans fil', 'Sono et instruments', 6, 'Louange', 'Bon', 90000, '2025-01-15', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Clavier numérique', 'Sono et instruments', 1, 'Louange', 'À réparer', 650000, '2022-06-01', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Chaises en plastique', 'Mobilier', 400, 'Nef', 'Bon', 6000, '2023-09-01', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Bancs en bois', 'Mobilier', 60, 'Nef', 'Bon', 45000, '2019-05-20', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Vidéoprojecteur', 'Informatique', 2, 'Médias', 'Bon', 420000, '2024-11-02', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Ordinateur portable', 'Informatique', 1, 'Secrétariat', 'À réparer', 380000, '2021-02-14', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Minicar 22 places', 'Véhicule', 1, 'Transport', 'Bon', 14000000, '2020-08-30', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Groupe électrogène', 'Autre', 1, 'Temple', 'Hors service', 2500000, '2018-04-11', 'Article fictif de test'),
  ('85000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Climatiseurs', 'Bâtiment', 4, 'Salle des enfants', 'Bon', 350000, '2023-03-03', 'Article fictif de test');

insert into entretien (id, eglise_id, date, article_id, intervention, prestataire, cout, prochaine) values
  ('86000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-06-10', '85000000-0000-0000-0000-000000000008', 'Vidange et révision', 'Garage fictif', 85000, '2026-12-10'),
  ('86000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-09-02', '85000000-0000-0000-0000-000000000009', 'Diagnostic de panne', 'Électricien fictif', 25000, '2026-10-15'),
  ('86000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-10-20', '85000000-0000-0000-0000-000000000010', 'Nettoyage des filtres', 'Froid fictif', 40000, '2027-01-20'),
  ('86000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-03', '85000000-0000-0000-0000-000000000001', 'Mise à jour et réglages', 'Technicien fictif', 30000, null),
  ('86000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-14', '85000000-0000-0000-0000-000000000003', 'Remplacement de touches', 'Technicien fictif', 60000, '2026-11-25');

insert into objectif (id, eglise_id, libelle, but, mesure, cible, date_debut, date_fin, responsable) values
  ('75000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Collecter 15 millions pour le temple en 2026', 'Financer les travaux sans emprunt.', 'dons', 15000000, '2026-01-01', '2026-12-31', 'Trésorier');

-- Données FICTIVES du lot 7 (évangélisation, cérémonies, paramètres de l'église).

insert into sortie (id, eglise_id, date, lieu, commune, equipe, participants, rencontres, contacts, bilan) values
  ('87000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09-12', 'Marché de Treichville', 'Treichville', 'Équipe A', 12, 45, 'Koffi Fabrice – 07 00 00 01 13
Kouadio Ange – 07 00 00 01 14
Diomandé Esther – 07 00 00 01 15', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-10-03', 'Gare de Yopougon', 'Yopougon', 'Équipe B', 9, 38, 'Assi Ismaël – 07 00 00 01 16
Aka Ismaël – 07 00 00 01 17', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-10-24', 'Quartier Angré', 'Cocody', 'Équipe A', 14, 52, 'N''Guessan Patricia – 07 00 00 01 18
Bamba Ruth – 07 00 00 01 19
Ehouman Mariam – 07 00 00 01 20
Koffi Fabrice – 07 00 00 01 21', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-11-07', 'Abobo-Gare', 'Abobo', 'Équipe C', 8, 30, 'Aka Franck – 07 00 00 01 22
Aka Serge – 07 00 00 01 23', 'Sortie fictive de test'),
  ('87000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2026-11-21', 'Marché de Koumassi', 'Koumassi', 'Équipe B', 11, 41, 'Kouadio Fabrice – 07 00 00 01 24
Assi Ruth – 07 00 00 01 25
Coulibaly Arnaud – 07 00 00 01 26', 'Sortie fictive de test');

insert into ceremonie (id, eglise_id, type, date, personnes, officiant, lieu, notes) values
  ('88000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Baptême', '2026-08-30', 'Touré Franck, Bamba Serge, Kouadio Franck, Aka Prisca, Kouadio Ismaël, Traoré Jean', 'Pasteur Aka', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Baptême', '2026-11-15', 'Konan Esther, Assi Aïcha, Kouassi Yannick, Yao Mariam', 'Pasteur Gnagne', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Sainte-Cène', '2026-10-04', 'Assemblée réunie', 'Pasteur Konan', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Sainte-Cène', '2026-11-01', 'Assemblée réunie', 'Pasteur Traoré', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Mariage', '2026-09-19', 'Brou Aïcha et Touré Hervé', 'Pasteur Brou', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Présentation d''enfant', '2026-10-11', 'Assi Fabrice', 'Pasteur Zadi', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Consécration', '2026-10-25', 'Assi Marie, Assi Mariam', 'Pasteur Koné', 'Temple principal', 'Fiche fictive de test'),
  ('88000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Obsèques', '2026-11-08', 'Brou Aïcha', 'Pasteur Traoré', 'Temple principal', 'Fiche fictive de test');

update eglise set nom_complet = 'Église Missionnaire Christ Vivant', pasteur = 'Pasteur principal (fictif)', telephone = '+225 07 00 00 00 99', adresse = 'Adresse du temple (fictive)', commune = 'Cocody', email = 'contact@exemple.org', horaires = 'Dimanche : 1er culte 7 h 30, 2e culte 10 h
Mercredi : étude biblique 18 h 30
Vendredi : veillée 22 h' where id = '00000000-0000-0000-0000-000000000001';
