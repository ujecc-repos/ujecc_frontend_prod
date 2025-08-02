import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters?: (filters: {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    categories?: string[];
    paymentMethods?: string[];
  }) => void;
  title?: string;
  categories?: string[];
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApplyFilters, title = 'Filtrer les dépenses', categories: propCategories }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Categories options
  const categories = propCategories || [
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
    'Charité',
    'Autre'
  ];

  // Payment methods
  const paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'chèque', label: 'Chèque' },
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'mobile', label: 'Paiement mobile' }
  ];

  // Reset form
  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedCategories([]);
    setSelectedPaymentMethods([]);
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Toggle payment method selection
  const togglePaymentMethod = (method: string) => {
    setSelectedPaymentMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
    }

    if (minAmount && isNaN(parseFloat(minAmount))) {
      newErrors.minAmount = 'Le montant minimum doit être un nombre';
    }

    if (maxAmount && isNaN(parseFloat(maxAmount))) {
      newErrors.maxAmount = 'Le montant maximum doit être un nombre';
    }

    if (minAmount && maxAmount && parseFloat(minAmount) > parseFloat(maxAmount)) {
      newErrors.maxAmount = 'Le montant maximum doit être supérieur au montant minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle reset filters
  const handleResetFilters = () => {
    resetForm();
    if (onApplyFilters) {
      onApplyFilters({});
    }
    onClose();
  };

  // Handle apply filters
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (onApplyFilters) {
      onApplyFilters({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        paymentMethods: selectedPaymentMethods.length > 0 ? selectedPaymentMethods : undefined
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {title}
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

          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Période</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`mt-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.endDate ? 'border-red-500' : ''}`}
                  />
                  {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Montant</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700">
                    Montant minimum
                  </label>
                  <input
                    type="text"
                    id="minAmount"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="0"
                    className={`mt-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.minAmount ? 'border-red-500' : ''}`}
                  />
                  {errors.minAmount && <p className="mt-1 text-sm text-red-600">{errors.minAmount}</p>}
                </div>
                <div>
                  <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700">
                    Montant maximum
                  </label>
                  <input
                    type="text"
                    id="maxAmount"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="100000"
                    className={`mt-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.maxAmount ? 'border-red-500' : ''}`}
                  />
                  {errors.maxAmount && <p className="mt-1 text-sm text-red-600">{errors.maxAmount}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Catégories</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      id={`category-${category}`}
                      name="categories"
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Méthodes de paiement</h3>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <div key={method.value} className="flex items-center">
                    <input
                      id={`method-${method.value}`}
                      name="paymentMethods"
                      type="checkbox"
                      checked={selectedPaymentMethods.includes(method.value)}
                      onChange={() => togglePaymentMethod(method.value)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor={`method-${method.value}`} className="ml-2 text-sm text-gray-700">
                      {method.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Réinitialiser
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export { FilterModal };