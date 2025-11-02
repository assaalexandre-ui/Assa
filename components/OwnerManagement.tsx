import React, { useState } from 'react';
import type { Owner } from '../types';
import { PlusIcon, KeyIcon, UsersIcon } from './icons';
import Modal from './Modal';

interface OwnerManagementProps {
  owners: Owner[];
  addOwner: (owner: Omit<Owner, 'id'>) => void;
  deleteOwner: (id: string) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AddOwnerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  addOwner: (owner: Omit<Owner, 'id'>) => void;
}> = ({ isOpen, onClose, addOwner }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setImageUrl(base64);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) return;
    addOwner({ name, phone, email, paymentDetails, imageUrl });
    onClose();
    setName('');
    setPhone('');
    setEmail('');
    setPaymentDetails('');
    setImageUrl(undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouveau propriétaire">
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
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Photo</label>
          <input type="file" onChange={handleImageChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
          {imageUrl && <img src={imageUrl} alt="Aperçu" className="mt-2 h-20 w-20 rounded-full object-cover" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Détails de paiement (RIB, etc.)</label>
          <textarea value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"></textarea>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

export const OwnerManagement: React.FC<OwnerManagementProps> = ({ owners, addOwner, deleteOwner }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gestion des Propriétaires</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Ajouter un Propriétaire
          </button>
        </div>

        {owners.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {owners.map(owner => (
                            <tr key={owner.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {owner.imageUrl ? <img className="h-10 w-10 rounded-full object-cover" src={owner.imageUrl} alt={owner.name} /> : <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"><UsersIcon className="h-6 w-6 text-gray-400"/></div>}
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{owner.phone}</div>
                                    <div className="text-sm text-gray-500">{owner.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{owner.paymentDetails}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => deleteOwner(owner.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <KeyIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun propriétaire trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un nouveau propriétaire.</p>
          </div>
        )}

        <AddOwnerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addOwner={addOwner} />
      </div>
    );
};