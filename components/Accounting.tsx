import React, { useState, useEffect } from 'react';
import type { Rental, MaintenanceRecord, Expense } from '../types';
import { MaintenanceStatus } from '../types';
import { PlusIcon, DownloadIcon, PencilIcon, TrashIcon } from './icons';
import Modal from './Modal';

// Déclarez jsPDF pour TypeScript car il est chargé via une balise script
declare const jspdf: any;

// FIX: Define a Transaction type to include optional rawData for expenses.
interface Transaction {
  id: string;
  type: 'revenue' | 'cost';
  date: string;
  description: string;
  amount: number;
  isEditable: boolean;
  rawData?: Expense;
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
    // FIX: Use Number() to allow comparison with string|number type.
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
            <div><label className="block text-sm font-medium text-gray-700">Catégorie</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"><option>Fonctionnement</option><option>Salaires</option><option>Carburant</option><option>Achat</option><option>Fournitures</option><option>Maintenance</option><option>Autre</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700">Montant (FCFA)</label><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required min="1" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
            <div><label className="block text-sm font-medium text-gray-700">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500"/></div>
            <div className="flex justify-end pt-4"><button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Annuler</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">{expenseToEdit ? "Mettre à jour" : "Ajouter"}</button></div>
        </form>
    </Modal>
  );
};

const ExpenseChart: React.FC<{ data: { category: string; amount: number }[] }> = ({ data }) => {
    if (data.length === 0) {
        return <div className="flex items-center justify-center h-full"><p className="text-center text-gray-500 py-8">Aucune dépense à afficher pour cette période.</p></div>;
    }
    const maxAmount = Math.max(...data.map(d => d.amount));
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500'];
    return (
        <div className="space-y-4 p-4">
            {data.sort((a,b) => b.amount - a.amount).map((item, index) => (
                <div key={item.category}>
                    <div className="flex justify-between items-center mb-1"><span className="text-sm font-medium text-gray-700">{item.category}</span><span className="text-sm font-semibold text-gray-800">{item.amount.toLocaleString('fr-FR')} FCFA</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-4"><div className={`h-4 rounded-full ${colors[index % colors.length]}`} style={{ width: `${(item.amount / maxAmount) * 100}%` }}></div></div>
                </div>
            ))}
        </div>
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

    const maxRevenue = Math.max(...monthlyData);
    if (maxRevenue === 0) {
        return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Pas de revenus cette année pour afficher le graphique.</p></div>
    }

    const points = monthlyData.map((revenue, index) => {
        const x = (index / 11) * 100;
        const y = 100 - (revenue / maxRevenue) * 90; // 90% to leave space at top
        return `${x},${y}`;
    }).join(' ');

    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    return (
        <div className="p-4">
            <svg viewBox="0 0 100 100" className="w-full h-64" preserveAspectRatio="none">
                {/* Y-Axis lines and labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                    <g key={v}>
                        <line x1="0" y1={100 - v * 90} x2="100" y2={100 - v * 90} stroke="#e5e7eb" strokeWidth="0.5" />
                        <text x="-1" y={100 - v * 90} dominantBaseline="middle" textAnchor="end" fontSize="3" fill="#6b7280">{`${(v * maxRevenue / 1000).toFixed(0)}k`}</text>
                    </g>
                ))}
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
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
}

export const Accounting: React.FC<AccountingProps> = ({ rentals, maintenanceRecords, expenses, addExpense, editExpense, deleteExpense }) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const handleAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };
  
  const transactions: Transaction[] = [
    ...rentals.flatMap(r => r.payments.map(p => ({ id: p.id, type: 'revenue', date: p.date, description: `Paiement Location ${r.customerName}`, amount: p.amount, isEditable: false }))),
    ...maintenanceRecords.filter(m => m.status === MaintenanceStatus.Completed).map(m => ({ id: m.id, type: 'cost', date: m.date, description: `Maintenance: ${m.description}`, amount: -m.cost, isEditable: false })),
    ...expenses.map(e => ({ id: e.id, type: 'cost', date: e.date, description: `${e.category}: ${e.description}`, amount: -e.amount, isEditable: true, rawData: e }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = transactions.filter(tx => {
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
        case 'all':
        default:
            matchesDate = true;
            break;
    }

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesDate && matchesType;
  });

  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, r) => sum + r.amount, 0);
  const totalCosts = Math.abs(transactions.filter(t => t.type === 'cost').reduce((sum, c) => sum + c.amount, 0));
  const netProfit = totalRevenue - totalCosts;

  const currentYear = new Date().getFullYear();
  const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
  const yearRevenue = yearTransactions.filter(t => t.type === 'revenue').reduce((sum, r) => sum + r.amount, 0);
  const yearCosts = Math.abs(yearTransactions.filter(t => t.type === 'cost').reduce((sum, c) => sum + c.amount, 0));
  const yearNetProfit = yearRevenue - yearCosts;

  
  const expenseDataForChart = filteredTransactions
    .filter(tx => tx.type === 'cost')
    .reduce((acc, tx) => {
        let category = 'Maintenance';
        if (tx.isEditable && tx.rawData) { // Is an expense
          category = tx.rawData.category;
        }
        
        const amount = Math.abs(tx.amount);
        const existing = acc.find(item => item.category === category);
        if (existing) {
            existing.amount += amount;
        } else {
            acc.push({ category, amount });
        }
        return acc;
    }, [] as { category: string; amount: number }[]);

    const exportToCSV = () => {
        const headers = ['Date', 'Description', 'Montant (FCFA)', 'Type'];
        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(tx => {
                const row = [
                    new Date(tx.date).toLocaleDateString('fr-FR'),
                    `"${tx.description.replace(/"/g, '""')}"`,
                    tx.amount,
                    tx.type === 'revenue' ? 'Revenu' : 'Dépense'
                ];
                return row.join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'transactions-carmixt.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Trésorerie & Comptabilité</h1>
        <div className="flex items-center space-x-2">
            <button onClick={handleAddExpense} className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors"><PlusIcon className="w-5 h-5 mr-2"/>Ajouter Dépense</button>
            <button onClick={exportToCSV} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"><DownloadIcon className="w-5 h-5 mr-2"/>Exporter en CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Revenu Total Brut" value={`${totalRevenue.toLocaleString('fr-FR')} FCFA`} color="bg-green-500" description="Historique complet des revenus."/>
        <StatCard title="Coûts Totaux" value={`${totalCosts.toLocaleString('fr-FR')} FCFA`} color="bg-red-500" description="Historique complet des coûts."/>
        <StatCard title="Bénéfice Net Global" value={`${netProfit.toLocaleString('fr-FR')} FCFA`} color="bg-blue-500" description="Performance globale de l'entreprise."/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Résumé Annuel ({currentYear})</h2>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Revenus de l'année:</span><span className="font-semibold text-green-600">{yearRevenue.toLocaleString('fr-FR')} FCFA</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Coûts de l'année:</span><span className="font-semibold text-red-600">{yearCosts.toLocaleString('fr-FR')} FCFA</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span className="font-bold">Bénéfice Net de l'année:</span><span className="font-bold text-lg">{yearNetProfit.toLocaleString('fr-FR')} FCFA</span></div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Revenus par mois ({currentYear})</h2>
            <RevenueChart rentals={rentals} />
          </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Flux de Trésorerie</h2>
            <div className="flex items-center space-x-3">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="py-1.5 px-2 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm">
                    <option value="all">Tous les types</option><option value="revenue">Revenus</option><option value="cost">Dépenses</option>
                </select>
                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                   <button onClick={() => setDateFilter('all')} className={`px-3 py-1 text-sm rounded-md ${dateFilter === 'all' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>Tout</button>
                   <button onClick={() => setDateFilter('this_month')} className={`px-3 py-1 text-sm rounded-md ${dateFilter === 'this_month' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>Ce mois-ci</button>
                   <button onClick={() => setDateFilter('this_year')} className={`px-3 py-1 text-sm rounded-md ${dateFilter === 'this_year' ? 'bg-red-600 text-white' : 'text-gray-600'}`}>Cette année</button>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Historique des Transactions</h2>
            {transactions.length > 0 ? (
                <div className="overflow-y-auto max-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50 sticky top-0"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th><th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th><th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id + tx.description} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount.toLocaleString('fr-FR')} FCFA</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {tx.isEditable && tx.rawData && (
                                          <div className="flex justify-end space-x-2">
                                            <button onClick={() => handleEditExpense(tx.rawData as Expense)} className="text-gray-400 hover:text-blue-600"><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={() => deleteExpense(tx.id)} className="text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                          </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (<p className="text-center text-gray-500 py-8">Aucune transaction ne correspond à vos filtres.</p>)}
                </div>
            ) : (<p className="text-center text-gray-500 py-4">Aucune transaction terminée à afficher.</p>)}
        </div>
        <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow-md">
             <h2 className="text-xl font-semibold text-gray-700 mb-4">Répartition des Dépenses (Filtré)</h2>
             <ExpenseChart data={expenseDataForChart} />
        </div>
      </div>

      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} addExpense={addExpense} editExpense={editExpense} expenseToEdit={expenseToEdit} />
    </div>
  );
};