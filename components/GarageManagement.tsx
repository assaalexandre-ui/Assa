
import React, { useState, useMemo } from 'react';
import type { Accident, MaintenanceRecord, Vehicle, Rental, Client } from '../types';
import { AccidentStatus, MaintenanceStatus } from '../types';
import { PlusIcon, CogIcon } from './icons';
import Modal from './Modal';

type Tab = 'accidents' | 'repairs';

interface GarageManagementProps {
  accidents: Accident[];
  maintenanceRecords: MaintenanceRecord[];
  vehicles: Vehicle[];
  rentals: Rental[];
  clients: Client[];
  addAccident: (accident: Omit<Accident, 'id'>) => void;
  updateAccidentStatus: (id: string, status: AccidentStatus) => void;
  deleteAccident: (id: string) => void;
}

const AddAccidentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  rentals: Rental[];
  addAccident: (accident: Omit<Accident, 'id'>) => void;
}> = ({ isOpen, onClose, vehicles, rentals, addAccident }) => {
  const [vehicleId, setVehicleId] = useState('');
  const [rentalId, setRentalId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Léger' | 'Modéré' | 'Grave'>('Léger');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [repairedParts, setRepairedParts] = useState('');
  const [replacedParts, setReplacedParts] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !date || estimatedCost < 0) return;
    addAccident({
      vehicleId,
      rentalId,
      date,
      description,
      severity,
      estimatedCost,
      status: AccidentStatus.Pending,
      repairedParts,
      replacedParts
    });
    onClose();
    // Reset form
    setVehicleId(''); setRentalId(undefined); setDate(new Date().toISOString().split('T')[0]);
    setDescription(''); setSeverity('Léger'); setEstimatedCost(0);
    setRepairedParts(''); setReplacedParts('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Déclarer un nouvel accident">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Véhicule</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                <option value="" disabled>Sélectionner...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{`${v.make} ${v.model} (${v.plate})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location liée (Optionnel)</label>
              <select value={rentalId || ''} onChange={(e) => setRentalId(e.target.value || undefined)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                <option value="">Aucune</option>
                {rentals.map(r => <option key={r.id} value={r.id}>{`${r.customerName} - ${new Date(r.startDate).toLocaleDateString()}`}</option>)}
              </select>
            </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"></textarea></div>
        <div className="grid grid-cols-3 gap-4">
             <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
            <div><label className="block text-sm font-medium text-gray-700">Gravité</label><select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"><option>Léger</option><option>Modéré</option><option>Grave</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700">Coût estimé (FCFA)</label><input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(Number(e.target.value))} required min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Pièces réparées (séparées par des virgules)</label><input type="text" value={repairedParts} onChange={(e) => setRepairedParts(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
        <div><label className="block text-sm font-medium text-gray-700">Pièces changées (séparées par des virgules)</label><input type="text" value={replacedParts} onChange={(e) => setReplacedParts(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
        <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Déclarer</button></div>
      </form>
    </Modal>
  );
};

export const GarageManagement: React.FC<GarageManagementProps> = ({ accidents, maintenanceRecords, vehicles, rentals, clients, addAccident, updateAccidentStatus, deleteAccident }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('accidents');
    
    const TabButton: React.FC<{tab: Tab, label: string}> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    const getAccidentStatusColor = (status: AccidentStatus) => {
        switch (status) {
            case AccidentStatus.Pending: return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            case AccidentStatus.InProgress: return 'bg-blue-200 text-blue-800 border-blue-300';
            case AccidentStatus.Repaired: return 'bg-green-200 text-green-800 border-green-300';
            case AccidentStatus.Closed: return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    };
    
    const getMaintenanceStatusColor = (status: MaintenanceStatus) => {
        switch (status) {
            case MaintenanceStatus.Todo: return 'bg-blue-100 text-blue-800';
            case MaintenanceStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
            case MaintenanceStatus.Completed: return 'bg-green-100 text-green-800';
        }
    };

    const renderContent = () => {
        if (activeTab === 'accidents') {
            return (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                             <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {accidents.map(accident => {
                                const vehicle = vehicles.find(v => v.id === accident.vehicleId);
                                return (
                                    <tr key={accident.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(accident.date).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-sm truncate" title={accident.description}>{accident.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{accident.estimatedCost.toLocaleString('fr-FR')} FCFA</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select value={accident.status} onChange={(e) => updateAccidentStatus(accident.id, e.target.value as AccidentStatus)} className={`text-xs font-semibold rounded-md border shadow-sm px-2 py-1 ${getAccidentStatusColor(accident.status)}`}>
                                                {Object.values(AccidentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => deleteAccident(accident.id)} className="text-red-600 hover:text-red-800">Supprimer</button></td>
                                    </tr>
                                );
                           })}
                        </tbody>
                    </table>
                     {accidents.length === 0 && <p className="text-center text-gray-500 py-8">Aucun accident déclaré.</p>}
                </div>
            );
        }
        if (activeTab === 'repairs') {
            return (
                 <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {maintenanceRecords.map(record => {
                                const vehicle = vehicles.find(v => v.id === record.vehicleId);
                                return (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{record.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(record.date).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.cost.toLocaleString('fr-FR')} FCFA</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMaintenanceStatusColor(record.status)}`}>{record.status}</span></td>
                                    </tr>
                                );
                           })}
                        </tbody>
                    </table>
                    {maintenanceRecords.length === 0 && <p className="text-center text-gray-500 py-8">Aucun historique de réparation.</p>}
                </div>
            )
        }
        return null;
    }

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Département Garage</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Déclarer un Accident
          </button>
        </div>

        <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-2">
                <TabButton tab="accidents" label="Gestion des Accidents" />
                <TabButton tab="repairs" label="Historique des Réparations" />
            </nav>
        </div>

        <div>
            {renderContent()}
        </div>

        <AddAccidentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} vehicles={vehicles} rentals={rentals} addAccident={addAccident} />
      </div>
    );
};
