import React, { useState } from 'react';
import type { Contravention, Vehicle, Rental, Client } from '../types';
import { ContraventionStatus, RentalStatus } from '../types';
import { PlusIcon, ExclamationShieldIcon, TrashIcon, AlertIcon } from './icons';
import Modal from './Modal';

interface ContraventionManagementProps {
  contraventions: Contravention[];
  vehicles: Vehicle[];
  rentals: Rental[];
  clients: Client[];
  addContravention: (record: Omit<Contravention, 'id'>) => void;
  updateContraventionStatus: (id: string, status: ContraventionStatus) => void;
  deleteContravention: (id: string) => void;
}

const AddContraventionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  rentals: Rental[];
  addContravention: (record: Omit<Contravention, 'id'>) => void;
}> = ({ isOpen, onClose, vehicles, rentals, addContravention }) => {
  const [vehicleId, setVehicleId] = useState('');
  const [rentalId, setRentalId] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(0);

  const activeRentals = rentals.filter(r => r.status !== RentalStatus.Completed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !date || amount <= 0) return;
    addContravention({ vehicleId, rentalId, description, date, amount, status: ContraventionStatus.Unpaid });
    onClose();
    setVehicleId('');
    setRentalId(undefined);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount(0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une contravention">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Véhicule concerné</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
            <option value="" disabled>Sélectionner un véhicule</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} - {v.plate}</option>
            ))}
          </select>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Location associée (Recommandé)</label>
          <select value={rentalId || ''} onChange={(e) => setRentalId(e.target.value || undefined)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
            <option value="">Aucune</option>
            {activeRentals.map(r => (
              <option key={r.id} value={r.id}>{r.customerName} / {vehicles.find(v=>v.id === r.vehicleId)?.plate}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Lier à une location permet d'identifier le client responsable.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description (ex: Excès de vitesse)</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de l'infraction</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Montant (FCFA)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
};

export const ContraventionManagement: React.FC<ContraventionManagementProps> = ({ contraventions, vehicles, rentals, clients, addContravention, updateContraventionStatus, deleteContravention }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<ContraventionStatus | 'all'>('all');
    const [contraventionToDelete, setContraventionToDelete] = useState<Contravention | null>(null);

    const getSelectStatusColor = (status: ContraventionStatus) => {
        switch (status) {
            case ContraventionStatus.Unpaid: return 'bg-red-200 text-red-800 border-red-300';
            case ContraventionStatus.Paid: return 'bg-green-200 text-green-800 border-green-300';
            case ContraventionStatus.Disputed: return 'bg-yellow-200 text-yellow-800 border-yellow-300';
        }
    }
    
    const filteredContraventions = contraventions
        .filter(c => statusFilter === 'all' || c.status === statusFilter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDeleteRequest = (record: Contravention) => {
        setContraventionToDelete(record);
    };

    const handleConfirmDelete = () => {
        if (contraventionToDelete) {
            deleteContravention(contraventionToDelete.id);
            setContraventionToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setContraventionToDelete(null);
    };


    return (
      <>
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filtrer par statut:</label>
                <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ContraventionStatus | 'all')}
                    className="block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                >
                    <option value="all">Tous</option>
                    {Object.values(ContraventionStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2"/>
                Ajouter une Contravention
            </button>
        </div>

        {contraventions.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails de l'infraction</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Responsable</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredContraventions.map(record => {
                            const vehicle = vehicles.find(v => v.id === record.vehicleId);
                            const rental = rentals.find(r => r.id === record.rentalId);
                            const client = rental ? clients.find(c => c.id === rental.clientId) : undefined;
                            return (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</div>
                                        <div className="text-sm text-gray-500">{vehicle?.plate}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-800">{record.description}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(record.date).toLocaleDateString('fr-FR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {client ? client.name : <span className="text-gray-400 italic">Non spécifié</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{record.amount.toLocaleString('fr-FR')} FCFA</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={record.status}
                                            onChange={(e) => updateContraventionStatus(record.id, e.target.value as ContraventionStatus)}
                                            className={`text-xs font-semibold rounded-md border shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 px-2 py-1 transition-colors duration-200 ${getSelectStatusColor(record.status)}`}
                                        >
                                            <option value={ContraventionStatus.Unpaid}>Non payé</option>
                                            <option value={ContraventionStatus.Paid}>Payé</option>
                                            <option value={ContraventionStatus.Disputed}>Contesté</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDeleteRequest(record)} className="text-red-600 hover:text-red-900" title="Supprimer">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <ExclamationShieldIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucune contravention enregistrée</h3>
            <p className="mt-1 text-sm text-gray-500">Ajoutez une nouvelle contravention pour commencer le suivi.</p>
          </div>
        )}

        <AddContraventionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} vehicles={vehicles} rentals={rentals} addContravention={addContravention} />
        
        {contraventionToDelete && (
            <Modal isOpen={!!contraventionToDelete} onClose={handleCancelDelete} title="Confirmer la suppression">
                <div>
                    <div className="flex items-center">
                         <AlertIcon className="w-12 h-12 text-red-500 mr-4"/>
                         <p className="text-gray-700">
                            Êtes-vous sûr de vouloir supprimer la contravention suivante ? Cette action est irréversible.
                         </p>
                    </div>
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                        <p><strong>Description:</strong> {contraventionToDelete.description}</p>
                        <p><strong>Date:</strong> {new Date(contraventionToDelete.date).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Montant:</strong> {contraventionToDelete.amount.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <div className="flex justify-end pt-6 space-x-2">
                        <button type="button" onClick={handleCancelDelete} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Annuler
                        </button>
                        <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                            Confirmer la Suppression
                        </button>
                    </div>
                </div>
            </Modal>
        )}
      </>
    );
};
