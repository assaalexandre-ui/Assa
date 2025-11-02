
import { Owner, Vehicle, Client, Rental, Accident, VehicleStatus, RentalStatus, AccidentStatus } from './types';

// --- SAMPLE DATA ---
export const SAMPLE_OWNER_ID = 'owner-1';

export const SAMPLE_OWNER: Owner = {
  id: SAMPLE_OWNER_ID,
  name: 'Propriétaire Exemple SARL',
  phone: '+221 77 123 45 67',
  email: 'proprio@exemple.com',
  paymentDetails: 'FR76 3000 4000 0500 0012 3456 789'
};

export const SAMPLE_VEHICLE_1: Vehicle = {
  id: 'vehicle-1',
  make: 'Toyota',
  model: 'Yaris',
  year: 2022,
  plate: 'AA-123-BB',
  status: VehicleStatus.Reserved,
  insuranceExpiry: new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split('T')[0],
  nextMaintenance: new Date(new Date().setDate(new Date().getDate() + 180)).toISOString().split('T')[0],
  technicalInspectionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  currentMileage: 15000,
  imageUrl: 'https://images.unsplash.com/photo-1617469737323-278de98a287c?q=80&w=1920&auto=format&fit=crop',
  ownerId: SAMPLE_OWNER_ID,
  purchaseValue: 8500000,
  purchaseDate: new Date('2022-01-15').toISOString().split('T')[0],
  amortizationRate: 20
};

export const SAMPLE_VEHICLE_2: Vehicle = {
  id: 'vehicle-2',
  make: 'Peugeot',
  model: '208',
  year: 2021,
  plate: 'BC-456-DE',
  status: VehicleStatus.Available,
  insuranceExpiry: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString().split('T')[0],
  nextMaintenance: new Date(new Date().setDate(new Date().getDate() + 300)).toISOString().split('T')[0],
  technicalInspectionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  currentMileage: 25000,
  imageUrl: 'https://images.unsplash.com/photo-1621007958618-3c3b02d7c8a6?q=80&w=1920&auto=format&fit=crop',
  ownerId: SAMPLE_OWNER_ID,
  purchaseValue: 9200000,
  purchaseDate: new Date('2021-03-20').toISOString().split('T')[0],
  amortizationRate: 20
};

export const SAMPLE_VEHICLE_3: Vehicle = {
  id: 'vehicle-3',
  make: 'Renault',
  model: 'Clio',
  year: 2020,
  plate: 'FG-789-HI',
  status: VehicleStatus.Maintenance,
  insuranceExpiry: new Date(new Date().setDate(new Date().getDate() + 365)).toISOString().split('T')[0],
  nextMaintenance: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
  technicalInspectionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
  currentMileage: 42000,
  imageUrl: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=1920&auto=format&fit=crop',
  ownerId: SAMPLE_OWNER_ID,
  purchaseValue: 7800000,
  purchaseDate: new Date('2020-07-10').toISOString().split('T')[0],
  amortizationRate: 18
};

export const SAMPLE_VEHICLE_4: Vehicle = {
  id: 'vehicle-4',
  make: 'Hyundai',
  model: 'Tucson',
  year: 2023,
  plate: 'JK-012-LM',
  status: VehicleStatus.Rented,
  insuranceExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
  nextMaintenance: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  technicalInspectionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
  currentMileage: 8000,
  imageUrl: 'https://images.unsplash.com/photo-1631125952131-74c107b36f7a?q=80&w=1920&auto=format&fit=crop',
  ownerId: SAMPLE_OWNER_ID,
  purchaseValue: 15500000,
  purchaseDate: new Date('2023-02-01').toISOString().split('T')[0],
  amortizationRate: 22
};

export const SAMPLE_CLIENT_1: Client = {
  id: 'client-1',
  name: 'Moussa Diop',
  phone: '+221 78 987 65 43',
  email: 'moussa.diop@client.com',
  licenseNumber: 'PERMIS-DK-2020-001',
  notes: 'Client fidèle, très soigneux avec les véhicules.'
};

export const SAMPLE_CLIENT_2: Client = {
  id: 'client-2',
  name: 'Aïssatou Gueye',
  phone: '+221 76 555 44 33',
  email: 'aissatou.gueye@client.com',
  licenseNumber: 'PERMIS-DK-2021-002',
};

export const SAMPLE_RENTAL_1: Rental = {
  id: 'rental-1',
  vehicleId: 'vehicle-1',
  clientId: 'client-1',
  customerName: 'Moussa Diop',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
  price: 175000,
  status: RentalStatus.Reserved,
  payments: [{ id: 'payment-1', date: new Date().toISOString().split('T')[0], amount: 50000 }],
  amountPaid: 50000,
  balanceDue: 125000
};

export const SAMPLE_RENTAL_2: Rental = {
  id: 'rental-2',
  vehicleId: 'vehicle-4',
  clientId: 'client-2',
  customerName: 'Aïssatou Gueye',
  startDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
  endDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
  price: 325000,
  status: RentalStatus.Active,
  payments: [{ id: 'payment-2', date: new Date().toISOString().split('T')[0], amount: 325000 }],
  amountPaid: 325000,
  balanceDue: 0
};

export const SAMPLE_ACCIDENT_1: Accident = {
    id: 'accident-1',
    vehicleId: 'vehicle-3',
    rentalId: 'rental-2',
    date: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0],
    description: 'Pare-choc avant heurté sur un parking. Rayures profondes.',
    severity: 'Léger',
    estimatedCost: 150000,
    status: AccidentStatus.Repaired,
    finalCost: 135000,
    replacedParts: 'Pare-choc avant'
};
