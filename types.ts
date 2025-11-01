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
  imageUrl: string;
  insuranceExpiry: string;
  nextMaintenance: string;
  technicalInspectionExpiry: string;
  currentMileage: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface Rental {
  id: string;
  vehicleId: string;
  clientId: string;
  driverId?: string;
  customerName: string;
  startDate: string;
  endDate: string;
  price: number;
  payments: Payment[];
  amountPaid: number;
  balanceDue: number;
  isCompleted: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  isAvailable: boolean;
}

export enum MaintenanceStatus {
  Todo = 'À faire',
  InProgress = 'En cours',
  Completed = 'Terminé',
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  mileage: number;
  partsReplaced: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export type View = 'dashboard' | 'vehicles' | 'rentals' | 'clients' | 'drivers' | 'maintenance' | 'accounting' | 'guide';