import { Fragment, type ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, DocumentTextIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface RecordDetailItem {
  label: string;
  value?: ReactNode;
  wide?: boolean;
}

export interface RecordDetailSection {
  title: string;
  items: RecordDetailItem[];
}

export interface RecordDocument {
  label: string;
  path?: string | null;
}

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  accentLabel: string;
  sections: RecordDetailSection[];
  documents?: RecordDocument[];
  onClose: () => void;
  onEdit: () => void;
}

const documentUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(import.meta.env.VITE_API_URL_PHOTO || import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function RecordDetailsModal({ open, title, subtitle, accentLabel, sections, documents = [], onClose, onEdit }: Props) {
  const availableDocuments = documents.filter((document) => Boolean(document.path));

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[260]" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px]" /></Transition.Child>
        <div className="fixed inset-0 z-[261] overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 py-6 sm:items-center">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white px-6 py-5 sm:px-8">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{accentLabel}</p><Dialog.Title className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">{title}</Dialog.Title>{subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}</div>
                  <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 transition hover:bg-white hover:text-gray-700" aria-label="Fermer"><XMarkIcon className="h-6 w-6" /></button>
                </div>

                <div className="space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                  {sections.map((section) => <section key={section.title}><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{section.title}</h3><div className="grid gap-3 sm:grid-cols-2">{section.items.map((item) => <div key={item.label} className={`rounded-xl border border-gray-200 bg-gray-50/70 p-4 ${item.wide ? 'sm:col-span-2' : ''}`}><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p><div className="mt-1 break-words text-sm font-medium leading-6 text-gray-900">{item.value || 'Non renseigné'}</div></div>)}</div></section>)}

                  <section><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Documents associés</h3>{availableDocuments.length ? <div className="grid gap-3 sm:grid-cols-2">{availableDocuments.map((document) => <a key={document.label} href={documentUrl(document.path!)} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"><span className="flex items-center gap-3"><DocumentTextIcon className="h-6 w-6" /><span className="text-sm font-semibold">{document.label}</span></span><ArrowTopRightOnSquareIcon className="h-5 w-5" /></a>)}</div> : <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">Aucun document joint à cet enregistrement.</div>}</section>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8"><button type="button" onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Fermer</button><button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"><PencilSquareIcon className="h-5 w-5" />Modifier</button></div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
