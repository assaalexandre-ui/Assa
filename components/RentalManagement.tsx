import React, { useState } from 'react';
import type { Rental, Vehicle, Client, Driver, Payment } from '../types';
import { VehicleStatus } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon } from './icons';
import Modal from './Modal';

// Déclarez jsPDF pour TypeScript car il est chargé via une balise script
declare const jspdf: any;

interface RentalManagementProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  clients: Client[];
  drivers: Driver[];
  addRental: (rental: Omit<Rental, 'id' | 'isCompleted' | 'customerName' | 'payments' | 'amountPaid' | 'balanceDue'>) => void;
  completeRental: (id: string) => void;
  addPaymentToRental: (rentalId: string, amount: number, date: string) => void;
}

const getStatusBadge = (isCompleted: boolean) => {
    return isCompleted
      ? <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">Terminée</span>
      : <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Active</span>;
};

const AddPaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  addPaymentToRental: (rentalId: string, amount: number, date: string) => void;
}> = ({ isOpen, onClose, rental, addPaymentToRental }) => {
    const [amount, setAmount] = useState<number | ''>(rental.balanceDue > 0 ? rental.balanceDue : '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount === '' || amount <= 0 || amount > rental.balanceDue) {
            alert("Veuillez entrer un montant valide.");
            return;
        }
        addPaymentToRental(rental.id, Number(amount), date);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ajouter un paiement pour ${rental.customerName}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                    <p>Montant total: <span className="font-bold">{rental.price.toLocaleString('fr-FR')} FCFA</span></p>
                    <p>Montant payé: <span className="font-bold text-green-600">{rental.amountPaid.toLocaleString('fr-FR')} FCFA</span></p>
                    <p>Solde restant: <span className="font-bold text-red-600">{rental.balanceDue.toLocaleString('fr-FR')} FCFA</span></p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date du paiement</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Montant à payer</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} max={rental.balanceDue} min="1" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Enregistrer</button>
                </div>
            </form>
        </Modal>
    )
};

const RentalCard: React.FC<{
    rental: Rental;
    vehicle?: Vehicle;
    client?: Client;
    driver?: Driver;
    completeRental: (id: string) => void;
    addPaymentToRental: (rentalId: string, amount: number, date: string) => void;
}> = ({ rental, vehicle, client, driver, completeRental, addPaymentToRental }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    const generateContract = () => {
        if (!vehicle || !client) return;

        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("CARMIXT APPS", 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Contrat de Location de Véhicule", 20, 28);
        doc.line(20, 30, 190, 30);
        
        doc.setFontSize(12);
        doc.text(`Contrat N°: ${rental.id}`, 140, 40);
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 140, 47);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Entre les soussignés :", 20, 45);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Le Loueur : CARMIXT APPS, Dakar, Sénégal", 25, 55);
        doc.text(`Le Locataire : ${client.name}`, 25, 62);
        doc.text(`Téléphone: ${client.phone}, Email: ${client.email}`, 25, 69);
        doc.text(`Permis N°: ${client.licenseNumber}`, 25, 76);

        doc.autoTable({
            startY: 85,
            head: [['Véhicule', 'Immatriculation', 'Kilométrage']],
            body: [[`${vehicle.make} ${vehicle.model}`, vehicle.plate, `${vehicle.currentMileage.toLocaleString('fr-FR')} km`]],
            theme: 'grid',
            headStyles: { fillColor: [217, 35, 50] }
        });

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Date de Début', 'Date de Fin', 'Prix Total']],
            body: [[
                new Date(rental.startDate).toLocaleDateString('fr-FR'),
                new Date(rental.endDate).toLocaleDateString('fr-FR'),
                `${rental.price.toLocaleString('fr-FR')} FCFA`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [217, 35, 50] }
        });

        if (rental.payments.length > 0) {
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [['Historique des Paiements']],
                body: rental.payments.map(p => [
                    `Payé le ${new Date(p.date).toLocaleDateString('fr-FR')}: ${p.amount.toLocaleString('fr-FR')} FCFA`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [100, 100, 100] }
            });
        }
        
        doc.text(`Montant payé: ${rental.amountPaid.toLocaleString('fr-FR')} FCFA`, 20, doc.lastAutoTable.finalY + 10);
        doc.text(`Solde restant: ${rental.balanceDue.toLocaleString('fr-FR')} FCFA`, 20, doc.lastAutoTable.finalY + 17);

        doc.text("Signature du Locataire", 30, doc.internal.pageSize.height - 40);
        doc.line(25, doc.internal.pageSize.height - 45, 85, doc.internal.pageSize.height - 45);
        doc.text("Signature du Loueur", 135, doc.internal.pageSize.height - 40);
        doc.line(130, doc.internal.pageSize.height - 45, 190, doc.internal.pageSize.height - 45);
        
        doc.save(`contrat-${rental.id}.pdf`);
    };

    const paymentProgress = (rental.amountPaid / rental.price) * 100;

    return (
        <>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{rental.customerName}</h3>
                            <p className="text-sm text-red-600 font-semibold">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule inconnu'}</p>
                            {driver && <p className="text-xs text-gray-500 mt-1">Chauffeur: {driver.name}</p>}
                        </div>
                        {getStatusBadge(rental.isCompleted)}
                    </div>
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-baseline mb-2">
                            <p className="text-sm font-semibold text-gray-600">Total à payer</p>
                            <p className="text-lg font-bold text-gray-800">{rental.price.toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${paymentProgress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>Payé: {rental.amountPaid.toLocaleString('fr-FR')}</span>
                            <span>Restant: {rental.balanceDue.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                            <div><p className="font-medium">Début:</p><p>{new Date(rental.startDate).toLocaleDateString('fr-FR')}</p></div>
                            <div><p className="font-medium">Fin:</p><p>{new Date(rental.endDate).toLocaleDateString('fr-FR')}</p></div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex flex-col space-y-2">
                     <button onClick={() => setIsPaymentModalOpen(true)} disabled={rental.balanceDue <= 0} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors">
                        Ajouter Paiement
                     </button>
                     {!rental.isCompleted && (
                         <button onClick={() => completeRental(rental.id)} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Marquer comme terminée
                         </button>
                    )}
                     <button onClick={generateContract} className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors">
                        Générer Contrat
                     </button>
                </div>
            </div>
            {isPaymentModalOpen && <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} rental={rental} addPaymentToRental={addPaymentToRental} />}
        </>
    );
};

const AddRentalModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  clients: Client[];
  drivers: Driver[];
  addRental: (rental: Omit<Rental, 'id' | 'isCompleted' | 'customerName' | 'payments' | 'amountPaid' | 'balanceDue'>) => void;
}> = ({ isOpen, onClose, vehicles, clients, drivers, addRental }) => {
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState(0);

  const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.Available);
  const availableDrivers = drivers.filter(d => d.isAvailable);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !vehicleId || !startDate || !endDate || price <= 0) return;
    addRental({ clientId, vehicleId, driverId, startDate, endDate, price });
    onClose();
    setClientId('');
    setVehicleId('');
    setDriverId(undefined);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setPrice(0);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer une nouvelle location">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500">
            <option value="" disabled>Sélectionner un client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
           {clients.length === 0 && <p className="text-xs text-red-500 mt-1">Aucun client. Ajoutez-en un depuis l'onglet Clients.</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Véhicule</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500">
            <option value="" disabled>Sélectionner un véhicule</option>
            {availableVehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} - {v.plate}</option>
            ))}
          </select>
          {availableVehicles.length === 0 && <p className="text-xs text-red-500 mt-1">Aucun véhicule disponible.</p>}
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">Chauffeur (Optionnel)</label>
          <select value={driverId || ''} onChange={(e) => setDriverId(e.target.value || undefined)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500">
            <option value="">Sans chauffeur</option>
            {availableDrivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Date de début</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
            </div>
        </div>
         <div>
            <label className="block text-sm font-medium text-gray-700">Prix de la location (FCFA)</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300" disabled={availableVehicles.length === 0 || clients.length === 0}>Créer</button>
        </div>
      </form>
    </Modal>
  );
};

export const RentalManagement: React.FC<RentalManagementProps> = ({ rentals, vehicles, clients, drivers, addRental, completeRental, addPaymentToRental }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const sortedRentals = [...rentals].sort((a, b) => (a.isCompleted === b.isCompleted) ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime() : a.isCompleted ? 1 : -1);
    
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gestion des Locations</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Nouvelle Location
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedRentals.map(rental => {
                const vehicle = vehicles.find(v => v.id === rental.vehicleId);
                const client = clients.find(c => c.id === rental.clientId);
                const driver = drivers.find(d => d.id === rental.driverId);
                return <RentalCard key={rental.id} rental={rental} vehicle={vehicle} client={client} driver={driver} completeRental={completeRental} addPaymentToRental={addPaymentToRental} />
            })}
        </div>
        {rentals.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <CalendarIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucune location trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">Créez une nouvelle location pour commencer.</p>
          </div>
        )}
        <AddRentalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} vehicles={vehicles} clients={clients} drivers={drivers} addRental={addRental} />
      </div>
    );
};