
export type View = 'dashboard' | 'vehicles' | 'rentals' | 'calendar' | 'clients' | 'owners' | 'maintenance' | 'accounting' | 'guide';

export enum VehicleStatus {
  Available = 'Disponible',
  Rented = 'Loué',
  Maintenance = 'En Maintenance',
  Reserved = 'Réservé',
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  status: VehicleStatus;
  insuranceExpiry: string; // ISO date string
  nextMaintenance: string; // ISO date string
  technicalInspectionExpiry: string; // ISO date string
  currentMileage: number;
  imageUrl: string;
  ownerId: string;
  purchaseValue: number;
  purchaseDate: string; // ISO date string
  amortizationRate: number; // percentage per year
  insuranceDocumentUrl?: string;
  technicalInspectionDocumentUrl?: string;
  registrationDocumentUrl?: string; // Carte Grise
}

export enum RentalStatus {
  Reserved = 'Réservé',
  Active = 'Active',
  Completed = 'Terminée',
}

export interface Payment {
  id: string;
  date: string; // ISO date string
  amount: number;
}

export interface Rental {
  id:string;
  vehicleId: string;
  clientId: string;
  driverId?: string;
  affiliateId?: string;
  customerName: string; // Denormalized for easy access
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  price: number;
  status: RentalStatus;
  payments: Payment[];
  amountPaid: number;
  balanceDue: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  notes?: string;
  imageUrl?: string;
  idDocumentUrl?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  isAvailable: boolean;
}

export interface Owner {
    id: string;
    name: string;
    phone: string;
    email: string;
    paymentDetails: string;
    imageUrl?: string;
}

export interface Affiliate {
    id: string;
    name: string;
    phone: string;
    commissionRate: number;
    imageUrl?: string;
}

export enum MaintenanceStatus {
    Todo = 'À faire',
    InProgress = 'En cours',
    Completed = 'Terminé',
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  description: string;
  date: string; // ISO date string
  cost: number;
  status: MaintenanceStatus;
  mileage: number;
  partsReplaced?: string;
  garage?: string;
}

export enum ContraventionStatus {
    Unpaid = 'Non payé',
    Paid = 'Payé',
    Disputed = 'Contesté',
}

export interface Contravention {
    id: string;
    vehicleId: string;
    rentalId?: string;
    description: string;
    date: string;
    amount: number;
    status: ContraventionStatus;
}

export enum AccidentStatus {
    Pending = 'En attente d\'expertise',
    InProgress = 'En réparation',
    Repaired = 'Réparé',
    Closed = 'Clos',
}

export interface Accident {
    id: string;
    vehicleId: string;
    rentalId?: string;
    date: string; // ISO date string
    description: string;
    severity: 'Léger' | 'Modéré' | 'Grave';
    estimatedCost: number;
    finalCost?: number;
    status: AccidentStatus;
    insuranceClaimId?: string;
    repairedParts?: string;
    replacedParts?: string;
    mileage?: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface HistoryLog {
    id: string;
    timestamp: string; // ISO datetime string
    entity: 'vehicle' | 'client' | 'driver' | 'rental' | 'maintenance' | 'contravention' | 'owner' | 'affiliate' | 'accident';
    entityId: string;
    details: string;
}