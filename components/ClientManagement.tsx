import React, { useState } from 'react';
import type { Client } from '../types';
import { PlusIcon, UsersIcon } from './icons';
import Modal from './Modal';

interface ClientManagementProps {
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => void;
  deleteClient: (id: string) => void;
}

const AddClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  addClient: (client: Omit<Client, 'id'>) => void;
}> = ({ isOpen, onClose, addClient }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = "Le nom est requis.";
    if (!phone.trim()) {
        newErrors.phone = "Le téléphone est requis.";
    } else if (!/^\+?\d{7,}$/.test(phone.replace(/\s/g, ''))) {
        newErrors.phone = "Le format du téléphone est invalide.";
    }
    if (!email.trim()) {
        newErrors.email = "L'email est requis.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Le format de l'email est invalide.";
    }
    if (!licenseNumber.trim()) newErrors.licenseNumber = "Le numéro de permis est requis.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
        addClient({ name, phone, email, licenseNumber });
        onClose();
        setName('');
        setPhone('');
        setEmail('');
        setLicenseNumber('');
        setErrors({});
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouveau client">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom complet</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.name ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.phone ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && <p id="phone-error" className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.email ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro de Permis</label>
          <input 
            type="text" 
            value={licenseNumber} 
            onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())} 
            className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.licenseNumber ? 'border-red-500' : ''}`}
            aria-invalid={!!errors.licenseNumber}
            aria-describedby={errors.licenseNumber ? 'license-error' : undefined}
          />
          {errors.licenseNumber && <p id="license-error" className="mt-1 text-xs text-red-600">{errors.licenseNumber}</p>}
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, addClient, deleteClient }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gestion des Clients</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Ajouter un Client
          </button>
        </div>

        {clients.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permis</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clients.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{client.phone}</div>
                                    <div className="text-sm text-gray-500">{client.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{client.licenseNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => deleteClient(client.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <UsersIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun client trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un nouveau client.</p>
          </div>
        )}

        <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addClient={addClient} />
      </div>
    );
};