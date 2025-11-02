import React, { useState } from 'react';
import type { Affiliate } from '../types';
import { PlusIcon, BriefcaseIcon, UsersIcon } from './icons';
import Modal from './Modal';

interface AffiliateManagementProps {
  affiliates: Affiliate[];
  addAffiliate: (affiliate: Omit<Affiliate, 'id'>) => void;
  deleteAffiliate: (id: string) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AddAffiliateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  addAffiliate: (affiliate: Omit<Affiliate, 'id'>) => void;
}> = ({ isOpen, onClose, addAffiliate }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState<number | ''>('');
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
    if (!name || !phone || commissionRate === '' || commissionRate < 0) return;
    addAffiliate({ name, phone, commissionRate: Number(commissionRate), imageUrl });
    onClose();
    setName('');
    setPhone('');
    setCommissionRate('');
    setImageUrl(undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouveau partenaire">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom du partenaire</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Taux de commission (%)</label>
          <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(Number(e.target.value))} required min="0" max="100" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Photo</label>
          <input type="file" onChange={handleImageChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
          {imageUrl && <img src={imageUrl} alt="Aperçu" className="mt-2 h-20 w-20 rounded-full object-cover" />}
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

export const AffiliateManagement: React.FC<AffiliateManagementProps> = ({ affiliates, addAffiliate, deleteAffiliate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
      <>
        <div className="flex justify-end items-center mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Ajouter un Partenaire
          </button>
        </div>

        {affiliates.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {affiliates.map(affiliate => (
                            <tr key={affiliate.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center">
                                        {affiliate.imageUrl ? <img className="h-10 w-10 rounded-full object-cover" src={affiliate.imageUrl} alt={affiliate.name} /> : <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"><UsersIcon className="h-6 w-6 text-gray-400"/></div>}
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{affiliate.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{affiliate.commissionRate}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => deleteAffiliate(affiliate.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <BriefcaseIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun partenaire trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un nouveau partenaire.</p>
          </div>
        )}

        <AddAffiliateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addAffiliate={addAffiliate} />
      </>
    );
};