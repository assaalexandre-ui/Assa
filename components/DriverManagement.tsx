import React, { useState } from 'react';
import type { Driver } from '../types';
import { PlusIcon, SteeringWheelIcon } from './icons';
import Modal from './Modal';

interface DriverManagementProps {
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id' | 'isAvailable'>) => void;
  deleteDriver: (id: string) => void;
  updateDriverAvailability: (id: string, isAvailable: boolean) => void;
}

const AddDriverModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  addDriver: (driver: Omit<Driver, 'id' | 'isAvailable'>) => void;
}> = ({ isOpen, onClose, addDriver }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !licenseNumber) return;
    addDriver({ name, phone, licenseNumber });
    onClose();
    setName('');
    setPhone('');
    setLicenseNumber('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouveau chauffeur">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom complet</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro de Permis</label>
          <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

export const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, addDriver, deleteDriver, updateDriverAvailability }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
      <>
        <div className="flex justify-end items-center mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Ajouter un Chauffeur
          </button>
        </div>

        {drivers.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {drivers.map(driver => (
                            <tr key={driver.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                    <div className="text-sm text-gray-500">{driver.licenseNumber}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{driver.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ driver.isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {driver.isAvailable ? 'Disponible' : 'En mission'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => deleteDriver(driver.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <SteeringWheelIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun chauffeur trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un nouveau chauffeur.</p>
          </div>
        )}

        <AddDriverModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addDriver={addDriver} />
      </>
    );
};