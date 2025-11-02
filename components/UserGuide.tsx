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
        En haut de la page, vous trouverez des cartes affichant les chiffres essentiels : nombre total de véhicules, véhicules disponibles et loués, clients, chauffeurs, et maintenant, le nombre de contraventions non payées.
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
        Cliquez sur "Ajouter un Véhicule" pour ouvrir un formulaire. Remplissez les détails : marque, modèle, année, plaque d'immatriculation, kilométrage, dates d'échéance, et informations financières comme la valeur d'achat et le taux d'amortissement.
      </Paragraph>
      <SubTitle>Rentabilité et Historique Détaillé</SubTitle>
       <Paragraph>
        En cliquant sur un véhicule, vous accédez à une vue détaillée complète. Le nouveau tableau de bord financier calcule le **Rendement Net** en incluant le chiffre d'affaires, l'amortissement et les coûts de maintenance. Vous y trouverez également un historique complet des locations, des maintenances et des **contraventions** associées à ce véhicule.
      </Paragraph>
      
      <SectionTitle>3. Gestion des Locations</SectionTitle>
      <SubTitle>Créer une Location</SubTitle>
      <Paragraph>
        Cliquez sur "Nouvelle Location", puis sélectionnez un client, un véhicule disponible, et éventuellement un chauffeur et/ou un partenaire. Définissez les dates et le prix.
      </Paragraph>
      <SubTitle>Suivi des Paiements</SubTitle>
      <Paragraph>
        Sur chaque carte de location, une barre de progression vous montre l'état des paiements. Cliquez sur "Ajouter Paiement" pour enregistrer un versement.
      </Paragraph>

      <SectionTitle>4. Clients, Chauffeurs, Propriétaires et Partenaires</SectionTitle>
      <Paragraph>
        Ces sections vous permettent de gérer vos contacts. Le module CRM client vous aide à identifier vos clients les plus fidèles en fonction de leur historique de location.
      </Paragraph>
      
      <SectionTitle>5. Atelier, Suivi & Contraventions</SectionTitle>
      <SubTitle>Atelier & Suivi</SubTitle>
      <Paragraph>
        Planifiez et suivez toutes les opérations de maintenance de votre flotte. Mettez à jour le statut de la tâche ("À faire", "En cours", "Terminé") directement depuis la liste.
      </Paragraph>
      <SubTitle>Gestion des Contraventions</SubTitle>
      <Paragraph>
        Ce nouveau module est essentiel pour suivre les amendes. Cliquez sur "Ajouter Contravention", sélectionnez le véhicule, la date, et décrivez l'infraction. Il est fortement recommandé d'associer la contravention à une location en cours pour identifier le client responsable. Vous pouvez ensuite suivre le statut de paiement de chaque amende.
      </Paragraph>


      <SectionTitle>6. Trésorerie</SectionTitle>
      <Paragraph>
        Cette section a été enrichie pour vous offrir un contrôle financier complet. Visualisez les revenus, coûts et bénéfices, et analysez la répartition de vos dépenses. Utilisez les filtres pour affiner vos recherches et exportez vos données au format CSV.
      </Paragraph>

    </div>
  );
};