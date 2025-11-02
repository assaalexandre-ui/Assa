
import React, { useState, useEffect, useMemo } from 'react';
import type { Rental, MaintenanceRecord, Expense, Vehicle } from '../types';
import { MaintenanceStatus } from '../types';
import { PlusIcon, DownloadIcon, PencilIcon, TrashIcon, SearchIcon } from './icons';
import Modal from './Modal';

// Déclarez jsPDF pour TypeScript car il est chargé via une balise script
declare const jspdf: any;

interface Transaction {
  id: string;
  type: 'revenue' | 'cost';
  date: string;
  description: string;
  amount: number;
  isEditable: boolean;
  rawData?: Expense;
  rentalId?: string;
}

interface StatCardProps {
  title: string;
  value: string;
  color: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, description }) => (
  <div className={`p-6 rounded-lg shadow-lg text-white ${color}`}>
    <p className="text-sm font-medium opacity-80">{title}</p>
    <p className="text-4xl font-bold mt-2">{value}</p>
    <p className="text-xs mt-2 opacity-90">{description}</p>
  </div>
);

const EXPENSE_CATEGORIES = ['Fonctionnement', 'Salaires', 'Carburant', 'Achat', 'Fournitures', 'Maintenance', 'Autre'];

const ExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (expense: Expense) => void;
  expenseToEdit: Expense | null;
}> = ({ isOpen, onClose, addExpense, editExpense, expenseToEdit }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fonctionnement');
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setDate(expenseToEdit.date);
    } else {
      // Reset form for adding new
      setDescription('');
      setCategory('Fonctionnement');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [expenseToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !category || Number(amount) <= 0) return;
    const expenseData = { date, description, category, amount: Number(amount) };

    if (expenseToEdit) {
        editExpense({ ...expenseData, id: expenseToEdit.id });
    } else {
        addExpense(expenseData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expenseToEdit ? "Modifier la dépense" : "Ajouter une nouvelle dépense"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700">Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
            <div><label className="block text-sm font-medium text-gray-700">Catégorie</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">{EXPENSE_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700">Montant (FCFA)</label><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
            <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
            <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">{expenseToEdit ? "Mettre à jour" : "Ajouter"}</button></div>
        </form>
    </Modal>
  );
};

const RevenueChart: React.FC<{ rentals: Rental[] }> = ({ rentals }) => {
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0);

    rentals.forEach(rental => {
        rental.payments.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getFullYear() === currentYear) {
                monthlyData[paymentDate.getMonth()] += payment.amount;
            }
        });
    });

    const maxRevenue = Math.max(...monthlyData, 1); // Avoid division by zero
    if (Math.max(...monthlyData) === 0) {
        return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Pas de revenus cette année pour afficher le graphique.</p></div>
    }

    const points = monthlyData.map((revenue, index) => {
        const x = (index / 11) * 100;
        const y = 100 - (revenue / maxRevenue) * 90; // 90% to leave space at top
        return `${x},${y}`;
    }).join(' ');

    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    return (
        <div className="p-4 relative">
            <svg viewBox="0 0 100 100" className="w-full h-64" preserveAspectRatio="none">
                {/* Y-Axis lines and labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                    <g key={v}>
                        <line x1="0" y1={100 - v * 90} x2="100" y2={100 - v * 90} stroke="#e5e7eb" strokeWidth="0.5" />
                        <text x="-1" y={100 - v * 90} dominantBaseline="middle" textAnchor="end" fontSize="3" fill="#6b7280">{`${(v * maxRevenue / 1000).toFixed(0)}k`}</text>
                    </g>
                ))}
                {/* Gradient */}
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <polygon fill="url(#revenueGradient)" points={`0,100 ${points} 100,100`}/>
                {/* Path */}
                <polyline fill="none" stroke="#ef4444" strokeWidth="1" points={points} />
                {/* X-Axis labels */}
                {monthLabels.map((label, index) => (
                     <text key={label} x={(index / 11) * 100} y="100" textAnchor="middle" fontSize="3" fill="#6b7280">{label}</text>
                ))}
            </svg>
        </div>
    )
}

interface AccountingProps {
  rentals: Rental[];
  maintenanceRecords: MaintenanceRecord[];
  expenses: Expense[];
  vehicles: Vehicle[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
}

type Tab = 'dashboard' | 'transactions' | 'reports';

export const Accounting: React.FC<AccountingProps> = ({ rentals, maintenanceRecords, expenses, vehicles, addExpense, editExpense, deleteExpense }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportDateFilter, setReportDateFilter] = useState('this_year');
  
  const handleAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };
  
  const transactions: Transaction[] = useMemo(() => [
    ...rentals.flatMap(r => r.payments.map(p => ({ id: p.id, type: 'revenue' as const, date: p.date, description: `Paiement Location ${r.customerName}`, amount: p.amount, isEditable: false, rentalId: r.id }))),
    ...maintenanceRecords.filter(m => m.status === MaintenanceStatus.Completed).map(m => ({ id: m.id, type: 'cost' as const, date: m.date, description: `Maintenance: ${m.description}`, amount: -m.cost, isEditable: false })),
    ...expenses.map(e => ({ id: e.id, type: 'cost' as const, date: e.date, description: `${e.category}: ${e.description}`, amount: -e.amount, isEditable: true, rawData: e }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [rentals, maintenanceRecords, expenses]);
  
  const getTransactionCategory = (transaction: Transaction): string => {
      if (transaction.type === 'revenue') return 'Revenu';
      if (transaction.isEditable && transaction.rawData) return transaction.rawData.category;
      if (transaction.description.startsWith('Maintenance')) return 'Maintenance';
      return 'Autre';
  };
  
  const allCategories = useMemo(() => ['Revenu', ...EXPENSE_CATEGORIES], []);

  const filteredTransactions = useMemo(() => transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const today = new Date();
    
    let matchesDate = true;
    switch(dateFilter) {
        case 'this_month':
            matchesDate = txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
            break;
        case 'this_year':
            matchesDate = txDate.getFullYear() === today.getFullYear();
            break;
    }

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const txCategory = getTransactionCategory(tx);
    const matchesCategory = categoryFilter === 'all' || txCategory === categoryFilter;
    const matchesSearch = searchQuery === '' || tx.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesType && matchesCategory && matchesSearch;
  }), [transactions, dateFilter, typeFilter, categoryFilter, searchQuery]);

  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, r) => sum + r.amount, 0);
  const totalCosts = Math.abs(transactions.filter(t => t.type === 'cost').reduce((sum, c) => sum + c.amount, 0));
  const netProfit = totalRevenue - totalCosts;

    const exportToCSV = () => {
        const headers = ['Date', 'Description', 'Montant (FCFA)', 'Type', 'Catégorie'];
        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(tx => {
                const row = [
                    new Date(tx.date).toLocaleDateString('fr-FR'),
                    `"${tx.description.replace(/"/g, '""')}"`,
                    tx.amount,
                    tx.type,
                    getTransactionCategory(tx)
                ];
                return row.join(',');
            })
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'transactions-carmixt.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const TabButton: React.FC<{tab: Tab, label: string}> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <StatCard title="Revenu Total Brut" value={`${totalRevenue.toLocaleString('fr-FR')} FCFA`} color="bg-green-500" description="Historique complet des revenus."/>
                            <StatCard title="Coûts Totaux" value={`${totalCosts.toLocaleString('fr-FR')} FCFA`} color="bg-red-500" description="Historique complet des coûts."/>
                            <StatCard title="Bénéfice Net Global" value={`${netProfit.toLocaleString('fr-FR')} FCFA`} color="bg-blue-500" description="Performance globale de l'entreprise."/>
                        </div>
                        <div className="p-6 bg-white rounded-lg shadow-md">
                           <h2 className="text-xl font-semibold text-gray-700 mb-2">Revenus par mois ({new Date().getFullYear()})</h2>
                           <RevenueChart rentals={rentals} />
                        </div>
                    </>
                );
            case 'transactions':
                return (
                    <div className="p-6 bg-white rounded-lg shadow-md">
                        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-700 w-full sm:w-auto">Flux de Trésorerie</h2>
                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-grow sm:flex-grow-0">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-4 h-4 text-gray-400" /></div>
                                    <input type="text" placeholder="Recherche..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-sm border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"/>
                                </div>
                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"><option value="all">Toutes les catégories</option>{allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"><option value="all">Tous les types</option><option value="revenue">Revenus</option><option value="cost">Dépenses</option></select>
                                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                                   <button onClick={() => setDateFilter('all')} className={`px-3 py-1 text-sm rounded-md ${dateFilter === 'all' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>Tout</button>
                                   <button onClick={() => setDateFilter('this_month')} className={`px-3 py-1 text-sm rounded-md ${dateFilter === 'this_month' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>Ce mois-ci</button>
                                   <button onClick={() => setDateFilter('this_year')} className={`px-3 py-1 text-sm rounded-md ${dateFilter === 'this_year' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>Cette année</button>
                                </div>
                            </div>
                        </div>
                        {transactions.length > 0 ? (
                            <div className="overflow-y-auto max-h-[500px]">
                                <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTransactions.map((tx) => (
                                            <tr key={`${tx.id}-${tx.rawData?.id || ''}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount.toLocaleString('fr-FR')} FCFA</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {tx.isEditable && tx.rawData && (<div className="flex justify-end space-x-2"><button onClick={() => handleEditExpense(tx.rawData as Expense)} className="text-gray-400 hover:text-blue-600"><PencilIcon className="w-4 h-4"/></button><button onClick={() => deleteExpense(tx.id)} className="text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button></div>)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredTransactions.length === 0 && (<p className="text-center text-gray-500 py-8">Aucune transaction ne correspond à vos filtres.</p>)}
                            </div>
                        ) : (<p className="text-center text-gray-500 py-4">Aucune transaction terminée à afficher.</p>)}
                    </div>
                );
            case 'reports':
                const reportTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.date);
                    const today = new Date();
                    switch (reportDateFilter) {
                        case 'this_month': return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
                        case 'this_year': return txDate.getFullYear() === today.getFullYear();
                        default: return true;
                    }
                });

                const reportRevenue = reportTransactions.filter(t => t.type === 'revenue').reduce((sum, r) => sum + r.amount, 0);
                const reportCosts = Math.abs(reportTransactions.filter(t => t.type === 'cost').reduce((sum, c) => sum + c.amount, 0));
                const reportNetProfit = reportRevenue - reportCosts;

                const revenueByVehicle = vehicles.map(vehicle => {
                    const vehicleRevenue = rentals
                        .filter(r => r.vehicleId === vehicle.id)
                        .flatMap(r => r.payments)
                        .filter(p => {
                            const pDate = new Date(p.date);
                            const today = new Date();
                            switch (reportDateFilter) {
                                case 'this_month': return pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
                                case 'this_year': return pDate.getFullYear() === today.getFullYear();
                                default: return true;
                            }
                        })
                        .reduce((sum, p) => sum + p.amount, 0);
                    return { vehicleName: `${vehicle.make} ${vehicle.model}`, revenue: vehicleRevenue };
                }).filter(item => item.revenue > 0).sort((a,b) => b.revenue - a.revenue);

                const exportPDF = () => {
                    const doc = new jspdf.jsPDF();
                    const periodText = { 'all': 'Tout l\'historique', 'this_month': 'Ce mois-ci', 'this_year': 'Cette année' }[reportDateFilter];
                    doc.text(`Rapport Financier - ${periodText}`, 14, 16);
                    
                    jspdf.autoTable(doc, {
                      startY: 22,
                      head: [['Indicateur', 'Valeur (FCFA)']],
                      body: [
                        ['Revenu Total Brut', reportRevenue.toLocaleString('fr-FR')],
                        ['Coûts Totaux', reportCosts.toLocaleString('fr-FR')],
                        ['Bénéfice Net', reportNetProfit.toLocaleString('fr-FR')],
                      ],
                    });
                
                    jspdf.autoTable(doc, {
                      startY: (doc).lastAutoTable.finalY + 10,
                      head: [['Véhicule', 'Revenu Généré (FCFA)']],
                      body: revenueByVehicle.map(item => [item.vehicleName, item.revenue.toLocaleString('fr-FR')]),
                    });
                
                    doc.save(`rapport-tresorerie-${reportDateFilter}.pdf`);
                }

                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <label className="font-medium">Période du rapport :</label>
                                <select value={reportDateFilter} onChange={(e) => setReportDateFilter(e.target.value)} className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm">
                                    <option value="all">Tout l'historique</option>
                                    <option value="this_month">Ce mois-ci</option>
                                    <option value="this_year">Cette année</option>
                                </select>
                            </div>
                            <button onClick={exportPDF} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"><DownloadIcon className="w-5 h-5 mr-2"/>Exporter en PDF</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 bg-white rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4">Résumé Financier</h3>
                                <table className="min-w-full">
                                    <tbody>
                                        <tr className="border-b"><td className="py-2 text-gray-600">Revenu Total Brut</td><td className="py-2 text-right font-semibold text-green-600">{reportRevenue.toLocaleString('fr-FR')} FCFA</td></tr>
                                        <tr className="border-b"><td className="py-2 text-gray-600">Coûts Totaux</td><td className="py-2 text-right font-semibold text-red-600">{reportCosts.toLocaleString('fr-FR')} FCFA</td></tr>
                                        <tr><td className="pt-2 font-bold">Bénéfice Net</td><td className="pt-2 text-right font-bold text-lg">{reportNetProfit.toLocaleString('fr-FR')} FCFA</td></tr>
                                    </tbody>
                                </table>
                           </div>
                           <div className="p-6 bg-white rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4">Revenus par Véhicule</h3>
                                <div className="max-h-64 overflow-y-auto">
                                <table className="min-w-full">
                                    <thead className="sticky top-0 bg-gray-50"><tr><th className="py-2 text-left text-sm font-medium text-gray-500">Véhicule</th><th className="py-2 text-right text-sm font-medium text-gray-500">Revenu (FCFA)</th></tr></thead>
                                    <tbody>
                                        {revenueByVehicle.map((item, index) => <tr key={index} className="border-b"><td className="py-2">{item.vehicleName}</td><td className="py-2 text-right font-medium">{item.revenue.toLocaleString('fr-FR')}</td></tr>)}
                                    </tbody>
                                </table>
                                {revenueByVehicle.length === 0 && <p className="text-center text-gray-500 pt-4">Aucun revenu pour cette période.</p>}
                                </div>
                           </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }


  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Finance & Trésorerie</h1>
        <div className="flex items-center space-x-2">
            <button onClick={handleAddExpense} className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"><PlusIcon className="w-5 h-5 mr-2"/>Ajouter Dépense</button>
            <button onClick={exportToCSV} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"><DownloadIcon className="w-5 h-5 mr-2"/>Exporter Transactions (CSV)</button>
        </div>
      </div>

      <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-2" aria-label="Tabs">
               <TabButton tab="dashboard" label="Synthèse" />
               <TabButton tab="transactions" label="Transactions" />
               <TabButton tab="reports" label="Rapports" />
            </nav>
        </div>

      <div className="space-y-8">
        {renderContent()}
      </div>

      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} addExpense={addExpense} editExpense={editExpense} expenseToEdit={expenseToEdit} />
    </div>
  );
};
