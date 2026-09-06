import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCreateExpenseMutation, useUpdateExpenseMutation, type Expense } from '../store/services/expenseApi';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  churchId?: string;
  categories?: string[];
  title?: string;
  expense?: Expense | null;
}

interface CreateExpenseRequest {
  amount: number;
  quantity: number;
  category: string;
  date: string;
  paymentMethod: string;
  description: string;
  churchId?: string;
  currency?: string;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSubmit, churchId, categories: _propCategories, title: modalTitle = 'Ajouter une dépense', expense = null }) => {
  // Form fields
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('HTG');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Autre');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // API mutations
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const isLoading = isCreating || isUpdating;

  // Categories options
  const defaultCategories = [
    'Loyer',
    'Électricité',
    'Eau',
    'Internet',
    'Téléphone',
    'Fournitures',
    'Équipement',
    'Maintenance',
    'Salaires',
    'Transport',
    'Nourriture',
    'Événements',
    'Missions',
    'Don',
    'Autre'
  ];

  // Payment methods
  const paymentMethods = [
    'espèce',
    'chèque',
    'virement',
    'carte',
  ];

  // Reset form
  const resetForm = () => {
    setAmount('');
    setCurrency('HTG');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Autre');
    setDescription('');
    setPaymentMethod('cash');
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) return;

    if (expense) {
      setAmount(String(expense.amount));
      setCurrency(expense.currency || 'HTG');
      setDate(expense.date ? expense.date.slice(0, 10) : '');
      setCategory(expense.category || 'Autre');
      setDescription(expense.description || '');
      setPaymentMethod(expense.paymentMethod || 'espèce');
      setErrors({});
    } else {
      resetForm();
    }
  }, [expense, isOpen]);

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount.trim()) {
      newErrors.amount = 'Le montant est requis';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Le montant doit être un nombre positif';
    }

    if (!date) {
      newErrors.date = 'La date est requise';
    }

    if (!category) {
      newErrors.category = 'La catégorie est requise';
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'La méthode de paiement est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const expenseData: CreateExpenseRequest = {
        amount: parseFloat(amount),
        currency,
        quantity: 1, // Default quantity
        category,
        date,
        paymentMethod,
        description: description.trim(),
        churchId: churchId || ''
      };

      const result = expense
        ? await updateExpense({ id: expense.id, ...expenseData }).unwrap()
        : await createExpense(expenseData).unwrap();
      
      if (onSubmit) {
        onSubmit(result);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {modalTitle}
            </Dialog.Title>
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              onClick={handleClose}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Devise
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              >
                <option value="HTG">HTG</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Montant *
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.amount ? 'border-red-500' : ''}`}
              />
              {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Catégorie *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.category ? 'border-red-500' : ''}`}
                style={{ appearance: 'menulist' }} // Force native dropdown appearance
              >
                {(defaultCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Méthode de paiement *
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.paymentMethod ? 'border-red-500' : ''}`}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method === 'cash' ? 'Espèces' :
                     method === 'chèque' ? 'Chèque' :
                     method === 'virement' ? 'Virement bancaire' :
                     method === 'carte' ? 'Carte bancaire' :
                     method === 'mobile' ? 'Paiement mobile' : method}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>}
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export { ExpenseModal };
