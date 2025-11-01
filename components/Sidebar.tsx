import React from 'react';
import type { View } from '../types';
import { DashboardIcon, CarIcon, CalendarIcon, UsersIcon, SteeringWheelIcon, CogIcon, CashIcon, CarmixtLogo, BookOpenIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-red-600 text-white rounded-lg shadow-md'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-gray-800 text-white">
      <div className="flex flex-col items-center px-2 mb-10">
        <CarmixtLogo className="text-white"/>
        <p className="text-xs text-red-400 mt-1">Votre partenaire mobilité de A à Z</p>
      </div>
      <nav className="flex-1 space-y-2">
        <NavItem
          icon={<DashboardIcon className="w-6 h-6" />}
          label="Tableau de Bord"
          isActive={currentView === 'dashboard'}
          onClick={() => setCurrentView('dashboard')}
        />
        <NavItem
          icon={<CarIcon className="w-6 h-6" />}
          label="Véhicules"
          isActive={currentView === 'vehicles'}
          onClick={() => setCurrentView('vehicles')}
        />
        <NavItem
          icon={<CalendarIcon className="w-6 h-6" />}
          label="Locations"
          isActive={currentView === 'rentals'}
          onClick={() => setCurrentView('rentals')}
        />
        <NavItem
          icon={<UsersIcon className="w-6 h-6" />}
          label="Clients"
          isActive={currentView === 'clients'}
          onClick={() => setCurrentView('clients')}
        />
        <NavItem
          icon={<SteeringWheelIcon className="w-6 h-6" />}
          label="Chauffeurs"
          isActive={currentView === 'drivers'}
          onClick={() => setCurrentView('drivers')}
        />
        <div className="pt-4 mt-4 border-t border-gray-700">
           <NavItem
            icon={<CogIcon className="w-6 h-6" />}
            label="Atelier & Suivi"
            isActive={currentView === 'maintenance'}
            onClick={() => setCurrentView('maintenance')}
          />
           <NavItem
            icon={<CashIcon className="w-6 h-6" />}
            label="Trésorerie"
            isActive={currentView === 'accounting'}
            onClick={() => setCurrentView('accounting')}
          />
        </div>
        <div className="pt-4 mt-4 border-t border-gray-700">
          <NavItem
              icon={<BookOpenIcon className="w-6 h-6" />}
              label="Manuel d'utilisation"
              isActive={currentView === 'guide'}
              onClick={() => setCurrentView('guide')}
            />
        </div>
      </nav>
      <div className="mt-auto text-center text-xs text-gray-400">
        <p>&copy; 2024 CARMIXT APPS. Tous droits réservés.</p>
      </div>
    </div>
  );
};

export default Sidebar;