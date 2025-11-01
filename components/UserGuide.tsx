import React from 'react';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h2 className="text-3xl font-bold text-gray-800 mt-10 mb-4 pb-2 border-b-2 border-red-500">{children}</h2>
);

const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">{children}</h3>
);

const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-gray-600 leading-relaxed mb-4">{children}</p>
);

export const UserGuide: React.FC = () => {
  return (
    <div className="p-8 bg-white max-w-4xl mx-auto my-8 rounded-lg shadow-lg">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4 text-center">Manuel d'utilisation de CARMIXT APPS</h1>
      <p className="text-center text-gray-500 mb-10">Votre guide complet pour maîtriser l'application de gestion de location de véhicules.</p>
      
      <Paragraph>
        Bienvenue dans CARMIXT APPS ! Cette application a été conçue pour vous offrir une solution complète et intuitive pour la gestion de votre flotte de véhicules, de vos locations et de votre comptabilité. Ce manuel vous guidera à travers chaque section pour vous aider à tirer le meilleur parti de cet outil.
      </Paragraph>

      <SectionTitle>1. Tableau de Bord</SectionTitle>
      <Paragraph>
        Le tableau de bord est votre page d'accueil. Il vous donne une vue d'ensemble instantanée de l'état de votre activité.
      </Paragraph>
      <SubTitle>Indicateurs Clés</SubTitle>
      <Paragraph>
        En haut de la page, vous trouverez des cartes affichant les chiffres essentiels : nombre total de véhicules, véhicules disponibles et loués, nombre de clients, de chauffeurs, et le revenu total généré.
      </Paragraph>
      <SubTitle>Alertes d'Échéances</SubTitle>
      <Paragraph>
        Ce bloc crucial, situé sur la droite, vous avertit des véhicules dont l'assurance, la visite technique ou la prochaine maintenance expirent dans moins de 30 jours. Les alertes sont triées par urgence pour vous permettre d'agir rapidement.
      </Paragraph>
      <SubTitle>Locations Actives et Aperçu de la Flotte</SubTitle>
      <Paragraph>
        Consultez rapidement les dernières locations en cours avec leur date de retour, ainsi qu'un aperçu des véhicules de votre flotte avec leur statut actuel.
      </Paragraph>

      <SectionTitle>2. Gestion des Véhicules</SectionTitle>
      <Paragraph>
        Cette section est le cœur de la gestion de votre flotte.
      </Paragraph>
      <SubTitle>Ajouter un Véhicule</SubTitle>
      <Paragraph>
        Cliquez sur "Ajouter un Véhicule" pour ouvrir un formulaire. Remplissez les détails : marque, modèle, année, plaque d'immatriculation, kilométrage, dates d'échéance (assurance, visite technique, maintenance) et téléchargez une photo.
      </Paragraph>
      <SubTitle>Filtrer et Rechercher</SubTitle>
      <Paragraph>
        Utilisez la barre de recherche pour trouver un véhicule par marque, modèle ou plaque. Affinez votre recherche avec les filtres par statut et par année.
      </Paragraph>
      <SubTitle>Gérer un Véhicule</SubTitle>
      <Paragraph>
        Chaque véhicule est présenté sur une carte. Vous pouvez :
        <ul className="list-disc list-inside ml-4 mt-2 bg-gray-50 p-3 rounded">
            <li><strong>Voir les détails :</strong> Cliquez sur l'image ou le nom pour voir l'historique complet des locations et des maintenances.</li>
            <li><strong>Changer le statut :</strong> Utilisez le menu déroulant pour passer un véhicule en "Disponible", "En Maintenance" ou "Réservé". Le statut "Loué" est géré automatiquement.</li>
            <li><strong>Supprimer :</strong> Supprimez un véhicule (uniquement s'il n'est pas en cours de location).</li>
        </ul>
      </Paragraph>

      <SectionTitle>3. Gestion des Locations</SectionTitle>
      <SubTitle>Créer une Location</SubTitle>
      <Paragraph>
        Cliquez sur "Nouvelle Location", puis sélectionnez un client, un véhicule disponible, et éventuellement un chauffeur. Définissez les dates de début et de fin, ainsi que le prix total.
      </Paragraph>
      <SubTitle>Suivi des Paiements</SubTitle>
      <Paragraph>
        Sur chaque carte de location, une barre de progression vous montre l'état des paiements. Cliquez sur "Ajouter Paiement" pour enregistrer un versement. Le solde restant est calculé automatiquement.
      </Paragraph>
      <SubTitle>Terminer une Location et Générer un Contrat</SubTitle>
      <Paragraph>
        Une fois la location terminée, cliquez sur "Marquer comme terminée". Le véhicule et le chauffeur (si applicable) redeviennent disponibles. Vous pouvez également générer un contrat en PDF à tout moment.
      </Paragraph>

      <SectionTitle>4. Clients et Chauffeurs</SectionTitle>
      <Paragraph>
        Ces sections vous permettent de gérer vos listes de clients et de chauffeurs. Utilisez le bouton "Ajouter" pour enregistrer de nouvelles personnes. Vous pouvez les supprimer si besoin. Le statut des chauffeurs ("Disponible" ou "En mission") est mis à jour automatiquement en fonction des locations.
      </Paragraph>
      
      <SectionTitle>5. Atelier & Suivi</SectionTitle>
      <Paragraph>
        Planifiez et suivez toutes les opérations de maintenance de votre flotte. Ajoutez une nouvelle tâche en spécifiant le véhicule, la description, le coût, le kilométrage et les pièces changées. Mettez à jour le statut de la tâche ("À faire", "En cours", "Terminé") directement depuis la liste.
      </Paragraph>

      <SectionTitle>6. Trésorerie</SectionTitle>
      <Paragraph>
        Cette section a été enrichie pour vous offrir un contrôle financier complet.
      </Paragraph>
      <SubTitle>Vue d'Ensemble et Résumé Annuel</SubTitle>
      <Paragraph>
        Visualisez les revenus, coûts et bénéfices (globaux et pour l'année en cours). Un graphique linéaire vous montre l'évolution de vos revenus mensuels pour l'année en cours.
      </Paragraph>
      <SubTitle>Gérer les Dépenses</SubTitle>
      <Paragraph>
        Cliquez sur "Ajouter Dépense" pour enregistrer des coûts non liés à la maintenance (loyer, salaires, etc.). Dans la liste des transactions, vous pouvez maintenant modifier (icône crayon) ou supprimer (icône poubelle) une dépense que vous avez ajoutée.
      </Paragraph>
      <SubTitle>Filtrer et Exporter</SubTitle>
      <Paragraph>
        Utilisez les filtres rapides ("Ce mois-ci", "Cette année") et le filtre par type (Revenus/Dépenses) pour analyser vos flux. Exportez vos données filtrées au format CSV pour une analyse externe, ou générez des rapports PDF complets.
      </Paragraph>
       <SubTitle>Graphiques d'Analyse</SubTitle>
      <Paragraph>
        En plus du graphique de revenus, un graphique à barres vous montre la répartition de vos dépenses par catégorie pour la période sélectionnée, vous aidant à identifier vos principaux postes de coûts.
      </Paragraph>

    </div>
  );
};
