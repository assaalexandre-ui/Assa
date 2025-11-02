import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Rental, HistoryLog } from '../types';
import { RentalStatus } from '../types';
import { PlusIcon, UsersIcon, PencilIcon, TrashIcon, StarIcon, CheckCircleIcon } from './icons';
import Modal from './Modal';

interface ClientManagementProps {
  clients: Client[];
  rentals: Rental[];
  history: HistoryLog[];
  addClient: (client: Omit<Client, 'id'>) => void;
  editClient: (client: Client) => void;
  deleteClient: (id: string) => void;
}

interface ClientWithStats extends Client {
    rentalCount: number;
    totalSpent: number;
    loyaltyStatus: 'Nouveau' | 'Fidèle' | 'VIP';
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const getLoyaltyStatus = (rentalCount: number, totalSpent: number): ClientWithStats['loyaltyStatus'] => {
    if (rentalCount > 5 || totalSpent > 500000) return 'VIP';
    if (rentalCount >= 3 || totalSpent > 200000) return 'Fidèle';
    return 'Nouveau';
};

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours} h`;
    if (days === 1) return 'hier';
    return `il y a ${days} j`;
};

const ClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'> | Client) => void;
  clientToEdit: Client | null;
}> = ({ isOpen, onClose, onSave, clientToEdit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setPhone(clientToEdit.phone);
      setEmail(clientToEdit.email);
      setLicenseNumber(clientToEdit.licenseNumber);
      setNotes(clientToEdit.notes || '');
      setImageUrl(clientToEdit.imageUrl);
      setIdDocumentUrl(clientToEdit.idDocumentUrl);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setLicenseNumber('');
      setNotes('');
      setImageUrl(undefined);
      setIdDocumentUrl(undefined);
    }
     setErrors({});
  }, [clientToEdit, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      if (type === 'profile') setImageUrl(base64);
      else setIdDocumentUrl(base64);
    }
  };

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
        const clientData = { name, phone, email, licenseNumber, notes, imageUrl, idDocumentUrl };
        if(clientToEdit) {
            onSave({ ...clientData, id: clientToEdit.id });
        } else {
            onSave(clientData);
        }
        onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={clientToEdit ? "Modifier le client" : "Ajouter un nouveau client"}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom complet</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.name ? 'border-red-500' : ''}`} aria-invalid={!!errors.name} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.phone ? 'border-red-500' : ''}`} aria-invalid={!!errors.phone} />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.email ? 'border-red-500' : ''}`} aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Numéro de Permis</label>
              <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.licenseNumber ? 'border-red-500' : ''}`} aria-invalid={!!errors.licenseNumber} />
              {errors.licenseNumber && <p className="mt-1 text-xs text-red-600">{errors.licenseNumber}</p>}
            </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Photo de profil</label>
          <input type="file" onChange={(e) => handleImageChange(e, 'profile')} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
          {imageUrl && <img src={imageUrl} alt="Aperçu" className="mt-2 h-20 rounded-md" />}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Pièce d'identité</label>
          <input type="file" onChange={(e) => handleImageChange(e, 'id')} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
          {idDocumentUrl && <img src={idDocumentUrl} alt="Aperçu" className="mt-2 h-20 rounded-md" />}
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Notes Internes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"></textarea>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">{clientToEdit ? "Mettre à jour" : "Ajouter"}</button>
        </div>
      </form>
    </Modal>
  );
};

const LoyaltyBadge: React.FC<{ status: ClientWithStats['loyaltyStatus'] }> = ({ status }) => {
    const styles = {
        Nouveau: 'bg-blue-100 text-blue-800',
        Fidèle: 'bg-green-100 text-green-800',
        VIP: 'bg-yellow-100 text-yellow-800', // Gold-like
    };
    
    const icons = {
        Nouveau: null,
        Fidèle: <StarIcon className="w-4 h-4 mr-1.5" />,
        VIP: <StarIcon className="w-4 h-4 mr-1.5" solid />,
    };

    return (
        <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>
            {icons[status]}
            {status}
        </span>
    );
};

const ClientDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: ClientWithStats;
  clientRentals: Rental[];
  clientHistory: HistoryLog[];
}> = ({ isOpen, onClose, client, clientRentals, clientHistory }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Détails pour ${client.name}`}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
            {client.imageUrl && <img src={client.imageUrl} alt={client.name} className="w-24 h-24 rounded-full object-cover" />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg flex-grow">
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium text-gray-800">{client.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{client.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Permis n°</p>
                <p className="font-mono text-gray-800">{client.licenseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut Fidélité</p>
                <LoyaltyBadge status={client.loyaltyStatus} />
              </div>
            </div>
        </div>
         {client.notes && (
            <div>
              <p className="text-sm font-medium text-gray-600">Notes</p>
              <p className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200">{client.notes}</p>
            </div>
          )}
        {client.idDocumentUrl && (
             <div>
                 <h4 className="font-semibold text-gray-800 mb-2">Pièce d'identité</h4>
                 <img src={client.idDocumentUrl} alt="Pièce d'identité" className="max-w-xs rounded-lg shadow-md" />
             </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Historique des locations ({clientRentals.length})</h4>
          {clientRentals.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-md">
              {clientRentals.map(r => (
                <li key={r.id} className="text-sm p-2 bg-gray-100 rounded">
                  Du {new Date(r.startDate).toLocaleDateString('fr-FR')} au {new Date(r.endDate).toLocaleDateString('fr-FR')} - {r.price.toLocaleString('fr-FR')} FCFA
                  {r.status === RentalStatus.Completed && <CheckCircleIcon className="w-4 h-4 text-green-500 inline ml-2" />}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500">Aucune location enregistrée.</p>}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Historique des Modifications</h4>
          {clientHistory.length > 0 ? (
            <ul className="space-y-3 max-h-40 overflow-y-auto border p-2 rounded-md">
              {clientHistory.map(log => (
                <li key={log.id} className="text-sm">
                  <p className="text-gray-800">{log.details}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(log.timestamp)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500">Aucune modification enregistrée.</p>}
        </div>
      </div>
    </Modal>
  );
};

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, rentals, history, addClient, editClient, deleteClient }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);

    const clientsWithStats: ClientWithStats[] = useMemo(() => {
        return clients.map(client => {
            const clientRentals = rentals.filter(r => r.clientId === client.id);
            const rentalCount = clientRentals.length;
            const totalSpent = clientRentals.reduce((sum, r) => sum + r.price, 0);
            const loyaltyStatus = getLoyaltyStatus(rentalCount, totalSpent);
            return { ...client, rentalCount, totalSpent, loyaltyStatus };
        });
    }, [clients, rentals]);
    
    const handleAddClick = () => {
        setClientToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (client: Client) => {
        setClientToEdit(client);
        setIsModalOpen(true);
    };
    
    const handleViewDetails = (client: ClientWithStats) => {
        setSelectedClient(client);
        setIsDetailModalOpen(true);
    };

    const handleSaveClient = (clientData: Omit<Client, 'id'> | Client) => {
        if ('id' in clientData) {
            editClient(clientData as Client);
        } else {
            addClient(clientData as Omit<Client, 'id'>);
        }
    };

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gestion des Clients & CRM</h1>
          <button
            onClick={handleAddClick}
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistiques</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut Fidélité</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clientsWithStats.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => handleViewDetails(client)} className="text-left group flex items-center space-x-3">
                                      {client.imageUrl ? <img src={client.imageUrl} alt={client.name} className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><UsersIcon className="w-6 h-6 text-gray-400"/></div>}
                                      <div>
                                          <div className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">{client.name}</div>
                                          <div className="text-sm text-gray-500 font-mono">{client.licenseNumber}</div>
                                      </div>
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{client.phone}</div>
                                    <div className="text-sm text-gray-500">{client.email}</div>
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{client.rentalCount} location(s)</div>
                                    <div className="text-sm text-green-600 font-semibold">{client.totalSpent.toLocaleString('fr-FR')} FCFA</div>
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <LoyaltyBadge status={client.loyaltyStatus} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => handleEditClick(client)} className="text-blue-600 hover:text-blue-900"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => deleteClient(client.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
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

        <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveClient} clientToEdit={clientToEdit} />
        {isDetailModalOpen && selectedClient && (
            <ClientDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                client={selectedClient}
                clientRentals={rentals.filter(r => r.clientId === selectedClient.id)}
                clientHistory={history.filter(h => h.entity === 'client' && h.entityId === selectedClient.id)}
            />
        )}
      </div>
    );
};