import React, { useState } from 'react';
import type { MaintenanceRecord, Vehicle } from '../types';
import { MaintenanceStatus } from '../types';
import { PlusIcon, CogIcon } from './icons';
import Modal from './Modal';

interface MaintenanceManagementProps {
  maintenanceRecords: MaintenanceRecord[];
  vehicles: Vehicle[];
  addMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => void;
  deleteMaintenance: (id: string) => void;
}

const AddMaintenanceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  addMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
}> = ({ isOpen, onClose, vehicles, addMaintenance }) => {
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState(0);
  const [mileage, setMileage] = useState(0);
  const [partsReplaced, setPartsReplaced] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !date || cost < 0 || mileage <=0) return;
    addMaintenance({ vehicleId, description, date, cost, status: MaintenanceStatus.Todo, mileage, partsReplaced });
    onClose();
    setVehicleId('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCost(0);
    setMileage(0);
    setPartsReplaced('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une tâche de maintenance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Véhicule</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500">
            <option value="" disabled>Sélectionner un véhicule</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} - {v.plate}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Kilométrage</label>
            <input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
          </div>
        </div>
         <div>
            <label className="block text-sm font-medium text-gray-700">Pièces changées (séparées par des virgules)</label>
            <input type="text" value={partsReplaced} onChange={(e) => setPartsReplaced(e.target.value)} placeholder="Filtre à huile, Plaquettes de frein..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Coût (FCFA)</label>
            <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} required min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({ maintenanceRecords, vehicles, addMaintenance, updateMaintenanceStatus, deleteMaintenance }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getStatusColor = (status: MaintenanceStatus) => {
        switch (status) {
            case MaintenanceStatus.Todo: return 'bg-blue-100 text-blue-800';
            case MaintenanceStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
            case MaintenanceStatus.Completed: return 'bg-green-100 text-green-800';
        }
    }

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Atelier & Suivi de Flotte</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Planifier une Maintenance
          </button>
        </div>

        {maintenanceRecords.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pièces Changées</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {maintenanceRecords.map(record => {
                            const vehicle = vehicles.find(v => v.id === record.vehicleId);
                            return (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{vehicle?.plate}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-800">{record.description}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(record.date).toLocaleDateString('fr-FR')} à {record.mileage.toLocaleString('fr-FR')} km
                                        </div>
                                    </td>
                                     <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                        <div className="truncate" title={record.partsReplaced}>
                                            {record.partsReplaced || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{record.cost.toLocaleString('fr-FR')} FCFA</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={record.status}
                                            onChange={(e) => updateMaintenanceStatus(record.id, e.target.value as MaintenanceStatus)}
                                            className={`text-xs font-semibold rounded-full border-none px-3 py-1 ${getStatusColor(record.status)}`}
                                        >
                                            <option value={MaintenanceStatus.Todo}>À faire</option>
                                            <option value={MaintenanceStatus.InProgress}>En cours</option>
                                            <option value={MaintenanceStatus.Completed}>Terminé</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => deleteMaintenance(record.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <CogIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucune tâche de maintenance</h3>
            <p className="mt-1 text-sm text-gray-500">Planifiez une nouvelle maintenance pour commencer.</p>
          </div>
        )}

        <AddMaintenanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} vehicles={vehicles} addMaintenance={addMaintenance} />
      </div>
    );
};