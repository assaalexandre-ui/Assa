import React, { useState, useMemo } from 'react';
import type { Rental, Vehicle, Client, Driver, Affiliate, Payment, Contravention } from '../types';
import { RentalStatus, VehicleStatus, ContraventionStatus } from '../types';
import { PlusIcon, CalendarIcon, SearchIcon, PencilIcon, TrashIcon, CashIcon, SteeringWheelIcon, ExclamationShieldIcon, ClockIcon, CheckCircleIcon, ClipboardCheckIcon, BriefcaseIcon, UsersIcon } from './icons';
import Modal from './Modal';
import { DriverManagement } from './DriverManagement';
import { AffiliateManagement } from './AffiliateManagement';
import { ContraventionManagement } from './ContraventionManagement';

type Tab = 'rentals' | 'drivers' | 'partners' | 'contraventions';

interface RentalManagementProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  clients: Client[];
  drivers: Driver[];
  affiliates: Affiliate[];
  contraventions: Contravention[];
  addRental: (rental: Omit<Rental, 'id' | 'payments' | 'amountPaid' | 'balanceDue' | 'status'>) => void;
  updateRentalStatus: (id: string, status: RentalStatus) => void;
  deleteRental: (id: string) => void;
  addPayment: (rentalId: string, payment: Omit<Payment, 'id'>) => void;
  addDriver: (driver: Omit<Driver, 'id' | 'isAvailable'>) => void;
  deleteDriver: (id: string) => void;
  updateDriverAvailability: (id: string, isAvailable: boolean) => void;
  addAffiliate: (affiliate: Omit<Affiliate, 'id'>) => void;
  deleteAffiliate: (id: string) => void;
  addContravention: (record: Omit<Contravention, 'id'>) => void;
  updateContraventionStatus: (id: string, status: ContraventionStatus) => void;
  deleteContravention: (id: string) => void;
}

const AddPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (amount: number, date: string) => void;
  balanceDue: number;
}> = ({ isOpen, onClose, onAddPayment, balanceDue }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) > 0) {
      onAddPayment(Number(amount), date);
      onClose();
      setAmount('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Paiement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Montant (FCFA)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} max={balanceDue} min="1" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
          <p className="text-xs text-gray-500 mt-1">Solde restant : {balanceDue.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date du paiement</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

const ContraventionDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  vehicle?: Vehicle;
  client?: Client;
  contraventions: Contravention[];
}> = ({ isOpen, onClose, rental, vehicle, client, contraventions }) => {
  const rentalContraventions = contraventions.filter(c => c.rentalId === rental.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Contraventions pour la location`}>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Véhicule</p>
          <p className="font-semibold text-gray-800">{vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Client</p>
          <p className="font-semibold text-gray-800">{client ? client.name : 'N/A'}</p>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-2">Liste des contraventions ({rentalContraventions.length})</h4>
          {rentalContraventions.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {rentalContraventions.map(c => (
                <li key={c.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-800">{c.description}</p>
                      <p className="text-sm text-gray-600">Date: {new Date(c.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-700">{c.amount.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-xs font-semibold text-gray-600">{c.status}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">Aucune contravention pour cette location.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

const RentalCard: React.FC<{
  rental: Rental;
  vehicle?: Vehicle;
  client?: Client;
  driver?: Driver;
  affiliate?: Affiliate;
  contraventions: Contravention[];
  updateRentalStatus: (id: string, status: RentalStatus) => void;
  deleteRental: (id: string) => void;
  onAddPayment: () => void;
  onViewContraventions: (rental: Rental) => void;
}> = ({ rental, vehicle, client, driver, affiliate, contraventions, updateRentalStatus, deleteRental, onAddPayment, onViewContraventions }) => {
  const progress = rental.price > 0 ? (rental.amountPaid / rental.price) * 100 : 0;
  const rentalContraventions = contraventions.filter(c => c.rentalId === rental.id);
  const isPaid = rental.balanceDue <= 0;
  
  const getStatusInfo = (status: RentalStatus): { color: string; icon: React.ReactNode } => {
    switch(status) {
      case RentalStatus.Active: return { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="w-4 h-4 mr-1.5"/> };
      case RentalStatus.Reserved: return { color: 'bg-indigo-100 text-indigo-800', icon: <ClockIcon className="w-4 h-4 mr-1.5"/> };
      case RentalStatus.Completed: return { color: 'bg-gray-200 text-gray-800', icon: <ClipboardCheckIcon className="w-4 h-4 mr-1.5"/> };
      default: return { color: 'bg-gray-100 text-gray-700', icon: null };
    }
  };

  const statusInfo = getStatusInfo(rental.status);

  const getSelectStatusColor = (status: RentalStatus) => {
    switch(status) {
      case RentalStatus.Active: return 'bg-green-200 text-green-800 border-green-300';
      case RentalStatus.Reserved: return 'bg-indigo-200 text-indigo-800 border-indigo-300';
      case RentalStatus.Completed: return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col">
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold text-gray-800">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule supprimé'}</h3>
                <p className="text-sm text-gray-600">Client: <span className="font-medium">{client ? client.name : 'Client supprimé'}</span></p>
                {driver && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                        <SteeringWheelIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        Chauffeur: <span className="font-medium text-gray-700 ml-1">{driver.name}</span>
                    </p>
                )}
                {affiliate && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                        <BriefcaseIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        Partenaire: <span className="font-medium text-gray-700 ml-1">{affiliate.name}</span>
                    </p>
                )}
            </div>
            <div className="flex flex-col items-end space-y-2">
                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {rental.status}
                </span>
                {isPaid && rental.status !== RentalStatus.Completed && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1.5"/>
                        Payé
                    </span>
                )}
                {rentalContraventions.length > 0 && (
                    <button onClick={() => onViewContraventions(rental)} className="flex items-center text-orange-600 hover:text-orange-800" title={`${rentalContraventions.length} contravention(s)`}>
                        <ExclamationShieldIcon className="w-5 h-5" />
                        <span className="font-bold text-sm ml-1">{rentalContraventions.length}</span>
                    </button>
                )}
            </div>
        </div>
        <div className="mt-3 text-sm text-gray-500">
            <p>Du: <span className="font-medium text-gray-700">{new Date(rental.startDate).toLocaleDateString('fr-FR')}</span></p>
            <p>Au: <span className="font-medium text-gray-700">{new Date(rental.endDate).toLocaleDateString('fr-FR')}</span></p>
        </div>
        <div className="mt-4">
            <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Paiement</span>
                <span>{rental.amountPaid.toLocaleString('fr-FR')} / {rental.price.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-right text-xs text-gray-500 mt-1">Restant: {rental.balanceDue.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>
      <div className="bg-gray-50 p-3 flex space-x-2">
        <button onClick={onAddPayment} disabled={rental.status === RentalStatus.Completed || rental.balanceDue <= 0} className="flex-1 text-sm flex items-center justify-center px-3 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 disabled:bg-green-300"><CashIcon className="w-4 h-4 mr-1"/> Paiement</button>
        <select value={rental.status} onChange={(e) => updateRentalStatus(rental.id, e.target.value as RentalStatus)} className={`flex-1 text-sm rounded-md shadow-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 ${getSelectStatusColor(rental.status)}`}>
            <option value={RentalStatus.Reserved}>Réservé</option>
            <option value={RentalStatus.Active}>Active</option>
            <option value={RentalStatus.Completed}>Terminée</option>
        </select>
        <button onClick={() => deleteRental(rental.id)} className="px-3 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"><TrashIcon className="w-4 h-4"/></button>
      </div>
    </div>
  );
};

const AddRentalModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  clients: Client[];
  drivers: Driver[];
  affiliates: Affiliate[];
  addRental: (rental: Omit<Rental, 'id' | 'payments' | 'amountPaid' | 'balanceDue' | 'status'>) => void;
}> = ({ isOpen, onClose, vehicles, clients, drivers, affiliates, addRental }) => {
  const [vehicleId, setVehicleId] = useState('');
  const [clientId, setClientId] = useState('');
  const [driverId, setDriverId] = useState<string | undefined>(undefined);
  const [affiliateId, setAffiliateId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === clientId);
    if (!vehicleId || !clientId || !startDate || !endDate || Number(price) <= 0 || !client) return;
    
    addRental({
      vehicleId,
      clientId,
      driverId,
      affiliateId,
      customerName: client.name,
      startDate,
      endDate,
      price: Number(price),
    });
    onClose();
    // Reset form
    setVehicleId(''); setClientId(''); setDriverId(undefined); setAffiliateId(undefined);
    setStartDate(''); setEndDate(''); setPrice('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer une nouvelle location">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Client</label><select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"><option value="" disabled>Sélectionner...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700">Véhicule</label><select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"><option value="" disabled>Sélectionner...</option>{vehicles.filter(v => v.status === VehicleStatus.Available).map(v => <option key={v.id} value={v.id}>{`${v.make} ${v.model}`}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700">Chauffeur (Optionnel)</label><select value={driverId || ''} onChange={(e) => setDriverId(e.target.value || undefined)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"><option value="">Aucun</option>{drivers.filter(d => d.isAvailable).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700">Partenaire (Optionnel)</label><select value={affiliateId || ''} onChange={(e) => setAffiliateId(e.target.value || undefined)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"><option value="">Aucun</option>{affiliates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700">Date de début</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Date de fin</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700">Prix Total (FCFA)</label><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/></div>
        <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Créer</button></div>
      </form>
    </Modal>
  );
};

export const RentalManagement: React.FC<RentalManagementProps> = (props) => {
    const { rentals, vehicles, clients, drivers, affiliates, contraventions, addRental, updateRentalStatus, deleteRental, addPayment, addDriver, deleteDriver, updateDriverAvailability, addAffiliate, deleteAffiliate, addContravention, updateContraventionStatus, deleteContravention } = props;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [statusFilter, setStatusFilter] = useState<RentalStatus | 'all'>('all');
    const [clientFilter, setClientFilter] = useState<string | 'all'>('all');
    const [isContraventionModalOpen, setIsContraventionModalOpen] = useState(false);
    const [selectedRentalForContraventions, setSelectedRentalForContraventions] = useState<Rental | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('rentals');

    const filteredRentals = useMemo(() => {
        return rentals
          .filter(r => {
              const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
              const matchesClient = clientFilter === 'all' || r.clientId === clientFilter;
              return matchesStatus && matchesClient;
          })
          .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [rentals, statusFilter, clientFilter]);

    const handleOpenPaymentModal = (rental: Rental) => {
      setSelectedRental(rental);
      setIsPaymentModalOpen(true);
    };

    const handleAddPayment = (amount: number, date: string) => {
        if(selectedRental) {
            addPayment(selectedRental.id, { date, amount });
        }
    };
    
    const handleViewContraventions = (rental: Rental) => {
        setSelectedRentalForContraventions(rental);
        setIsContraventionModalOpen(true);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'rentals':
                return (
                    <>
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg border flex flex-wrap items-center gap-4">
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Filtrer par statut :</label>
                                <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RentalStatus | 'all')} className="mt-1 block w-full max-w-xs py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                                    <option value="all">Toutes</option>
                                    {Object.values(RentalStatus).map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="client-filter" className="block text-sm font-medium text-gray-700">Filtrer par client :</label>
                                <select id="client-filter" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="mt-1 block w-full max-w-xs py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                                    <option value="all">Tous les clients</option>
                                    {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredRentals.map(rental => {
                            const driver = drivers.find(d => d.id === rental.driverId);
                            const affiliate = affiliates.find(a => a.id === rental.affiliateId);
                            return (
                                <RentalCard 
                                key={rental.id} 
                                rental={rental}
                                vehicle={vehicles.find(v => v.id === rental.vehicleId)}
                                client={clients.find(c => c.id === rental.clientId)}
                                driver={driver}
                                affiliate={affiliate}
                                contraventions={contraventions}
                                updateRentalStatus={updateRentalStatus}
                                deleteRental={deleteRental}
                                onAddPayment={() => handleOpenPaymentModal(rental)}
                                onViewContraventions={handleViewContraventions}
                                />
                            );
                          })}
                        </div>
                        {rentals.length === 0 && (
                          <div className="text-center py-16 bg-white rounded-lg shadow-md">
                            <CalendarIcon className="w-16 h-16 mx-auto text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucune location trouvée</h3>
                            <p className="mt-1 text-sm text-gray-500">Commencez par créer une nouvelle location.</p>
                          </div>
                        )}
                        {rentals.length > 0 && filteredRentals.length === 0 && (
                          <div className="text-center py-16 bg-white rounded-lg shadow-md col-span-full">
                            <SearchIcon className="w-16 h-16 mx-auto text-gray-300" />
                            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucune location ne correspond à votre filtre</h3>
                            <p className="mt-1 text-sm text-gray-500">Essayez de sélectionner un autre statut ou client.</p>
                          </div>
                        )}
                    </>
                );
            case 'drivers':
                return <DriverManagement drivers={drivers} addDriver={addDriver} deleteDriver={deleteDriver} updateDriverAvailability={updateDriverAvailability} />;
            case 'partners':
                return <AffiliateManagement affiliates={affiliates} addAffiliate={addAffiliate} deleteAffiliate={deleteAffiliate} />;
            case 'contraventions':
                return <ContraventionManagement contraventions={contraventions} vehicles={vehicles} rentals={rentals} clients={clients} addContravention={addContravention} updateContraventionStatus={updateContraventionStatus} deleteContravention={deleteContravention} />;
            default:
                return null;
        }
    };
    
    const TabButton: React.FC<{tab: Tab, label: string, icon: React.ReactNode}> = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {icon}
            <span className="ml-2">{label}</span>
        </button>
    );

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Gestion des Locations & Opérations</h1>
           {activeTab === 'rentals' && <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"><PlusIcon className="w-5 h-5 mr-2"/>Nouvelle Location</button>}
        </div>

        <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-2" aria-label="Tabs">
               <TabButton tab="rentals" label="Locations" icon={<CalendarIcon className="w-5 h-5"/>} />
               <TabButton tab="drivers" label="Chauffeurs" icon={<SteeringWheelIcon className="w-5 h-5"/>} />
               <TabButton tab="partners" label="Partenaires" icon={<BriefcaseIcon className="w-5 h-5"/>} />
               <TabButton tab="contraventions" label="Contraventions" icon={<ExclamationShieldIcon className="w-5 h-5"/>} />
            </nav>
        </div>
        
        <div className="mt-8">
            {renderTabContent()}
        </div>

        <AddRentalModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} vehicles={vehicles} clients={clients} drivers={drivers} affiliates={affiliates} addRental={addRental} />
        {selectedRental && <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onAddPayment={handleAddPayment} balanceDue={selectedRental.balanceDue}/>}
        {selectedRentalForContraventions && (
            <ContraventionDetailModal 
                isOpen={isContraventionModalOpen} 
                onClose={() => setIsContraventionModalOpen(false)}
                rental={selectedRentalForContraventions}
                vehicle={vehicles.find(v => v.id === selectedRentalForContraventions.vehicleId)}
                client={clients.find(c => c.id === selectedRentalForContraventions.clientId)}
                contraventions={contraventions}
            />
        )}
      </div>
    );
};
