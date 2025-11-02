

import React, { useState, useMemo } from 'react';
import type { Vehicle, Rental, MaintenanceRecord, Owner, Contravention, Accident } from '../types';
import { VehicleStatus, ContraventionStatus } from '../types';
import { PlusIcon, CarIcon, SearchIcon, CheckCircleIcon, ExclamationShieldIcon, AlertIcon, DownloadIcon } from './icons';
import Modal from './Modal';

interface VehicleManagementProps {
  vehicles: Vehicle[];
  rentals: Rental[];
  maintenanceRecords: MaintenanceRecord[];
  contraventions: Contravention[];
  owners: Owner[];
  accidents: Accident[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  deleteVehicle: (id: string) => void;
  updateContraventionStatus: (id: string, status: ContraventionStatus) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};


const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
        case VehicleStatus.Available: return 'text-green-700 bg-green-100';
        case VehicleStatus.Rented: return 'text-yellow-700 bg-yellow-100';
        case VehicleStatus.Maintenance: return 'text-red-700 bg-red-100';
        case VehicleStatus.Reserved: return 'text-indigo-700 bg-indigo-100';
    }
};

const VehicleDetailModal: React.FC<{
    vehicle: Vehicle;
    rentals: Rental[];
    maintenance: MaintenanceRecord[];
    contraventions: Contravention[];
    owners: Owner[];
    accidents: Accident[];
    onClose: () => void;
    updateContraventionStatus: (id: string, status: ContraventionStatus) => void;
}> = ({ vehicle, rentals, maintenance, contraventions, owners, accidents, onClose, updateContraventionStatus }) => {
    const [showUnpaidDetails, setShowUnpaidDetails] = useState(false);
    
    const vehicleRentals = rentals.filter(r => r.vehicleId === vehicle.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const vehicleMaintenance = maintenance.filter(m => m.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const vehicleContraventions = contraventions.filter(c => c.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const vehicleAccidents = accidents.filter(a => a.vehicleId === vehicle.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const owner = owners.find(o => o.id === vehicle.ownerId);

    // Financial calculations
    const totalRevenue = vehicleRentals.reduce((sum, r) => sum + r.price, 0);
    const totalMaintenanceCost = vehicleMaintenance.reduce((sum, m) => sum + m.cost, 0);
    const yearsOwned = (new Date().getTime() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const depreciation = vehicle.purchaseValue * (1 - Math.pow(1 - (vehicle.amortizationRate / 100), yearsOwned));
    const currentValue = vehicle.purchaseValue - depreciation;
    
    const totalContraventionsCost = vehicleContraventions.reduce((sum, c) => sum + c.amount, 0);
    const unpaidContraventions = vehicleContraventions.filter(c => c.status === ContraventionStatus.Unpaid);
    const unpaidContraventionsTotal = unpaidContraventions.reduce((sum, c) => sum + c.amount, 0);
    const paidContraventionsTotal = vehicleContraventions.filter(c => c.status === ContraventionStatus.Paid).reduce((sum, c) => sum + c.amount, 0);

    const netProfitability = totalRevenue - depreciation - totalMaintenanceCost - totalContraventionsCost;
    
    const financialChartData = [
        { label: 'Revenu Total', value: totalRevenue, color: 'bg-green-500' },
        { label: 'Coûts Maintenance', value: totalMaintenanceCost, color: 'bg-yellow-500' },
        { label: 'Coûts Contraventions', value: totalContraventionsCost, color: 'bg-orange-500' },
    ];
    const maxValue = Math.max(...financialChartData.map(d => Math.abs(d.value)), 1);


    return (
        <>
            <Modal isOpen={!!vehicle} onClose={onClose} title={`${vehicle.make} ${vehicle.model}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-48 object-cover rounded-lg shadow-md"/>
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800">Informations Clés</h4>
                            <p><strong>Propriétaire:</strong> {owner ? owner.name : 'N/A'}</p>
                            <p className="flex justify-between items-center">
                                <span><strong>Plaque:</strong> <span className="font-mono">{vehicle.plate}</span></span>
                                {vehicle.registrationDocumentUrl && (
                                    <a href={vehicle.registrationDocumentUrl} download={`CarteGrise_${vehicle.plate}.png`} className="text-sm text-blue-600 hover:underline flex items-center">
                                        <DownloadIcon className="w-4 h-4 mr-1"/> Carte Grise
                                    </a>
                                )}
                            </p>
                            <p><strong>Année:</strong> {vehicle.year}</p>
                            <p><strong>Kilométrage:</strong> {vehicle.currentMileage.toLocaleString('fr-FR')} km</p>
                            <p><strong>Statut:</strong> <span className={`font-semibold ${getStatusColor(vehicle.status).split(' ')[0]}`}>{vehicle.status}</span></p>
                        </div>
                         <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800">Échéances & Documents</h4>
                            <p className="flex justify-between items-center">
                                <span><strong>Assurance:</strong> {new Date(vehicle.insuranceExpiry).toLocaleDateString('fr-FR')}</span>
                                {vehicle.insuranceDocumentUrl && (
                                    <a href={vehicle.insuranceDocumentUrl} download={`Assurance_${vehicle.plate}.png`} className="text-sm text-blue-600 hover:underline flex items-center">
                                        <DownloadIcon className="w-4 h-4 mr-1"/> Voir pièce
                                    </a>
                                )}
                            </p>
                            <p className="flex justify-between items-center">
                                <span><strong>Visite Technique:</strong> {new Date(vehicle.technicalInspectionExpiry).toLocaleDateString('fr-FR')}</span>
                                {vehicle.technicalInspectionDocumentUrl && (
                                    <a href={vehicle.technicalInspectionDocumentUrl} download={`VisiteTechnique_${vehicle.plate}.png`} className="text-sm text-blue-600 hover:underline flex items-center">
                                        <DownloadIcon className="w-4 h-4 mr-1"/> Voir pièce
                                    </a>
                                )}
                            </p>
                            <p><strong>Proch. Maintenance:</strong> {new Date(vehicle.nextMaintenance).toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>
                    <div>
                         <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                            <h4 className="font-semibold text-blue-800 mb-2">Données Financières</h4>
                            <div className="space-y-1 text-sm border-b pb-2">
                                <p><strong>Valeur d'Achat:</strong> {vehicle.purchaseValue.toLocaleString('fr-FR')} FCFA</p>
                                <p><strong>Amortissement Total:</strong> <span className="text-red-600">-{depreciation.toLocaleString('fr-FR', {maximumFractionDigits: 0})} FCFA</span></p>
                                <p><strong>Valeur Actuelle (estimée):</strong> <span className="font-semibold">{currentValue.toLocaleString('fr-FR', {maximumFractionDigits: 0})} FCFA</span></p>
                            </div>
                            <div className="space-y-1 text-sm pt-1">
                                 <p><strong>Chiffre d'Affaires Généré:</strong> <span className="font-bold text-green-600">{totalRevenue.toLocaleString('fr-FR')} FCFA</span></p>
                                 <p><strong>Coûts Maintenance Totaux:</strong> <span className="font-semibold text-red-600">{totalMaintenanceCost.toLocaleString('fr-FR')} FCFA</span></p>
                                 <p><strong>Coûts Contraventions Totaux:</strong> <span className="font-semibold text-orange-600">{totalContraventionsCost.toLocaleString('fr-FR')} FCFA</span></p>
                                 <div className="pl-4 text-xs">
                                    <p>Payées: <span className="text-gray-600">{paidContraventionsTotal.toLocaleString('fr-FR')} FCFA</span></p>
                                    <p>Impayées: 
                                        <button 
                                            onClick={() => setShowUnpaidDetails(true)} 
                                            className={`font-medium ml-1 focus:outline-none ${unpaidContraventionsTotal > 0 ? 'text-orange-700 cursor-pointer hover:underline' : 'text-gray-500 cursor-default'}`}
                                            disabled={unpaidContraventionsTotal === 0}
                                        >
                                            {unpaidContraventionsTotal.toLocaleString('fr-FR')} FCFA
                                        </button>
                                    </p>
                                 </div>
                                 <p className="border-t pt-2 mt-2 font-bold text-base"><strong>Rendement Net:</strong> <span className={`font-bold text-lg ${netProfitability >= 0 ? 'text-green-700' : 'text-red-700'}`}>{netProfitability.toLocaleString('fr-FR', {maximumFractionDigits: 0})} FCFA</span></p>
                            </div>
                        </div>
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-3">Répartition Revenus vs Coûts</h4>
                            <div className="space-y-3 text-sm">
                                {financialChartData.map(item => (
                                    <div key={item.label}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-gray-700">{item.label}</span>
                                            <span className="font-semibold">{item.value.toLocaleString('fr-FR')} FCFA</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className={`${item.color} h-2.5 rounded-full`}
                                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Historique des 5 dernières locations</h4>
                            {vehicleRentals.length > 0 ? (
                                <ul className="space-y-2 max-h-40 overflow-y-auto">
                                    {vehicleRentals.slice(0, 5).map(r => (
                                        <li key={r.id} className="text-sm p-2 bg-gray-100 rounded">
                                            {r.customerName} - {new Date(r.startDate).toLocaleDateString('fr-FR')} au {new Date(r.endDate).toLocaleDateString('fr-FR')}
                                            {r.status === 'Terminée' && <CheckCircleIcon className="w-4 h-4 text-green-500 inline ml-2" />}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Aucune location enregistrée.</p>}
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Historique des Accidents ({vehicleAccidents.length})</h4>
                            {vehicleAccidents.length > 0 ? (
                                <ul className="space-y-2 max-h-24 overflow-y-auto">
                                    {vehicleAccidents.map(a => (
                                        <li key={a.id} className="text-sm p-2 bg-red-50 rounded">
                                            {new Date(a.date).toLocaleDateString('fr-FR')} - {a.description} ({a.status})
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Aucun accident enregistré.</p>}
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Historique des Maintenances ({vehicleMaintenance.length})</h4>
                             {vehicleMaintenance.length > 0 ? (
                                <ul className="space-y-2 max-h-24 overflow-y-auto">
                                    {vehicleMaintenance.map(m => (
                                        <li key={m.id} className="text-sm p-2 bg-gray-100 rounded">
                                            {new Date(m.date).toLocaleDateString('fr-FR')} - {m.description} ({m.cost.toLocaleString('fr-FR')} FCFA)
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Aucune maintenance enregistrée.</p>}
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Historique des Contraventions ({vehicleContraventions.length})</h4>
                             {vehicleContraventions.length > 0 ? (
                                <ul className="space-y-2 max-h-24 overflow-y-auto">
                                    {vehicleContraventions.map(c => (
                                        <li key={c.id} className="text-sm p-2 bg-red-50 rounded flex justify-between items-center">
                                            <div>
                                                {new Date(c.date).toLocaleDateString('fr-FR')} - {c.description} ({c.amount.toLocaleString('fr-FR')} FCFA) - <span className="font-semibold">{c.status}</span>
                                            </div>
                                            {c.status !== ContraventionStatus.Paid && (
                                                <div className="flex items-center space-x-1">
                                                    <button 
                                                        onClick={() => updateContraventionStatus(c.id, ContraventionStatus.Paid)}
                                                        className="px-2 py-0.5 text-xs text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                                                        title="Marquer comme payée"
                                                    >
                                                        Payer
                                                    </button>
                                                     <button 
                                                        onClick={() => updateContraventionStatus(c.id, ContraventionStatus.Disputed)}
                                                        className="px-2 py-0.5 text-xs text-black bg-yellow-400 rounded hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                                        title="Marquer comme contestée"
                                                    >
                                                        Contester
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Aucune contravention enregistrée.</p>}
                        </div>
                    </div>
                </div>
            </Modal>
            {showUnpaidDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setShowUnpaidDetails(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-3 border-b">
                            <h4 className="text-lg font-bold text-gray-800">Détail des Contraventions Impayées</h4>
                            <button onClick={() => setShowUnpaidDetails(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
                        </div>
                        <div className="mt-4 max-h-80 overflow-y-auto">
                            {unpaidContraventions.length > 0 ? (
                                <ul className="space-y-3">
                                    {unpaidContraventions.map(c => (
                                        <li key={c.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-red-800">{c.description}</p>
                                                    <p className="text-sm text-gray-600">Date: {new Date(c.date).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-700">{c.amount.toLocaleString('fr-FR')} FCFA</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Aucune contravention impayée.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


const getExpiryStatus = (dateStr: string): { className: string; isUrgent: boolean } => {
    if (!dateStr) return { className: 'font-medium text-gray-700', isUrgent: false };
    const expiryDate = new Date(dateStr);
    const today = new Date();
    expiryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { className: 'text-red-800 font-bold', isUrgent: true };
    if (diffDays <= 7) return { className: 'text-red-600 font-semibold', isUrgent: true };
    if (diffDays <= 30) return { className: 'text-yellow-600 font-semibold', isUrgent: false };
    return { className: 'font-medium text-gray-700', isUrgent: false };
};

const VehicleCard: React.FC<{
    vehicle: Vehicle;
    onSelect: () => void;
    updateVehicleStatus: (id: string, status: VehicleStatus) => void;
    deleteVehicle: (id: string) => void;
    unpaidContraventionsCount: number;
}> = ({ vehicle, onSelect, updateVehicleStatus, deleteVehicle, unpaidContraventionsCount }) => {
    const isUnavailable = vehicle.status === VehicleStatus.Rented || vehicle.status === VehicleStatus.Reserved;
    
    const hasUrgentExpiry = getExpiryStatus(vehicle.insuranceExpiry).isUrgent || 
                            getExpiryStatus(vehicle.technicalInspectionExpiry).isUrgent ||
                            getExpiryStatus(vehicle.nextMaintenance).isUrgent;

    const getSelectStatusColor = (status: VehicleStatus) => {
        switch (status) {
            case VehicleStatus.Available: return 'bg-green-200 text-green-800 border-green-300';
            case VehicleStatus.Rented: return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            case VehicleStatus.Maintenance: return 'bg-red-200 text-red-800 border-red-300';
            case VehicleStatus.Reserved: return 'bg-indigo-200 text-indigo-800 border-indigo-300';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <button onClick={onSelect} className="w-full block text-left focus:outline-none focus:ring-2 focus:ring-red-500">
              <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-40 object-cover"/>
            </button>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <button onClick={onSelect} className="text-left">
                        <h3 className="text-lg font-bold text-gray-800">{vehicle.make} {vehicle.model}</h3>
                        <p className="text-sm text-gray-500">{vehicle.year}</p>
                    </button>
                    <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                            {vehicle.status}
                        </span>
                        {unpaidContraventionsCount > 0 && (
                            <div className="flex items-center text-orange-600" title={`${unpaidContraventionsCount} contravention(s) impayée(s)`}>
                                <ExclamationShieldIcon className="w-5 h-5" />
                                <span className="font-bold text-sm ml-1">{unpaidContraventionsCount}</span>
                            </div>
                        )}
                        {hasUrgentExpiry && (
                            <div className="flex items-center text-red-600" title="Une échéance est imminente !">
                                <AlertIcon className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>
                <p className="mt-2 text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block">{vehicle.plate}</p>
                
                <div className="mt-3 text-xs text-gray-500 space-y-1 border-t pt-2">
                    <p>Assurance: <span className={getExpiryStatus(vehicle.insuranceExpiry).className}>{new Date(vehicle.insuranceExpiry).toLocaleDateString('fr-FR')}</span></p>
                    <p>Visite Tech.: <span className={getExpiryStatus(vehicle.technicalInspectionExpiry).className}>{new Date(vehicle.technicalInspectionExpiry).toLocaleDateString('fr-FR')}</span></p>
                    <p>Proch. Maint.: <span className={getExpiryStatus(vehicle.nextMaintenance).className}>{new Date(vehicle.nextMaintenance).toLocaleDateString('fr-FR')}</span></p>
                    <p>Kilométrage: <span className="font-medium text-gray-700">{vehicle.currentMileage.toLocaleString('fr-FR')} km</span></p>
                </div>
                
                <div className="mt-auto pt-4 flex space-x-2">
                    <select
                        value={vehicle.status}
                        onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value as VehicleStatus)}
                        className={`w-full text-sm rounded-md shadow-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:bg-gray-200 transition-colors duration-200 ${getSelectStatusColor(vehicle.status)}`}
                        disabled={isUnavailable}
                    >
                        <option value={VehicleStatus.Available}>Disponible</option>
                        <option value={VehicleStatus.Maintenance}>En Maintenance</option>
                        <option value={VehicleStatus.Reserved} disabled>Réservé</option>
                        <option value={VehicleStatus.Rented} disabled>Loué</option>
                    </select>
                    <button onClick={() => deleteVehicle(vehicle.id)} disabled={isUnavailable} className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-red-300">
                        Suppr.
                    </button>
                </div>
                 {isUnavailable && <p className="text-xs text-red-500 mt-2">Le statut ne peut être modifié pour un véhicule loué ou réservé.</p>}
            </div>
        </div>
    );
};

const AddVehicleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  owners: Owner[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
}> = ({ isOpen, onClose, owners, addVehicle }) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [plate, setPlate] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [nextMaintenance, setNextMaintenance] = useState('');
  const [technicalInspectionExpiry, setTechnicalInspectionExpiry] = useState('');
  const [currentMileage, setCurrentMileage] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amortizationRate, setAmortizationRate] = useState(20);
  const [insuranceDocumentUrl, setInsuranceDocumentUrl] = useState<string | undefined>();
  const [technicalInspectionDocumentUrl, setTechnicalInspectionDocumentUrl] = useState<string | undefined>();
  const [registrationDocumentUrl, setRegistrationDocumentUrl] = useState<string | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: React.Dispatch<React.SetStateAction<string | undefined>>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setUrl(base64);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin de journée
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Début de journée

    if (purchaseDate && new Date(purchaseDate) > today) {
        newErrors.purchaseDate = "La date d'achat ne peut être dans le futur.";
    }
    if (insuranceExpiry && new Date(insuranceExpiry) < todayStart) {
        newErrors.insuranceExpiry = "La date d'expiration ne peut être dans le passé.";
    }
    if (technicalInspectionExpiry && new Date(technicalInspectionExpiry) < todayStart) {
        newErrors.technicalInspectionExpiry = "La date d'expiration ne peut être dans le passé.";
    }
    if (nextMaintenance && new Date(nextMaintenance) < todayStart) {
        newErrors.nextMaintenance = "La date de maintenance ne peut être dans le passé.";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    if (!make || !model || !plate || !year || !insuranceExpiry || !nextMaintenance || !technicalInspectionExpiry || !imageUrl || !ownerId || purchaseValue <= 0) return;
    addVehicle({ 
        make, model, year, plate, status: VehicleStatus.Available, insuranceExpiry, nextMaintenance, technicalInspectionExpiry, 
        currentMileage, imageUrl, ownerId, purchaseValue, purchaseDate, amortizationRate,
        insuranceDocumentUrl, technicalInspectionDocumentUrl, registrationDocumentUrl 
    });
    onClose();
    // Reset form
    setMake(''); setModel(''); setYear(new Date().getFullYear()); setPlate(''); setInsuranceExpiry(''); setNextMaintenance(''); setTechnicalInspectionExpiry(''); setCurrentMileage(0); setImageUrl('');
    setOwnerId(undefined); setPurchaseValue(0); setPurchaseDate(new Date().toISOString().split('T')[0]); setAmortizationRate(20);
    setInsuranceDocumentUrl(undefined); setTechnicalInspectionDocumentUrl(undefined); setRegistrationDocumentUrl(undefined);
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouveau véhicule">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">Marque</label><input type="text" value={make} onChange={(e) => setMake(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Modèle</label><input type="text" value={model} onChange={(e) => setModel(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Année</label><input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} required min="1990" max={new Date().getFullYear() + 1} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Plaque</label><input type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700">Kilométrage</label><input type="number" value={currentMileage} onChange={(e) => setCurrentMileage(Number(e.target.value))} required min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold mb-2">Informations Financières</h4>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Propriétaire</label><select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"><option value="" disabled>Sélectionner...</option>{owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700">Valeur d'Achat (FCFA)</label><input type="number" value={purchaseValue} onChange={(e) => setPurchaseValue(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'Achat</label>
                  <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.purchaseDate ? 'border-red-500' : ''}`}/>
                  {errors.purchaseDate && <p className="text-xs text-red-600 mt-1">{errors.purchaseDate}</p>}
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Taux Amort. (%/an)</label><input type="number" value={amortizationRate} onChange={(e) => setAmortizationRate(Number(e.target.value))} required min="1" max="100" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
            </div>
        </div>
         <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Expiration Assurance</label>
              <input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} required className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.insuranceExpiry ? 'border-red-500' : ''}`}/>
              {errors.insuranceExpiry && <p className="text-xs text-red-600 mt-1">{errors.insuranceExpiry}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Visite Technique</label>
              <input type="date" value={technicalInspectionExpiry} onChange={(e) => setTechnicalInspectionExpiry(e.target.value)} required className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.technicalInspectionExpiry ? 'border-red-500' : ''}`}/>
              {errors.technicalInspectionExpiry && <p className="text-xs text-red-600 mt-1">{errors.technicalInspectionExpiry}</p>}
            </div>
        </div>
         <div>
            <label className="block text-sm font-medium text-gray-700">Prochaine Maintenance</label>
            <input type="date" value={nextMaintenance} onChange={(e) => setNextMaintenance(e.target.value)} required className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 ${errors.nextMaintenance ? 'border-red-500' : ''}`}/>
            {errors.nextMaintenance && <p className="text-xs text-red-600 mt-1">{errors.nextMaintenance}</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Photo du véhicule</label>
            <input type="file" onChange={(e) => handleFileChange(e, (url) => setImageUrl(url || ''))} accept="image/*" required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
            {imageUrl && <img src={imageUrl} alt="Aperçu" className="mt-2 h-20 rounded-md" />}
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold mb-2">Documents</h4>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Pièce: Assurance</label>
                    <input type="file" onChange={(e) => handleFileChange(e, setInsuranceDocumentUrl)} accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Pièce: Visite Technique</label>
                    <input type="file" onChange={(e) => handleFileChange(e, setTechnicalInspectionDocumentUrl)} accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Pièce: Carte Grise</label>
                    <input type="file" onChange={(e) => handleFileChange(e, setRegistrationDocumentUrl)} accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                </div>
            </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ajouter</button>
        </div>
      </form>
    </Modal>
  );
};

const ProfitabilityAnalysis: React.FC<{
    vehicles: Vehicle[];
    rentals: Rental[];
    maintenanceRecords: MaintenanceRecord[];
}> = ({ vehicles, rentals, maintenanceRecords }) => {
    const profitabilityData = useMemo(() => {
        return vehicles.map(vehicle => {
            const totalRevenue = rentals
                .filter(r => r.vehicleId === vehicle.id)
                .reduce((sum, r) => sum + r.price, 0);
            
            const totalMaintenanceCost = maintenanceRecords
                .filter(m => m.vehicleId === vehicle.id)
                .reduce((sum, m) => sum + m.cost, 0);

            const yearsOwned = (new Date().getTime() - new Date(vehicle.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const depreciation = vehicle.purchaseValue * (1 - Math.pow(1 - (vehicle.amortizationRate / 100), yearsOwned));
            const netProfit = totalRevenue - depreciation - totalMaintenanceCost;

            return {
                ...vehicle,
                netProfit,
            };
        }).sort((a, b) => a.netProfit - b.netProfit);
    }, [vehicles, rentals, maintenanceRecords]);

    if (profitabilityData.length === 0) return null;

    const top5LeastProfitable = profitabilityData.slice(0, 5);
    const maxAbsoluteValue = Math.max(...top5LeastProfitable.map(v => Math.abs(v.netProfit)), 1);

    return (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analyse de Rentabilité : Les 5 Moins Performants</h2>
            <div className="space-y-4">
                {top5LeastProfitable.map(vehicle => {
                    const isLoss = vehicle.netProfit < 0;
                    const barWidth = (Math.abs(vehicle.netProfit) / maxAbsoluteValue) * 100;

                    return (
                        <div key={vehicle.id}>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-gray-800">{vehicle.make} {vehicle.model}</span>
                                <span className={`font-semibold ${isLoss ? 'text-red-600' : 'text-green-600'}`}>
                                    {vehicle.netProfit.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${isLoss ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${barWidth}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const VehicleManagement: React.FC<VehicleManagementProps> = ({ vehicles, rentals, maintenanceRecords, contraventions, owners, accidents, addVehicle, updateVehicleStatus, deleteVehicle, updateContraventionStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
    const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
    const [ownerFilter, setOwnerFilter] = useState<string | 'all'>('all');

    // FIX: Explicitly convert years to numbers to avoid type errors when data is loaded from localStorage as strings.
    const availableYears = [...new Set(vehicles.map(v => Number(v.year)))].sort((a, b) => Number(b) - Number(a));

    const filteredVehicles = vehicles.filter(vehicle => {
        const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.trim() !== '');
        const vehicleInfo = `${vehicle.make} ${vehicle.model} ${vehicle.plate}`.toLowerCase();
        
        const matchesSearch = searchTerms.every(term => vehicleInfo.includes(term));
        const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
        const matchesYear = yearFilter === 'all' || vehicle.year === yearFilter;
        const matchesOwner = ownerFilter === 'all' || vehicle.ownerId === ownerFilter;

        return matchesSearch && matchesStatus && matchesYear && matchesOwner;
    });
    
    const handleSelectVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedVehicle(null);
    };

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Gestion des Véhicules</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Ajouter un Véhicule
          </button>
        </div>

        <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">Recherche</label>
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            id="search"
                            type="text"
                            placeholder="Ex: Toyota Yaris AB-123-CD"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'all')}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    >
                        <option value="all">Tous les statuts</option>
                        {Object.values(VehicleStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700">Année</label>
                    <select
                        id="year-filter"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    >
                        <option value="all">Toutes les années</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="owner-filter" className="block text-sm font-medium text-gray-700">Propriétaire</label>
                    <select
                        id="owner-filter"
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    >
                        <option value="all">Tous les propriétaires</option>
                        {owners.map(owner => (
                            <option key={owner.id} value={owner.id}>{owner.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <ProfitabilityAnalysis vehicles={vehicles} rentals={rentals} maintenanceRecords={maintenanceRecords} />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredVehicles.map(vehicle => {
                const unpaidContraventionsCount = contraventions.filter(c => c.vehicleId === vehicle.id && c.status === ContraventionStatus.Unpaid).length;
                return (
                    <VehicleCard 
                        key={vehicle.id} 
                        vehicle={vehicle} 
                        onSelect={() => handleSelectVehicle(vehicle)} 
                        updateVehicleStatus={updateVehicleStatus} 
                        deleteVehicle={deleteVehicle}
                        unpaidContraventionsCount={unpaidContraventionsCount}
                    />
                );
            })}
        </div>
        
        {vehicles.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <CarIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun véhicule trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un nouveau véhicule à votre flotte.</p>
          </div>
        )}

        {vehicles.length > 0 && filteredVehicles.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md col-span-full">
            <SearchIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-800">Aucun véhicule ne correspond à votre recherche</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez de modifier vos termes de recherche.</p>
          </div>
        )}
        
        <AddVehicleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} owners={owners} addVehicle={addVehicle} />
        {isDetailModalOpen && selectedVehicle && <VehicleDetailModal vehicle={selectedVehicle} rentals={rentals} maintenance={maintenanceRecords} contraventions={contraventions} owners={owners} accidents={accidents} onClose={handleCloseDetailModal} updateContraventionStatus={updateContraventionStatus} />}
      </div>
    );
};
