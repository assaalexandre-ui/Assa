import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { VehicleManagement } from './components/VehicleManagement';
import { RentalManagement } from './components/RentalManagement';
import { ClientManagement } from './components/ClientManagement';
import { DriverManagement } from './components/DriverManagement';
import { MaintenanceManagement } from './components/MaintenanceManagement';
import { Accounting } from './components/Accounting';
import { UserGuide } from './components/UserGuide';
import type { Vehicle, Rental, View, Client, Driver, MaintenanceRecord, Expense, Payment } from './types';
import { VehicleStatus, MaintenanceStatus } from './types';

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', make: 'Peugeot', model: '208', year: 2022, plate: 'AB-123-CD', status: VehicleStatus.Available, imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&auto=format&fit=crop', insuranceExpiry: '2025-05-10', nextMaintenance: '2024-11-20', technicalInspectionExpiry: '2024-08-30', currentMileage: 32000 },
  { id: 'v2', make: 'Renault', model: 'Clio V', year: 2023, plate: 'EF-456-GH', status: VehicleStatus.Rented, imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&auto=format&fit=crop', insuranceExpiry: '2025-08-15', nextMaintenance: '2025-02-15', technicalInspectionExpiry: '2025-01-20', currentMileage: 15000 },
  { id: 'v3', make: 'Citroën', model: 'C3', year: 2021, plate: 'IJ-789-KL', status: VehicleStatus.Maintenance, imageUrl: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?w=400&auto=format&fit=crop', insuranceExpiry: '2025-01-30', nextMaintenance: '2024-09-01', technicalInspectionExpiry: '2024-12-15', currentMileage: 55000 },
  { id: 'v4', make: 'Dacia', model: 'Sandero', year: 2023, plate: 'MN-012-OP', status: VehicleStatus.Available, imageUrl: 'https://images.unsplash.com/photo-1616421233882-d594a11c1625?w=400&auto=format&fit=crop', insuranceExpiry: '2025-10-22', nextMaintenance: '2025-04-22', technicalInspectionExpiry: '2024-07-25', currentMileage: 8000 },
];

const INITIAL_CLIENTS: Client[] = [
    { id: 'c1', name: 'Alice Martin', phone: '0612345678', email: 'alice.martin@email.com', licenseNumber: 'CL12345' },
    { id: 'c2', name: 'Bob Dupont', phone: '0787654321', email: 'bob.dupont@email.com', licenseNumber: 'CL67890' },
];

const INITIAL_DRIVERS: Driver[] = [
    { id: 'd1', name: 'Charles Durand', phone: '0611223344', licenseNumber: 'DRV123456', isAvailable: true },
    { id: 'd2', name: 'Diane Petit', phone: '0755667788', licenseNumber: 'DRV654321', isAvailable: false },
];

const INITIAL_RENTALS: Rental[] = [
  { id: 'r1', vehicleId: 'v2', clientId: 'c1', driverId: 'd2', customerName: 'Alice Martin', startDate: '2024-07-20', endDate: '2024-07-28', price: 150000, isCompleted: false, payments: [{id: 'p1', date: '2024-07-20', amount: 75000}], amountPaid: 75000, balanceDue: 75000 },
  { id: 'r2', vehicleId: 'v1', clientId: 'c2', customerName: 'Bob Dupont', startDate: '2024-06-15', endDate: '2024-06-22', price: 125000, isCompleted: true, payments: [{id: 'p2', date: '2024-06-15', amount: 125000}], amountPaid: 125000, balanceDue: 0 },
];

const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
    { id: 'm1', vehicleId: 'v3', date: '2024-09-01', description: 'Changement des freins', cost: 75000, status: MaintenanceStatus.InProgress, mileage: 45000, partsReplaced: 'Plaquettes de frein avant, Disques de frein avant' },
    { id: 'm2', vehicleId: 'v1', date: '2024-11-20', description: 'Vidange moteur', cost: 30000, status: MaintenanceStatus.Todo, mileage: 30000, partsReplaced: 'Filtre à huile, Huile moteur 5W30' },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', date: '2024-07-01', description: 'Loyer Bureau Juillet', category: 'Fonctionnement', amount: 250000 },
    { id: 'e2', date: '2024-07-15', description: 'Achat fournitures de bureau', category: 'Fournitures', amount: 45000 },
];

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('vehicles', INITIAL_VEHICLES);
  const [rentals, setRentals] = useLocalStorage<Rental[]>('rentals', INITIAL_RENTALS);
  const [clients, setClients] = useLocalStorage<Client[]>('clients', INITIAL_CLIENTS);
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('drivers', INITIAL_DRIVERS);
  const [maintenance, setMaintenance] = useLocalStorage<MaintenanceRecord[]>('maintenance', INITIAL_MAINTENANCE);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', INITIAL_EXPENSES);


  const addVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v${Date.now()}`,
    };
    setVehicles(prev => [...prev, newVehicle]);
  };

  const updateVehicleStatus = (id: string, status: VehicleStatus) => {
    setVehicles(prev => prev.map(v => (v.id === id ? { ...v, status } : v)));
  };

  const deleteVehicle = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.")) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      setRentals(prev => prev.filter(r => r.vehicleId !== id));
    }
  };

  const addClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = { ...clientData, id: `c${Date.now()}`};
    setClients(prev => [...prev, newClient]);
  }

  const deleteClient = (id: string) => {
     if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      setClients(prev => prev.filter(c => c.id !== id));
      setRentals(prev => prev.filter(r => r.clientId !== id));
    }
  }

  const addDriver = (driverData: Omit<Driver, 'id' | 'isAvailable'>) => {
    const newDriver: Driver = { ...driverData, id: `d${Date.now()}`, isAvailable: true };
    setDrivers(prev => [...prev, newDriver]);
  }

  const deleteDriver = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce chauffeur ?")) {
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  }
  
  const updateDriverAvailability = (id: string, isAvailable: boolean) => {
     setDrivers(prev => prev.map(d => (d.id === id ? { ...d, isAvailable } : d)));
  }

  const addRental = (rentalData: Omit<Rental, 'id' | 'isCompleted' | 'customerName' | 'payments' | 'amountPaid' | 'balanceDue'>) => {
    const client = clients.find(c => c.id === rentalData.clientId);
    if (!client) return;

    const newRental: Rental = {
      ...rentalData,
      id: `r${Date.now()}`,
      isCompleted: false,
      customerName: client.name,
      payments: [],
      amountPaid: 0,
      balanceDue: rentalData.price,
    };
    setRentals(prev => [...prev, newRental]);
    updateVehicleStatus(rentalData.vehicleId, VehicleStatus.Rented);
    if(rentalData.driverId) {
        updateDriverAvailability(rentalData.driverId, false);
    }
  };

  const completeRental = (id: string) => {
    let rentalToComplete: Rental | undefined;
    setRentals(prev => prev.map(r => {
      if (r.id === id) {
        rentalToComplete = r;
        return { ...r, isCompleted: true };
      }
      return r;
    }));
    if (rentalToComplete) {
      updateVehicleStatus(rentalToComplete.vehicleId, VehicleStatus.Available);
      if(rentalToComplete.driverId){
          updateDriverAvailability(rentalToComplete.driverId, true);
      }
    }
  };
  
  const addPaymentToRental = (rentalId: string, amount: number, date: string) => {
      setRentals(prevRentals =>
          prevRentals.map(rental => {
              if (rental.id === rentalId) {
                  const newPayment: Payment = {
                      id: `p${Date.now()}`,
                      date,
                      amount
                  };
                  const newPayments = [...rental.payments, newPayment];
                  const newAmountPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
                  const newBalanceDue = rental.price - newAmountPaid;

                  return {
                      ...rental,
                      payments: newPayments,
                      amountPaid: newAmountPaid,
                      balanceDue: newBalanceDue,
                  };
              }
              return rental;
          })
      );
  };

  // Maintenance functions
  const addMaintenance = (maintenanceData: Omit<MaintenanceRecord, 'id'>) => {
    const newMaintenance: MaintenanceRecord = { ...maintenanceData, id: `m${Date.now()}`};
    setMaintenance(prev => [...prev, newMaintenance]);
  };

  const updateMaintenanceStatus = (id: string, status: MaintenanceStatus) => {
    setMaintenance(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
  };

  const deleteMaintenance = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche de maintenance ?")) {
      setMaintenance(prev => prev.filter(m => m.id !== id));
    }
  };

  // Expense functions
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expenseData, id: `e${Date.now()}`};
    setExpenses(prev => [...prev, newExpense]);
  };
  
  const editExpense = (expenseData: Expense) => {
    setExpenses(prev => prev.map(e => e.id === expenseData.id ? expenseData : e));
  };
  
  const deleteExpense = (id: string) => {
     if (window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
        setExpenses(prev => prev.filter(e => e.id !== id));
     }
  };


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard vehicles={vehicles} rentals={rentals} clients={clients} drivers={drivers} />;
      case 'vehicles':
        return <VehicleManagement vehicles={vehicles} rentals={rentals} maintenanceRecords={maintenance} addVehicle={addVehicle} updateVehicleStatus={updateVehicleStatus} deleteVehicle={deleteVehicle} />;
      case 'rentals':
        return <RentalManagement rentals={rentals} vehicles={vehicles} clients={clients} drivers={drivers} addRental={addRental} completeRental={completeRental} addPaymentToRental={addPaymentToRental} />;
      case 'clients':
        return <ClientManagement clients={clients} addClient={addClient} deleteClient={deleteClient} />;
      case 'drivers':
        return <DriverManagement drivers={drivers} addDriver={addDriver} deleteDriver={deleteDriver} updateDriverAvailability={updateDriverAvailability} />;
      case 'maintenance':
        return <MaintenanceManagement maintenanceRecords={maintenance} vehicles={vehicles} addMaintenance={addMaintenance} updateMaintenanceStatus={updateMaintenanceStatus} deleteMaintenance={deleteMaintenance} />;
      case 'accounting':
        return <Accounting rentals={rentals} maintenanceRecords={maintenance} expenses={expenses} addExpense={addExpense} editExpense={editExpense} deleteExpense={deleteExpense}/>;
      case 'guide':
        return <UserGuide />;
      default:
        return <Dashboard vehicles={vehicles} rentals={rentals} clients={clients} drivers={drivers} />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 bg-gray-100 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;