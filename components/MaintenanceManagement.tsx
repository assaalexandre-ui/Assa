

import React, { useState, useMemo } from 'react';
import type { MaintenanceRecord, Vehicle, Accident, Rental, Client } from '../types';
import { MaintenanceStatus, AccidentStatus } from '../types';
import { PlusIcon, CogIcon } from './icons';
import Modal from './Modal';

type Tab = 'maintenance' | 'accidents';

interface MaintenanceManagementProps {
  maintenanceRecords: MaintenanceRecord[];
  vehicles: Vehicle[];
  addMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => void;
  deleteMaintenance: (id: string) => void;
  accidents: Accident[];
  rentals: Rental[];
  clients: Client[];
  addAccident: (accident: Omit<Accident, 'id'>) => void;
  updateAccidentStatus: (id: string, status: AccidentStatus) => void;
  deleteAccident: (id: string) => void;
}

const AccidentDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  accident: Accident;
  vehicle?: Vehicle;
  rental?: Rental;
  client?: Client;
}> = ({ isOpen, onClose, accident, vehicle, rental, client }) => {
  if (!accident) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Détails de l'accident du ${new Date(accident.date).toLocaleDateString('fr-FR')}`}>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold text-gray-800 mb-2">Informations Générales</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-gray-500">Véhicule</p>
              <p className="font-medium text-gray-900">{vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Gravité</p>
              <p className="font-medium text-gray-900">{accident.severity}</p>
            </div>
            <div>
              <p className="text-gray-500">Location Associée</p>
              <p className="font-medium text-gray-900">{rental ? `Contrat #${rental.id.substring(0, 5)}...` : 'Aucune'}</p>
            </div>
            <div>
              <p className="text-gray-500">Client</p>
              <p className="font-medium text-gray-900">{client ? client.name : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800">Description</h4>
          <p className="text-sm text-gray-600 p-3 bg-white rounded border">{accident.description}</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Détails Financiers & Réparation</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                    <p className="text-gray-500">Coût Estimé</p>
                    <p className="font-medium text-gray-900">{accident.estimatedCost.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                    <p className="text-gray-500">Coût Final</p>
                    <p className="font-bold text-gray-900">{accident.finalCost ? `${accident.finalCost.toLocaleString('fr-FR')} FCFA` : 'Non défini'}</p>
                </div>
                 <div>
                    <p className="text-gray-500">N° Dossier Assurance</p>
                    <p className="font-mono text-xs text-gray-900">{accident.insuranceClaimId || 'N/A'}</p>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold text-gray-800">Pièces Réparées</h4>
                <p className="text-sm text-gray-600 p-3 bg-white rounded border min-h-[50px]">{accident.repairedParts || 'Aucune'}</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-800">Pièces Remplacées</h4>
                <p className="text-sm text-gray-600 p-3 bg-white rounded border min-h-[50px]">{accident.replacedParts || 'Aucune'}</p>
            </div>
        </div>

      </div>
    </Modal>
  );
};

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
  const [garage, setGarage] = useState('');

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === vehicleId), [vehicles, vehicleId]);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVehicleId = e.target.value;
    setVehicleId(newVehicleId);
    const vehicle = vehicles.find(v => v.id === newVehicleId);
    if (vehicle) {
        setMileage(vehicle.currentMileage);
    } else {
        setMileage(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !date || cost < 0 || mileage <=0) return;
    addMaintenance({ vehicleId, description, date, cost, status: MaintenanceStatus.Todo, mileage, partsReplaced, garage });
    onClose();
    setVehicleId('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCost(0);
    setMileage(0);
    setPartsReplaced('');
    setGarage('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une tâche de maintenance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Véhicule</label>
          <select value={vehicleId} onChange={handleVehicleChange} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Garage / Mécanicien</label>
          <input type="text" value={garage} onChange={(e) => setGarage(e.target.value)} placeholder="Nom du prestataire" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Kilométrage</label>
            <input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
             {selectedVehicle && (
                <p className="text-xs text-gray-500 mt-1">
                    Actuel : {selectedVehicle.currentMileage.toLocaleString('fr-FR')} km.
                </p>
            )}
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
  const [mileage, setMileage] = useState(0);

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === vehicleId), [vehicles, vehicleId]);
  
  const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVehicleId = e.target.value;
    setVehicleId(newVehicleId);
    const vehicle = vehicles.find(v => v.id === newVehicleId);
    if (vehicle) {
        setMileage(vehicle.currentMileage);
    }
  };

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
      replacedParts,
      mileage,
    });
    onClose();
    // Reset form
    setVehicleId(''); setRentalId(undefined); setDate(new Date().toISOString().split('T')[0]);
    setDescription(''); setSeverity('Léger'); setEstimatedCost(0);
    setRepairedParts(''); setReplacedParts(''); setMileage(0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Déclarer un nouvel accident">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Véhicule</label>
              <select value={vehicleId} onChange={handleVehicleSelect} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Kilométrage au moment du sinistre/réparation</label>
          <input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} required min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
          {selectedVehicle && (
            <p className="text-xs text-gray-500 mt-1">
                Actuel : {selectedVehicle.currentMileage.toLocaleString('fr-FR')} km.
            </p>
          )}
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Pièces réparées (séparées par des virgules)</label><input type="text" value={repairedParts} onChange={(e) => setRepairedParts(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
        <div><label className="block text-sm font-medium text-gray-700">Pièces changées (séparées par des virgules)</label><input type="text" value={replacedParts} onChange={(e) => setReplacedParts(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
        <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Déclarer</button></div>
      </form>
    </Modal>
  );
};


export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({ maintenanceRecords, vehicles, addMaintenance, updateMaintenanceStatus, deleteMaintenance, accidents, rentals, clients, addAccident, updateAccidentStatus, deleteAccident }) => {
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isAccidentModalOpen, setIsAccidentModalOpen] = useState(false);
    const [isAccidentDetailModalOpen, setIsAccidentDetailModalOpen] = useState(false);
    const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('maintenance');
    
    const handleViewAccidentDetails = (accident: Accident) => {
        setSelectedAccident(accident);
        setIsAccidentDetailModalOpen(true);
    };

    const TabButton: React.FC<{tab: Tab, label: string}> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    const getMaintenanceSelectColor = (status: MaintenanceStatus) => {
        switch (status) {
            case MaintenanceStatus.Todo: return 'bg-blue-200 text-blue-800 border-blue-300';
            case MaintenanceStatus.InProgress: return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            case MaintenanceStatus.Completed: return 'bg-green-200 text-green-800 border-green-300';
        }
    };
    
    const getAccidentSelectColor = (status: AccidentStatus) => {
        switch (status) {
            case AccidentStatus.Pending: return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            case AccidentStatus.InProgress: return 'bg-blue-200 text-blue-800 border-blue-300';
            case AccidentStatus.Repaired: return 'bg-green-200 text-green-800 border-green-300';
            case AccidentStatus.Closed: return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    };

    const renderContent = () => {
        if (activeTab === 'maintenance') {
            return (
                <>
                {maintenanceRecords.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intervenant</th>
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
                                             <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="font-medium" title={record.garage}>
                                                    {record.garage || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{record.cost.toLocaleString('fr-FR')} FCFA</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={record.status}
                                                    onChange={(e) => updateMaintenanceStatus(record.id, e.target.value as MaintenanceStatus)}
                                                    className={`text-xs font-semibold rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 px-2 py-1 transition-colors duration-200 ${getMaintenanceSelectColor(record.status)}`}
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
                </>
            );
        }

        if (activeTab === 'accidents') {
            return (
                 <>
                {accidents.length > 0 ? (
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
                                        <tr key={accident.id} onClick={() => handleViewAccidentDetails(accident)} className="cursor-pointer hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(accident.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700 max-w-sm truncate" title={accident.description}>{accident.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{accident.estimatedCost.toLocaleString('fr-FR')} FCFA</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select onClick={(e) => e.stopPropagation()} value={accident.status} onChange={(e) => updateAccidentStatus(accident.id, e.target.value as AccidentStatus)} className={`text-xs font-semibold rounded-md border shadow-sm px-2 py-1 ${getAccidentSelectColor(accident.status)}`}>
                                                    {Object.values(AccidentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={(e) => { e.stopPropagation(); deleteAccident(accident.id);}} className="text-red-600 hover:text-red-800">Supprimer</button></td>
                                        </tr>
                                    );
                               })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <CogIcon className="w-16 h-16 mx-auto text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun accident déclaré</h3>
                        <p className="mt-1 text-sm text-gray-500">Utilisez le bouton ci-dessus pour déclarer un nouvel accident.</p>
                    </div>
                )}
                </>
            );
        }
        return null;
    }


    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Atelier & Sinistres</h1>
          {activeTab === 'maintenance' ? (
                <button
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Planifier une Maintenance
                </button>
           ) : (
                <button
                    onClick={() => setIsAccidentModalOpen(true)}
                    className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Déclarer un Accident
                </button>
           )}
        </div>
        
        <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-2">
                <TabButton tab="maintenance" label="Maintenances" />
                <TabButton tab="accidents" label="Accidents" />
            </nav>
        </div>

        <div>
            {renderContent()}
        </div>

        <AddMaintenanceModal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} vehicles={vehicles} addMaintenance={addMaintenance} />
        <AddAccidentModal isOpen={isAccidentModalOpen} onClose={() => setIsAccidentModalOpen(false)} vehicles={vehicles} rentals={rentals} addAccident={addAccident} />
        {isAccidentDetailModalOpen && selectedAccident && (
            <AccidentDetailModal
                isOpen={isAccidentDetailModalOpen}
                onClose={() => {
                    setIsAccidentDetailModalOpen(false);
                    setSelectedAccident(null);
                }}
                accident={selectedAccident}
                vehicle={vehicles.find(v => v.id === selectedAccident.vehicleId)}
                rental={rentals.find(r => r.id === selectedAccident.rentalId)}
                client={clients.find(c => c.id === rentals.find(r => r.id === selectedAccident.rentalId)?.clientId)}
            />
        )}
      </div>
    );
};