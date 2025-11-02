import React, { useState } from 'react';
import type { View } from '../types';
import type { Alert } from '../App';
import { DashboardIcon, CarIcon, CalendarIcon, UsersIcon, KeyIcon, CogIcon, CashIcon, CarmixtLogo, BookOpenIcon, BellIcon, AlertIcon, SunIcon, MoonIcon, BriefcaseIcon, ChevronDownIcon, CalendarGridIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  alerts: Alert[];
  theme: string;
  setTheme: (theme: string) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-3 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
      isActive
        ? 'bg-red-600 text-white shadow-md'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const NavAccordion: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
  isActive: boolean;
}> = ({ title, icon, children, isOpen, onClick, isActive }) => (
  <div>
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
        isActive && !isOpen ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <div className="flex items-center">
        {icon}
        <span className="ml-3">{title}</span>
      </div>
      <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="pt-2 pl-4 space-y-1">
        {children}
      </div>
    )}
  </div>
);


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, alerts, theme, setTheme }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Gestion']);

  const toggleGroup = (group: string) => {
    setOpenGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };
  
  const isGroupActive = (views: View[]) => views.includes(currentView);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex flex-col w-64 h-screen px-4 py-6 bg-gray-800 border-r border-gray-700 shrink-0">
      <div className="flex flex-col items-center px-2 mb-8 text-center">
        <CarmixtLogo className="text-gray-200"/>
        <p className="text-xs text-red-400 -mt-1">Votre partenaire mobilité</p>
        <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mt-2">PROGICIEL</p>
      </div>
      <nav className="flex-1 space-y-2">
         <NavItem 
            icon={<DashboardIcon className="w-5 h-5" />} 
            label="Tableau de Bord" 
            isActive={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
        />

        <NavAccordion
          title="Gestion"
          icon={<BriefcaseIcon className="w-5 h-5" />}
          isOpen={openGroups.includes('Gestion')}
          onClick={() => toggleGroup('Gestion')}
          isActive={isGroupActive(['vehicles', 'rentals', 'calendar'])}
        >
          <NavItem icon={<CarIcon className="w-5 h-5" />} label="Véhicules" isActive={currentView === 'vehicles'} onClick={() => setCurrentView('vehicles')} />
          <NavItem icon={<CalendarIcon className="w-5 h-5" />} label="Locations" isActive={currentView === 'rentals'} onClick={() => setCurrentView('rentals')} />
          <NavItem icon={<CalendarGridIcon className="w-5 h-5" />} label="Calendrier" isActive={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} />
        </NavAccordion>

        <NavAccordion
          title="Relations"
          icon={<UsersIcon className="w-5 h-5" />}
          isOpen={openGroups.includes('Relations')}
          onClick={() => toggleGroup('Relations')}
          isActive={isGroupActive(['clients', 'owners'])}
        >
            <NavItem icon={<UsersIcon className="w-5 h-5" />} label="Clients" isActive={currentView === 'clients'} onClick={() => setCurrentView('clients')} />
            <NavItem icon={<KeyIcon className="w-5 h-5" />} label="Propriétaires" isActive={currentView === 'owners'} onClick={() => setCurrentView('owners')} />
        </NavAccordion>

        <NavItem 
            icon={<CogIcon className="w-5 h-5" />} 
            label="Atelier & Sinistres" 
            isActive={currentView === 'maintenance'} 
            onClick={() => setCurrentView('maintenance')} 
        />
        <NavItem 
            icon={<CashIcon className="w-5 h-5" />} 
            label="Finance & Trésorerie" 
            isActive={currentView === 'accounting'} 
            onClick={() => setCurrentView('accounting')} 
        />

         <NavAccordion
          title="Aide"
          icon={<BookOpenIcon className="w-5 h-5" />}
          isOpen={openGroups.includes('Aide')}
          onClick={() => toggleGroup('Aide')}
          isActive={isGroupActive(['guide'])}
        >
            <NavItem icon={<BookOpenIcon className="w-5 h-5" />} label="Manuel" isActive={currentView === 'guide'} onClick={() => setCurrentView('guide')} />
        </NavAccordion>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-700">
        <div className="relative flex items-center p-2 rounded-lg bg-gray-900/50">
            <img className="w-10 h-10 rounded-full object-cover" src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=128" alt="User avatar" />
            <div className="ml-3">
                <p className="text-sm font-semibold text-white">Admin</p>
                <p className="text-xs text-gray-400">Gérant</p>
            </div>
            <div className="ml-auto flex items-center space-x-2">
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500">
                    {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                </button>
                 <div className="relative">
                    <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500">
                        <BellIcon className="w-5 h-5"/>
                        {alerts.length > 0 && <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20">
                            <div className="p-3 font-semibold text-sm border-b dark:border-gray-700 text-gray-800 dark:text-white">Notifications ({alerts.length})</div>
                            {alerts.length > 0 ? (
                                <ul className="max-h-64 overflow-y-auto">
                                    {alerts.map((alert, index) => (
                                        <li key={index} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <AlertIcon className={`w-6 h-6 mr-3 flex-shrink-0 ${alert.daysLeft <= 7 ? 'text-red-500' : 'text-yellow-500'}`} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{alert.type} pour {alert.vehicle.model}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Expire dans {alert.daysLeft} jour{alert.daysLeft > 1 ? 's' : ''}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">Aucune nouvelle notification</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;