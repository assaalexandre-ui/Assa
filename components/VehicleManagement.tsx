import React, { useState } from 'react';
import type { Vehicle, Rental, MaintenanceRecord } from '../types';
import { VehicleStatus } from '../types';
import { PlusIcon, CarIcon, SearchIcon, CheckCircleIcon } from './icons';
import Modal from './Modal';

interface VehicleManagementProps {
  vehicles: Vehicle[];
  rentals: Rental[];
  maintenanceRecords: MaintenanceRecord[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  deleteVehicle: (id: string) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};


const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
        case VehicleStatus.Available: return 'text-green-700 bg-green-100';
        case VehicleStatus.Rented: return 'text-yellow-700 bg-yellow-100';
        case VehicleStatus.Maintenance: return 'text-red-700 bg-red-100';
        case VehicleStatus.Reserved: return 'text-indigo-700 bg-indigo-100';
    }
};

const VehicleDetailModal: React.FC<{
    vehicle: Vehicle;
    rentals: Rental[];
    maintenance: MaintenanceRecord[];
    onClose: () => void;
}> = ({ vehicle, rentals, maintenance, onClose }) => {
    const vehicleRentals = rentals.filter(r => r.vehicleId === vehicle.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const vehicleMaintenance = maintenance.filter(m => m.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
        <Modal isOpen={!!vehicle} onClose={onClose} title={`${vehicle.make} ${vehicle.model}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-48 object-cover rounded-lg shadow-md"/>
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800">Informations Clés</h4>
                        <p><strong>Plaque:</strong> <span className="font-mono">{vehicle.plate}</span></p>
                        <p><strong>Année:</strong> {vehicle.year}</p>
                        <p><strong>Kilométrage:</strong> {vehicle.currentMileage.toLocaleString('fr-FR')} km</p>
                        <p><strong>Statut:</strong> <span className={`font-semibold ${getStatusColor(vehicle.status).split(' ')[0]}`}>{vehicle.status}</span></p>
                    </div>
                     <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800">Échéances</h4>
                        <p><strong>Assurance:</strong> {new Date(vehicle.insuranceExpiry).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Visite Technique:</strong> {new Date(vehicle.technicalInspectionExpiry).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Proch. Maintenance:</strong> {new Date(vehicle.nextMaintenance).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
                <div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Historique des Locations</h4>
                        {vehicleRentals.length > 0 ? (
                            <ul className="space-y-2 max-h-40 overflow-y-auto">
                                {vehicleRentals.map(r => (
                                    <li key={r.id} className="text-sm p-2 bg-gray-100 rounded">
                                        {r.customerName} - {new Date(r.startDate).toLocaleDateString('fr-FR')} au {new Date(r.endDate).toLocaleDateString('fr-FR')}
                                        {r.isCompleted && <CheckCircleIcon className="w-4 h-4 text-green-500 inline ml-2" />}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">Aucune location enregistrée.</p>}
                    </div>
                    <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Historique des Maintenances</h4>
                         {vehicleMaintenance.length > 0 ? (
                            <ul className="space-y-2 max-h-40 overflow-y-auto">
                                {vehicleMaintenance.map(m => (
                                    <li key={m.id} className="text-sm p-2 bg-gray-100 rounded">
                                        {new Date(m.date).toLocaleDateString('fr-FR')} - {m.description} ({m.cost.toLocaleString('fr-FR')} FCFA)
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">Aucune maintenance enregistrée.</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};


const VehicleCard: React.FC<{
    vehicle: Vehicle;
    onSelect: () => void;
    updateVehicleStatus: (id: string, status: VehicleStatus) => void;
    deleteVehicle: (id: string) => void;
}> = ({ vehicle, onSelect, updateVehicleStatus, deleteVehicle }) => {
    const isRented = vehicle.status === VehicleStatus.Rented;
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <button onClick={onSelect} className="w-full block text-left focus:outline-none focus:ring-2 focus:ring-red-500">
              <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-40 object-cover"/>
            </button>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <button onClick={onSelect} className="text-left">
                        <h3 className="text-lg font-bold text-gray-800">{vehicle.make} {vehicle.model}</h3>
                        <p className="text-sm text-gray-500">{vehicle.year}</p>
                    </button>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                    </span>
                </div>
                <p className="mt-2 text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block">{vehicle.plate}</p>
                
                <div className="mt-3 text-xs text-gray-500 space-y-1 border-t pt-2">
                    <p>Assurance: <span className="font-medium text-gray-700">{new Date(vehicle.insuranceExpiry).toLocaleDateString('fr-FR')}</span></p>
                    <p>Visite Tech.: <span className="font-medium text-gray-700">{new Date(vehicle.technicalInspectionExpiry).toLocaleDateString('fr-FR')}</span></p>
                    <p>Kilométrage: <span className="font-medium text-gray-700">{vehicle.currentMileage.toLocaleString('fr-FR')} km</span></p>
                </div>
                
                <div className="mt-auto pt-4 flex space-x-2">
                    <select
                        value={vehicle.status}
                        onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value as VehicleStatus)}
                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 disabled:bg-gray-200"
                        disabled={isRented}
                    >
                        <option value={VehicleStatus.Available}>Disponible</option>
                        <option value={VehicleStatus.Maintenance}>En Maintenance</option>
                        <option value={VehicleStatus.Reserved}>Réservé</option>
                        <option value={VehicleStatus.Rented} disabled>Loué</option>
                    </select>
                    <button onClick={() => deleteVehicle(vehicle.id)} disabled={isRented} className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-red-300">
                        Suppr.
                    </button>
                </div>
                 {isRented && <p className="text-xs text-red-500 mt-2">Le statut ne peut être modifié pour un véhicule loué.</p>}
            </div>
        </div>
    );
};

const AddVehicleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
}> = ({ isOpen, onClose, addVehicle }) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [plate, setPlate] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [nextMaintenance, setNextMaintenance] = useState('');
  const [technicalInspectionExpiry, setTechnicalInspectionExpiry] = useState('');
  const [currentMileage, setCurrentMileage] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setImageUrl(base64);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !plate || !year || !insuranceExpiry || !nextMaintenance || !technicalInspectionExpiry || !imageUrl) return;
    addVehicle({ make, model, year, plate, status: VehicleStatus.Available, insuranceExpiry, nextMaintenance, technicalInspectionExpiry, currentMileage, imageUrl });
    onClose();
    // Reset form
    setMake(''); setModel(''); setYear(new Date().getFullYear()); setPlate(''); setInsuranceExpiry(''); setNextMaintenance(''); setTechnicalInspectionExpiry(''); setCurrentMileage(0); setImageUrl('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouveau véhicule">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Marque</label><input type="text" value={make} onChange={(e) => setMake(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Modèle</label><input type="text" value={model} onChange={(e) => setModel(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Année</label><input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} required min="1990" max={new Date().getFullYear() + 1} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Plaque</label><input type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Kilométrage</label><input type="number" value={currentMileage} onChange={(e) => setCurrentMileage(Number(e.target.value))} required min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">Expiration Assurance</label><input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
            <div><label className="block text-sm font-medium text-gray-700">Visite Technique</label><input type="date" value={technicalInspectionExpiry} onChange={(e) => setTechnicalInspectionExpiry(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
        </div>
         <div><label className="block text-sm font-medium text-gray-700">Prochaine Maintenance</label><input type="date" value={nextMaintenance} onChange={(e) => setNextMaintenance(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Photo du véhicule</label>
            <input type="file" onChange={handleImageChange} accept="image/*" required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
            {imageUrl && <img src={imageUrl} alt="Aperçu" className="mt-2 h-20 rounded-md" />}
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

export const VehicleManagement: React.FC<VehicleManagementProps> = ({ vehicles, rentals, maintenanceRecords, addVehicle, updateVehicleStatus, deleteVehicle }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
    const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

    // FIX: Explicitly convert years to numbers for sorting to avoid type errors when data is loaded from localStorage as strings.
    const availableYears = [...new Set(vehicles.map(v => v.year))].sort((a, b) => Number(b) - Number(a));

    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesSearch = vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
        const matchesYear = yearFilter === 'all' || vehicle.year === yearFilter;

        return matchesSearch && matchesStatus && matchesYear;
    });
    
    const handleSelectVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedVehicle(null);
    };

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Gestion des Véhicules</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Ajouter un Véhicule
          </button>
        </div>

        <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">Recherche</label>
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            id="search"
                            type="text"
                            placeholder="Marque, modèle..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'all')}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    >
                        <option value="all">Tous les statuts</option>
                        {Object.values(VehicleStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700">Année</label>
                    <select
                        id="year-filter"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    >
                        <option value="all">Toutes les années</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={() => handleSelectVehicle(vehicle)} updateVehicleStatus={updateVehicleStatus} deleteVehicle={deleteVehicle} />
            ))}
        </div>
        
        {vehicles.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <CarIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun véhicule trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un nouveau véhicule à votre flotte.</p>
          </div>
        )}

        {vehicles.length > 0 && filteredVehicles.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md col-span-full">
            <SearchIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun véhicule ne correspond à votre recherche</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez de modifier vos termes de recherche.</p>
          </div>
        )}
        
        <AddVehicleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addVehicle={addVehicle} />
        {isDetailModalOpen && selectedVehicle && <VehicleDetailModal vehicle={selectedVehicle} rentals={rentals} maintenance={maintenanceRecords} onClose={handleCloseDetailModal} />}
      </div>
    );
};