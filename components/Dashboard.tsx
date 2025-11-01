import React from 'react';
import { Vehicle, Rental, VehicleStatus, Client, Driver } from '../types';
import { CarIcon, CalendarIcon, CheckCircleIcon, UsersIcon, SteeringWheelIcon, CashIcon, AlertIcon } from './icons';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
        case VehicleStatus.Available: return 'text-green-600 bg-green-100';
        case VehicleStatus.Rented: return 'text-yellow-600 bg-yellow-100';
        case VehicleStatus.Maintenance: return 'text-red-600 bg-red-100';
        case VehicleStatus.Reserved: return 'text-indigo-600 bg-indigo-100';
        default: return 'text-gray-600 bg-gray-100';
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
            const diffTime = expiryDate.getTime() - today.getTime();
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
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><AlertIcon className="w-6 h-6 mr-2 text-yellow-500" />Alertes d'Échéances</h2>
            {alerts.length > 0 ? (
                <ul className="space-y-3">
                    {alerts.sort((a,b) => a.daysLeft - b.daysLeft).map((alert, index) => (
                        <li key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
                            <div>
                                <p className="font-semibold text-gray-800">{alert.vehicle.make} {alert.vehicle.model} ({alert.vehicle.plate})</p>
                                <p className="text-sm text-yellow-700">{alert.type} expire dans {alert.daysLeft} jour{alert.daysLeft > 1 ? 's' : ''}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-4">Aucune échéance imminente.</p>
            )}
        </div>
    );
};


interface DashboardProps {
  vehicles: Vehicle[];
  rentals: Rental[];
  clients: Client[];
  drivers: Driver[];
}

const Dashboard: React.FC<DashboardProps> = ({ vehicles, rentals, clients, drivers }) => {
  const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.Available).length;
  const rentedVehicles = vehicles.filter(v => v.status === VehicleStatus.Rented).length;
  
  const totalRevenue = rentals
    .filter(r => r.isCompleted)
    .reduce((sum, r) => sum + r.price, 0);

  const activeRentals = rentals.filter(r => !r.isCompleted).slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold text-gray-800">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatCard title="Véhicules Totaux" value={vehicles.length} icon={<CarIcon className="w-6 h-6 text-red-600" />} color="bg-red-100" />
        <StatCard title="Disponibles" value={availableVehicles} icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />} color="bg-green-100" />
        <StatCard title="Loués" value={rentedVehicles} icon={<CalendarIcon className="w-6 h-6 text-yellow-600" />} color="bg-yellow-100" />
        <StatCard title="Clients" value={clients.length} icon={<UsersIcon className="w-6 h-6 text-teal-600" />} color="bg-teal-100" />
        <StatCard title="Chauffeurs" value={drivers.length} icon={<SteeringWheelIcon className="w-6 h-6 text-purple-600" />} color="bg-purple-100" />
        <StatCard title="Revenu Total" value={`${totalRevenue.toLocaleString('fr-FR')} FCFA`} icon={<CashIcon className="w-6 h-6 text-pink-600" />} color="bg-pink-100" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-8">
                 <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Locations Actives Récentes</h2>
                    {activeRentals.length > 0 ? (
                        <ul className="space-y-4">
                        {activeRentals.map(rental => {
                            const vehicle = vehicles.find(v => v.id === rental.vehicleId);
                            return (
                            <li key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div>
                                <p className="font-semibold text-gray-800">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule inconnu'}</p>
                                <p className="text-sm text-gray-500">{rental.customerName}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Retour</p>
                                  <p className="font-medium text-gray-700">{new Date(rental.endDate).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </li>
                            );
                        })}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">Aucune location active.</p>
                    )}
                </div>
                 <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Aperçu de la Flotte</h2>
                    {vehicles.slice(0, 5).length > 0 ? (
                        <ul className="space-y-4">
                        {vehicles.slice(0, 5).map(vehicle => (
                            <li key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                                <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-16 h-10 object-cover rounded-md mr-4" />
                                <div>
                                <p className="font-semibold text-gray-800">{vehicle.make} {vehicle.model}</p>
                                <p className="text-sm text-gray-500">{vehicle.plate}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                {vehicle.status}
                            </span>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">Aucun véhicule dans la flotte.</p>
                    )}
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