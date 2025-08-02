import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCreateOfferingMutation } from '../../store/services/offeringApi';
import { useCreateTitheMutation } from '../../store/services/titheApi';
import { useCreateDonationMutation } from '../../store/services/donationApi';
import { useCreateMoissonMutation } from '../../store/services/moissonApi';

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  type?: 'offering' | 'tithe' | 'donation' | 'moisson';
  churchId: string;
}

const FinanceModal: React.FC<FinanceModalProps> = ({ isOpen, onClose, type, activeTab, churchId }) => {
  // Determine type based on activeTab if type is not provided
  const financeType = type || (() => {
    switch (activeTab) {
      case 'offrandes':
        return 'offering';
      case 'dimes':
        return 'tithe';
      case 'dons':
        return 'donation';
      case 'moissons':
        return 'moisson';
      default:
        return 'offering';
    }
  })();
  // Common form fields
  const [contributorName, setContributorName] = useState('Anonyme');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('completed');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Set default contributor name for offerings
  useEffect(() => {
    if (financeType === 'offering') {
      setContributorName('Anonyme');
    }
  }, [financeType]);

  // API mutations
  const [createOffering, { isLoading: isOfferingLoading }] = useCreateOfferingMutation();
  const [createTithe, { isLoading: isTitheLoading }] = useCreateTitheMutation();
  const [createDonation, { isLoading: isDonationLoading }] = useCreateDonationMutation();
  const [createMoisson, { isLoading: isMoissonLoading }] = useCreateMoissonMutation();

  // Determine if any API call is loading
  const isLoading = isOfferingLoading || isTitheLoading || isDonationLoading || isMoissonLoading;

  // Get title based on financeType
  const getTitle = () => {
    switch (financeType) {
      case 'offering':
        return 'Ajouter une offrande';
      case 'tithe':
        return 'Ajouter une dîme';
      case 'donation':
        return 'Ajouter un don';
      case 'moisson':
        return 'Ajouter une moisson';
      default:
        return 'Ajouter';
    }
  };

  // Reset form
  const resetForm = () => {
    setContributorName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setNote('');
    setStatus('completed');
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (financeType !== 'offering' && !contributorName.trim()) {
      newErrors.contributorName = 'Le nom du contributeur est requis';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Le montant est requis';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Le montant doit être un nombre positif';
    }

    if (!date) {
      newErrors.date = 'La date est requise';
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

    const commonData = {
      contributorName,
      amount: parseFloat(amount),
      date,
      paymentMethod,
      note,
      churchId
    };

    try {
      switch (financeType) {
        case 'offering':
          await createOffering({
            ...commonData,
            status
          });
          break;
        case 'tithe':
          await createTithe(commonData);
          break;
        case 'donation':
          await createDonation(commonData);
          break;
        case 'moisson':
          await createMoisson({
            ...commonData,
            status
          });
          break;
      }
      handleClose();
    } catch (error) {
      console.error('Error creating finance item:', error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 w-full shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {getTitle()}
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
            {financeType !== 'offering' && (
              <div>
                <label htmlFor="contributorName" className="block text-sm font-medium text-gray-700">
                  Nom du contributeur *
                </label>
                <input
                  type="text"
                  id="contributorName"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  className={`mt-1 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.contributorName ? 'border-red-500' : ''}`}
                />
                {errors.contributorName && <p className="mt-1 text-sm text-red-600">{errors.contributorName}</p>}
              </div>
            )}

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Montant (HTG) *
              </label>
              <input
                type="number"
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
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Méthode de paiement *
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${errors.paymentMethod ? 'border-red-500' : ''}`}
              >
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="transfer">Virement</option>
                <option value="other">Autre</option>
              </select>
              {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>}
            </div>
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              />
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default FinanceModal;