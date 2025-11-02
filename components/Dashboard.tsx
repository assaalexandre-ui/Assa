import React from 'react';
import { Vehicle, Rental, VehicleStatus, Client, Driver, HistoryLog, Owner, Affiliate, Contravention, ContraventionStatus, RentalStatus } from '../types';
import { CarIcon, CalendarIcon, CheckCircleIcon, UsersIcon, SteeringWheelIcon, CashIcon, AlertIcon, CogIcon, ShieldIcon, ClipboardCheckIcon, ClockIcon, KeyIcon, BriefcaseIcon, ExclamationShieldIcon } from './icons';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="flex items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 dark:border dark:border-gray-700">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
        case VehicleStatus.Available: return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300';
        case VehicleStatus.Rented: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300';
        case VehicleStatus.Maintenance: return 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300';
        case VehicleStatus.Reserved: return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300';
        default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
};

const DeadlineAlerts: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
    const today = new Date();
    const alertDays = 30;
    const alerts: { vehicle: Vehicle; type: string; daysLeft: number }[] = [];

    vehicles.forEach(v => {
        const checkDate = (dateStr: string, type: string) => {
            if (!dateStr) return;
            const expiryDate = new Date(dateStr);
            expiryDate.setHours(0,0,0,0);
            const todayDateOnly = new Date();
            todayDateOnly.setHours(0,0,0,0);

            const diffTime = expiryDate.getTime() - todayDateOnly.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= alertDays && diffDays >= 0) {
                alerts.push({ vehicle: v, type, daysLeft: diffDays });
            }
        };

        checkDate(v.insuranceExpiry, 'Assurance');
        checkDate(v.nextMaintenance, 'Maintenance');
        checkDate(v.technicalInspectionExpiry, 'Visite Technique');
    });

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full dark:border dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <AlertIcon className="w-6 h-6 mr-2 text-yellow-500" />
                Alertes d'Échéances
            </h2>
            {alerts.length > 0 ? (
                <ul className="space-y-4">
                    {alerts.sort((a,b) => a.daysLeft - b.daysLeft).map((alert, index) => {
                        const isVeryUrgent = alert.daysLeft <= 3;
                        const isUrgent = alert.daysLeft <= 7;
                        const isCritical = (alert.type === 'Assurance' || alert.type === 'Visite Technique') && isUrgent;
                        
                        let icon;
                        let typeColorClass = 'text-yellow-700 dark:text-yellow-300';

                        switch (alert.type) {
                            case 'Assurance':
                                icon = isCritical ? <ExclamationShieldIcon className="w-6 h-6" /> : <ShieldIcon className="w-6 h-6" />;
                                typeColorClass = 'text-blue-700 dark:text-blue-300';
                                break;
                            case 'Maintenance':
                                icon = <CogIcon className="w-6 h-6" />;
                                typeColorClass = 'text-purple-700 dark:text-purple-300';
                                break;
                            case 'Visite Technique':
                                icon = isCritical ? <ExclamationShieldIcon className="w-6 h-6" /> : <ClipboardCheckIcon className="w-6 h-6" />;
                                typeColorClass = 'text-teal-700 dark:text-teal-300';
                                break;
                            default:
                                icon = <AlertIcon className="w-6 h-6" />;
                        }

                        return (
                            <li key={index} className={`flex items-center p-3 rounded-lg border-l-4 transition-all duration-300 ${isVeryUrgent ? 'bg-red-100 border-red-700 animate-pulse dark:bg-red-900/50 dark:border-red-500' : isUrgent ? 'bg-red-50 border-red-500 dark:bg-red-900/30 dark:border-red-600' : 'bg-gray-50 border-yellow-500 dark:bg-gray-700 dark:border-yellow-500'}`}>
                                <div className={`mr-4 ${isVeryUrgent ? 'text-red-700 dark:text-red-300' : isUrgent ? 'text-red-500 dark:text-red-400' : typeColorClass}`}>
                                    {icon}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{alert.vehicle.make} {alert.vehicle.model}</p>
                                    <p className={`text-sm font-medium ${isVeryUrgent ? 'text-red-800 dark:text-red-200' : isUrgent ? 'text-red-700 dark:text-red-300' : typeColorClass}`}>{alert.type}</p>
                                </div>
                                <div className="text-right ml-2">
                                    <p className={`font-bold text-xl ${isVeryUrgent ? 'text-red-800 dark:text-red-200' : isUrgent ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-100'}`}>
                                        {alert.daysLeft}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        jour{alert.daysLeft !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-4">
                    <CheckCircleIcon className="w-12 h-12 text-green-400 mb-2"/>
                    <p className="font-semibold">Tout est en ordre !</p>
                    <p className="text-sm">Aucune échéance imminente.</p>
                </div>
            )}
        </div>
    );
};

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours} h`;
    if (days === 1) return 'hier';
    return `il y a ${days} j`;
};


const RecentActivity: React.FC<{ history: HistoryLog[] }> = ({ history }) => {
    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full dark:border dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-gray-500 dark:text-gray-400" />
                Activité Récente
            </h2>
            {history.length > 0 ? (
                <ul className="space-y-4">
                    {history.slice(0, 10).map(log => (
                        <li key={log.id} className="flex items-start">
                             <div className="mr-3 mt-1">
                                {log.entity === 'vehicle' && <CarIcon className="w-5 h-5 text-gray-400" />}
                                {log.entity === 'client' && <UsersIcon className="w-5 h-5 text-gray-400" />}
                                {log.entity === 'driver' && <SteeringWheelIcon className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-800 dark:text-gray-200">{log.details}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(log.timestamp)}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 py-4">
                    <ClockIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2"/>
                    <p className="font-semibold">Aucune activité récente</p>
                    <p className="text-sm">Les modifications apparaîtront ici.</p>
                </div>
            )}
        </div>
    );
};

interface DashboardProps {
  vehicles: Vehicle[];
  rentals: Rental[];
  clients: Client[];
  drivers: Driver[];
  owners: Owner[];
  affiliates: Affiliate[];
  contraventions: Contravention[];
  history: HistoryLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ vehicles, rentals, clients, drivers, owners, affiliates, contraventions, history }) => {
  const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.Available).length;
  const rentedVehicles = vehicles.filter(v => v.status === VehicleStatus.Rented).length;
  const reservedVehicles = vehicles.filter(v => v.status === VehicleStatus.Reserved).length;
  const inMaintenanceVehicles = vehicles.filter(v => v.status === VehicleStatus.Maintenance).length;
  const unpaidContraventions = contraventions.filter(c => c.status === ContraventionStatus.Unpaid).length;
  
  const totalRevenue = rentals
    .filter(r => r.status === RentalStatus.Completed)
    .reduce((sum, r) => sum + r.price, 0);

  const activeAndReservedRentals = rentals.filter(r => r.status === RentalStatus.Active || r.status === RentalStatus.Reserved).slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Véhicules Totaux" value={vehicles.length} icon={<CarIcon className="w-6 h-6 text-red-600" />} color="bg-red-100 dark:bg-red-500/20" />
        <StatCard title="Disponibles" value={availableVehicles} icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />} color="bg-green-100 dark:bg-green-500/20" />
        <StatCard title="Loués" value={rentedVehicles} icon={<CalendarIcon className="w-6 h-6 text-yellow-600" />} color="bg-yellow-100 dark:bg-yellow-500/20" />
        <StatCard title="Réservés" value={reservedVehicles} icon={<ClockIcon className="w-6 h-6 text-indigo-600" />} color="bg-indigo-100 dark:bg-indigo-500/20" />
        <StatCard title="En Maintenance" value={inMaintenanceVehicles} icon={<CogIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />} color="bg-gray-100 dark:bg-gray-500/20" />
        <StatCard title="Contraventions Non Payées" value={unpaidContraventions} icon={<ExclamationShieldIcon className="w-6 h-6 text-orange-600" />} color="bg-orange-100 dark:bg-orange-500/20" />
        <StatCard title="Clients" value={clients.length} icon={<UsersIcon className="w-6 h-6 text-teal-600" />} color="bg-teal-100 dark:bg-teal-500/20" />
        <StatCard title="Chauffeurs" value={drivers.length} icon={<SteeringWheelIcon className="w-6 h-6 text-purple-600" />} color="bg-purple-100 dark:bg-purple-500/20" />
        <StatCard title="Propriétaires" value={owners.length} icon={<KeyIcon className="w-6 h-6 text-orange-600" />} color="bg-orange-100 dark:bg-orange-500/20" />
        <StatCard title="Partenaires" value={affiliates.length} icon={<BriefcaseIcon className="w-6 h-6 text-cyan-600" />} color="bg-cyan-100 dark:bg-cyan-500/20" />
      </div>
       <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Performance Financière</h2>
            <div className="text-center">
                 <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Revenu Total Brut</p>
                 <p className="text-5xl font-bold text-pink-600 dark:text-pink-400 mt-2">{`${totalRevenue.toLocaleString('fr-FR')} FCFA`}</p>
                 <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Basé sur les locations terminées</p>
            </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-8">
                 <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Locations & Réservations à venir</h2>
                    {activeAndReservedRentals.length > 0 ? (
                        <ul className="space-y-4">
                        {activeAndReservedRentals.map(rental => {
                            const vehicle = vehicles.find(v => v.id === rental.vehicleId);
                            return (
                            <li key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule inconnu'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{rental.customerName}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Retour</p>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{new Date(rental.endDate).toLocaleDateString('fr-FR')}</p>
                                  </div>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${rental.status === RentalStatus.Active ? 'text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300' : 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300'}`}>
                                      {rental.status}
                                  </span>
                                </div>
                            </li>
                            );
                        })}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">Aucune location active ou réservation.</p>
                    )}
                </div>
                 <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Aperçu de la Flotte</h2>
                    {vehicles.slice(0, 5).length > 0 ? (
                        <ul className="space-y-4">
                        {vehicles.slice(0, 5).map(vehicle => (
                            <li key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div className="flex items-center">
                                <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-16 h-10 object-cover rounded-md mr-4" />
                                <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{vehicle.make} {vehicle.model}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.plate}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                {vehicle.status}
                            </span>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">Aucun véhicule dans la flotte.</p>
                    )}
                </div>
                 <div className="lg:col-span-2">
                    <RecentActivity history={history} />
                </div>
            </div>
        </div>

        <div className="lg:col-span-1">
            <DeadlineAlerts vehicles={vehicles} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;