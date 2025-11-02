
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { VehicleManagement } from './components/VehicleManagement';
import { RentalManagement } from './components/RentalManagement';
import CalendarView from './components/CalendarView';
import { ClientManagement } from './components/ClientManagement';
import { OwnerManagement } from './components/OwnerManagement';
import { MaintenanceManagement } from './components/MaintenanceManagement';
import { Accounting } from './components/Accounting';
import { UserGuide } from './components/UserGuide';
import type {
  View, Vehicle, Rental, Client, Driver, Owner, Affiliate, MaintenanceRecord, Contravention, Expense, HistoryLog, Payment, Accident
} from './types';
import {
  VehicleStatus, RentalStatus, MaintenanceStatus, ContraventionStatus, AccidentStatus
} from './types';

export interface Alert {
    vehicle: Vehicle;
    type: string;
    daysLeft: number;
}

// MOCK API URL - REMPLACEZ CETTE URL PAR CELLE DE VOTRE BACKEND DÉPLOYÉ
const API_BASE_URL = 'https://votre-api-backend.com/api';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [contraventions, setContraventions] = useState<Contravention[]>([]);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Dans une vraie application, vous feriez des appels fetch pour chaque ressource
      // Pour la démonstration, nous allons continuer à utiliser les données d'exemple.
      // const vehiclesRes = await fetch(`${API_BASE_URL}/vehicles`);
      // setVehicles(await vehiclesRes.json());
      // ... autres appels
      
      // Utilisation des données d'exemple pour que l'app continue de fonctionner
      const { SAMPLE_OWNER, SAMPLE_VEHICLE_1, SAMPLE_VEHICLE_2, SAMPLE_VEHICLE_3, SAMPLE_VEHICLE_4, SAMPLE_CLIENT_1, SAMPLE_CLIENT_2, SAMPLE_RENTAL_1, SAMPLE_RENTAL_2, SAMPLE_ACCIDENT_1 } = await import('./sampleData');
      setOwners([SAMPLE_OWNER]);
      setVehicles([SAMPLE_VEHICLE_1, SAMPLE_VEHICLE_2, SAMPLE_VEHICLE_3, SAMPLE_VEHICLE_4]);
      setClients([SAMPLE_CLIENT_1, SAMPLE_CLIENT_2]);
      setRentals([SAMPLE_RENTAL_1, SAMPLE_RENTAL_2]);
      setAccidents([SAMPLE_ACCIDENT_1]);

    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Impossible de charger les données. Veuillez vérifier votre connexion et l'état du serveur.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const alerts: Alert[] = useMemo(() => {
    const calculatedAlerts: Alert[] = [];
    const alertDays = 30;

    vehicles.forEach(v => {
        const checkDate = (dateStr: string, type: string) => {
            if (!dateStr) return;
            const expiryDate = new Date(dateStr);
            expiryDate.setHours(0,0,0,0);
            const todayDateOnly = new Date();
            todayDateOnly.setHours(0,0,0,0);

            const diffTime = expiryDate.getTime() - todayDateOnly.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= alertDays && diffDays >= 0) {
                calculatedAlerts.push({ vehicle: v, type, daysLeft: diffDays });
            }
        };

        checkDate(v.insuranceExpiry, 'Assurance');
        checkDate(v.nextMaintenance, 'Maintenance');
        checkDate(v.technicalInspectionExpiry, 'Visite Technique');
    });
    return calculatedAlerts.sort((a,b) => a.daysLeft - b.daysLeft);
  }, [vehicles]);
  
  // Fonctions CRUD adaptées pour une API
  // Note: La logique de mise à jour de l'état local est optimiste (met à jour l'UI avant la confirmation du serveur)
  // pour une meilleure expérience utilisateur.

  const addHistoryLog = async (entity: HistoryLog['entity'], entityId: string, details: string) => {
    // Cette fonction devrait aussi faire un appel API, mais pour la simplicité, on garde la logique locale.
    const newLog: Omit<HistoryLog, 'id'> = {
      timestamp: new Date().toISOString(),
      entity,
      entityId,
      details,
    };
    // const response = await fetch(`${API_BASE_URL}/history`, { method: 'POST', body: JSON.stringify(newLog), headers: {'Content-Type': 'application/json'} });
    // const savedLog = await response.json();
    setHistory(prev => [{ ...newLog, id: Math.random().toString() }, ...prev]);
  };
  
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    // const response = await fetch(`${API_BASE_URL}/vehicles`, { method: 'POST', body: JSON.stringify(vehicle), headers: {'Content-Type': 'application/json'} });
    // const newVehicle = await response.json();
    const newVehicle = { ...vehicle, id: Math.random().toString() }; // Simulé
    setVehicles(prev => [...prev, newVehicle]);
    addHistoryLog('vehicle', newVehicle.id, `Véhicule ${vehicle.make} ${vehicle.model} ajouté.`);
  };

  const updateVehicleStatus = async (id: string, status: VehicleStatus) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    // await fetch(`${API_BASE_URL}/vehicles/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }), headers: {'Content-Type': 'application/json'} });
    addHistoryLog('vehicle', id, `Statut mis à jour à ${status}.`);
  };
  
  const deleteVehicle = async (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    // await fetch(`${API_BASE_URL}/vehicles/${id}`, { method: 'DELETE' });
    addHistoryLog('vehicle', id, `Véhicule supprimé.`);
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    // const response = await fetch(`${API_BASE_URL}/clients`, { method: 'POST', body: JSON.stringify(client), headers: {'Content-Type': 'application/json'} });
    // const newClient = await response.json();
    const newClient = { ...client, id: Math.random().toString() }; // Simulé
    setClients(prev => [...prev, newClient]);
    addHistoryLog('client', newClient.id, `Client ${client.name} ajouté.`);
  };

  const editClient = async (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    // await fetch(`${API_BASE_URL}/clients/${updatedClient.id}`, { method: 'PUT', body: JSON.stringify(updatedClient), headers: {'Content-Type': 'application/json'} });
    addHistoryLog('client', updatedClient.id, `Client ${updatedClient.name} modifié.`);
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    // await fetch(`${API_BASE_URL}/clients/${id}`, { method: 'DELETE' });
    addHistoryLog('client', id, `Client supprimé.`);
  };
  
  const addRental = async (rentalData: Omit<Rental, 'id' | 'payments' | 'amountPaid' | 'balanceDue' | 'status'>) => {
    // const response = await fetch(`${API_BASE_URL}/rentals`, { method: 'POST', body: JSON.stringify(rentalData), headers: {'Content-Type': 'application/json'} });
    // const newRental = await response.json();
    const newRental: Rental = {
      ...rentalData,
      id: Math.random().toString(),
      status: RentalStatus.Reserved,
      payments: [],
      amountPaid: 0,
      balanceDue: rentalData.price,
    }; // Simulé
    setRentals(prev => [...prev, newRental]);
    setVehicles(prev => prev.map(v => v.id === rentalData.vehicleId ? {...v, status: VehicleStatus.Reserved} : v));
    addHistoryLog('rental', newRental.id, `Location créée pour ${rentalData.customerName}.`);
  };

  const updateRentalStatus = async (id: string, status: RentalStatus) => {
      const rental = rentals.find(r => r.id === id);
      if (!rental) return;

      let newVehicleStatus: VehicleStatus | null = null;
      if (status === RentalStatus.Active) newVehicleStatus = VehicleStatus.Rented;
      else if (status === RentalStatus.Reserved) newVehicleStatus = VehicleStatus.Reserved;
      else if (status === RentalStatus.Completed) newVehicleStatus = VehicleStatus.Available;

      setRentals(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (newVehicleStatus) {
        setVehicles(prev => prev.map(v => v.id === rental.vehicleId ? { ...v, status: newVehicleStatus! } : v));
      }

      // await fetch(`${API_BASE_URL}/rentals/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }), headers: {'Content-Type': 'application/json'} });
      addHistoryLog('rental', id, `Statut de location mis à jour à ${status}.`);
  };

  const deleteRental = async (id: string) => {
    const rentalToDelete = rentals.find(r => r.id === id);
    if (rentalToDelete) {
        setRentals(prev => prev.filter(r => r.id !== id));
        setVehicles(prev => prev.map(v => v.id === rentalToDelete.vehicleId ? {...v, status: VehicleStatus.Available} : v));
        // await fetch(`${API_BASE_URL}/rentals/${id}`, { method: 'DELETE' });
        addHistoryLog('rental', id, `Location supprimée.`);
    }
  };
  
  const addPayment = async (rentalId: string, payment: Omit<Payment, 'id'>) => {
    // const response = await fetch(`${API_BASE_URL}/rentals/${rentalId}/payments`, { method: 'POST', body: JSON.stringify(payment), headers: {'Content-Type': 'application/json'} });
    // const updatedRental = await response.json();
    // setRentals(prev => prev.map(r => r.id === rentalId ? updatedRental : r));

    const newPayment = { ...payment, id: Math.random().toString() }; // Simulé
    setRentals(prev => prev.map(r => {
      if (r.id === rentalId) {
        const newAmountPaid = r.amountPaid + newPayment.amount;
        return {
          ...r,
          payments: [...r.payments, newPayment],
          amountPaid: newAmountPaid,
          balanceDue: r.price - newAmountPaid
        };
      }
      return r;
    }));
    addHistoryLog('rental', rentalId, `Paiement de ${payment.amount} FCFA ajouté.`);
  };

  // Les autres fonctions suivraient le même modèle (mise à jour optimiste de l'état, puis appel fetch)
  // Pour la concision, seule la logique de mise à jour de l'état est conservée pour les fonctions restantes.

  const addMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord = { ...record, id: Math.random().toString() };
    setMaintenanceRecords(prev => [newRecord, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addHistoryLog('maintenance', newRecord.id, `Maintenance planifiée pour le véhicule.`);
  };
  const updateMaintenanceStatus = (id: string, status: MaintenanceStatus) => {
    setMaintenanceRecords(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    addHistoryLog('maintenance', id, `Statut de maintenance mis à jour à ${status}.`);
  };
  const deleteMaintenance = (id: string) => {
    setMaintenanceRecords(prev => prev.filter(m => m.id !== id));
    addHistoryLog('maintenance', id, `Tâche de maintenance supprimée.`);
  };
  const addContravention = (contravention: Omit<Contravention, 'id'>) => {
    const newContravention = { ...contravention, id: Math.random().toString() };
    setContraventions(prev => [newContravention, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addHistoryLog('contravention', newContravention.id, `Contravention ajoutée.`);
  };
  const updateContraventionStatus = (id: string, status: ContraventionStatus) => {
    setContraventions(prev => prev.map(c => c.id === id ? { ...c, status } : c));
     addHistoryLog('contravention', id, `Statut de contravention mis à jour à ${status}.`);
  };
  const deleteContravention = (id: string) => {
    setContraventions(prev => prev.filter(c => c.id !== id));
     addHistoryLog('contravention', id, `Contravention supprimée.`);
  };
  const addOwner = (owner: Omit<Owner, 'id'>) => {
    const newOwner = { ...owner, id: Math.random().toString() };
    setOwners(prev => [...prev, newOwner]);
    addHistoryLog('owner', newOwner.id, `Propriétaire ${owner.name} ajouté.`);
  };
  const deleteOwner = (id: string) => {
    setOwners(prev => prev.filter(o => o.id !== id));
    addHistoryLog('owner', id, `Propriétaire supprimé.`);
  };
  const addDriver = (driver: Omit<Driver, 'id' | 'isAvailable'>) => {
    const newDriver = { ...driver, id: Math.random().toString(), isAvailable: true };
    setDrivers(prev => [...prev, newDriver]);
    addHistoryLog('driver', newDriver.id, `Chauffeur ${driver.name} ajouté.`);
  };
  const updateDriverAvailability = (id: string, isAvailable: boolean) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, isAvailable } : d));
     addHistoryLog('driver', id, `Disponibilité du chauffeur mise à jour.`);
  };
  const deleteDriver = (id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
    addHistoryLog('driver', id, `Chauffeur supprimé.`);
  };
  const addAffiliate = (affiliate: Omit<Affiliate, 'id'>) => {
    const newAffiliate = { ...affiliate, id: Math.random().toString() };
    setAffiliates(prev => [...prev, newAffiliate]);
    addHistoryLog('affiliate', newAffiliate.id, `Partenaire ${affiliate.name} ajouté.`);
  };
  const deleteAffiliate = (id: string) => {
    setAffiliates(prev => prev.filter(a => a.id !== id));
     addHistoryLog('affiliate', id, `Partenaire supprimé.`);
  };
  const addAccident = (accident: Omit<Accident, 'id'>) => {
    const newAccident = { ...accident, id: Math.random().toString() };
    setAccidents(prev => [newAccident, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addHistoryLog('accident', newAccident.id, `Accident déclaré pour le véhicule.`);
  };
  const updateAccidentStatus = (id: string, status: AccidentStatus) => {
    setAccidents(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    addHistoryLog('accident', id, `Statut de l'accident mis à jour à ${status}.`);
  };
  const deleteAccident = (id: string) => {
    setAccidents(prev => prev.filter(a => a.id !== id));
    addHistoryLog('accident', id, `Dossier d'accident supprimé.`);
  };
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Math.random().toString() };
    setExpenses(prev => [...prev, newExpense].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  const editExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };
  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const renderView = () => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><p className="text-xl">Chargement des données...</p></div>;
    }
    if (error) {
        return <div className="flex items-center justify-center h-full"><p className="text-xl text-red-500">{error}</p></div>;
    }
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard vehicles={vehicles} rentals={rentals} clients={clients} drivers={drivers} owners={owners} affiliates={affiliates} contraventions={contraventions} history={history} />;
      case 'vehicles':
        return <VehicleManagement vehicles={vehicles} rentals={rentals} maintenanceRecords={maintenanceRecords} contraventions={contraventions} owners={owners} accidents={accidents} addVehicle={addVehicle} updateVehicleStatus={updateVehicleStatus} deleteVehicle={deleteVehicle} updateContraventionStatus={updateContraventionStatus} />;
      case 'rentals':
        return <RentalManagement 
                    rentals={rentals} 
                    vehicles={vehicles} 
                    clients={clients} 
                    drivers={drivers} 
                    affiliates={affiliates} 
                    contraventions={contraventions} 
                    addRental={addRental} 
                    updateRentalStatus={updateRentalStatus} 
                    deleteRental={deleteRental} 
                    addPayment={addPayment}
                    addDriver={addDriver}
                    deleteDriver={deleteDriver}
                    updateDriverAvailability={updateDriverAvailability}
                    addAffiliate={addAffiliate}
                    deleteAffiliate={deleteAffiliate}
                    addContravention={addContravention}
                    updateContraventionStatus={updateContraventionStatus}
                    deleteContravention={deleteContravention}
                />;
      case 'calendar':
        return <CalendarView rentals={rentals} vehicles={vehicles} maintenanceRecords={maintenanceRecords} />;
      case 'clients':
        return <ClientManagement clients={clients} rentals={rentals} history={history} addClient={addClient} editClient={editClient} deleteClient={deleteClient}/>;
      case 'owners':
          return <OwnerManagement owners={owners} addOwner={addOwner} deleteOwner={deleteOwner}/>;
      case 'maintenance':
        return <MaintenanceManagement 
                    maintenanceRecords={maintenanceRecords} 
                    vehicles={vehicles} 
                    addMaintenance={addMaintenance} 
                    updateMaintenanceStatus={updateMaintenanceStatus} 
                    deleteMaintenance={deleteMaintenance}
                    accidents={accidents}
                    rentals={rentals}
                    clients={clients}
                    addAccident={addAccident}
                    updateAccidentStatus={updateAccidentStatus}
                    deleteAccident={deleteAccident}
                />;
      case 'accounting':
        return <Accounting rentals={rentals} maintenanceRecords={maintenanceRecords} expenses={expenses} vehicles={vehicles} addExpense={addExpense} editExpense={editExpense} deleteExpense={deleteExpense} />;
      case 'guide':
        return <UserGuide />;
      default:
        return <Dashboard vehicles={vehicles} rentals={rentals} clients={clients} drivers={drivers} owners={owners} affiliates={affiliates} contraventions={contraventions} history={history} />;
    }
  };

  return (
    <div className="flex h-screen font-sans bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        alerts={alerts}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
