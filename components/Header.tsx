import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import type { Alert } from '../App';
import { CarmixtLogo, DashboardIcon, CarIcon, CalendarIcon, UsersIcon, KeyIcon, CogIcon, CashIcon, BookOpenIcon, BellIcon, AlertIcon, SunIcon, MoonIcon, ChevronDownIcon } from './icons';
import GlobalSearch from './GlobalSearch';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  alerts: Alert[];
  theme: string;
  setTheme: (theme: string) => void;
}

const NavItem: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
      isActive
        ? 'bg-red-600 text-white'
        : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

const NavDropdown: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [ref]);


    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl" onClick={() => setIsOpen(false)}>
                    <div className="py-2 space-y-1 px-2">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, alerts, theme, setTheme }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-20 px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm sticky top-0 z-20 shrink-0">
      <div className="flex items-center space-x-4">
        <CarmixtLogo className="text-gray-800 dark:text-gray-200"/>
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
        <nav className="hidden md:flex items-center space-x-1">
          <NavItem icon={<DashboardIcon className="w-5 h-5"/>} label="Tableau de Bord" isActive={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<CarIcon className="w-5 h-5"/>} label="Véhicules" isActive={currentView === 'vehicles'} onClick={() => setCurrentView('vehicles')} />
          <NavItem icon={<CalendarIcon className="w-5 h-5"/>} label="Locations" isActive={currentView === 'rentals'} onClick={() => setCurrentView('rentals')} />
          <NavDropdown title="Gestion">
             <NavItem icon={<UsersIcon className="w-5 h-5"/>} label="Clients" isActive={currentView === 'clients'} onClick={() => setCurrentView('clients')} />
             <NavItem icon={<KeyIcon className="w-5 h-5"/>} label="Propriétaires" isActive={currentView === 'owners'} onClick={() => setCurrentView('owners')} />
             <NavItem icon={<CogIcon className="w-5 h-5"/>} label="Atelier & Suivi" isActive={currentView === 'maintenance'} onClick={() => setCurrentView('maintenance')} />
          </NavDropdown>
           <NavDropdown title="Plus">
             <NavItem icon={<CalendarIcon className="w-5 h-5"/>} label="Calendrier" isActive={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} />
             <NavItem icon={<CashIcon className="w-5 h-5"/>} label="Trésorerie" isActive={currentView === 'accounting'} onClick={() => setCurrentView('accounting')} />
             <NavItem icon={<BookOpenIcon className="w-5 h-5"/>} label="Manuel" isActive={currentView === 'guide'} onClick={() => setCurrentView('guide')} />
           </NavDropdown>
        </nav>
      </div>

      <div className="flex-1 max-w-md mx-4">
         <GlobalSearch />
      </div>

      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500">
            {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}
        </button>
        
        <div className="relative" ref={notificationsRef}>
            <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500">
                <BellIcon className="w-6 h-6"/>
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-3 w-3 bg-red-500 text-white text-[10px] font-bold">{alerts.length}</span>
                  </span>
                )}
            </button>
            {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20">
                    <div className="p-3 font-semibold text-sm border-b dark:border-gray-700 text-gray-800 dark:text-white">Notifications ({alerts.length})</div>
                    {alerts.length > 0 ? (
                        <ul className="max-h-80 overflow-y-auto">
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
        
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

        <div className="relative" ref={userMenuRef}>
            <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500 rounded-full">
                <img
                  className="w-10 h-10 rounded-full object-cover"
                  src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=128"
                  alt="User avatar"
                />
                <div className="hidden lg:block text-left">
                     <p className="text-sm font-semibold text-gray-800 dark:text-white">Admin</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Gérant</p>
                </div>
            </button>
             {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Mon Compte</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Paramètres</a>
                    <div className="border-t dark:border-gray-700"></div>
                    <a href="#" className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">Déconnexion</a>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
