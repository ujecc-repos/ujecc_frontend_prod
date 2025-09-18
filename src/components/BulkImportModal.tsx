import React, { useState, useRef } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: any[]) => Promise<{ success: boolean; insertedCount: number; data?: any }>;
  isLoading: boolean;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: any[];
  errors?: string[];
}

function excelDateToJSDate(serial: any) {
    const utc_days = Math.floor(serial - 25569); // Excel's epoch starts at 1900-01-01
    const utc_value = utc_days * 86400; // seconds
    const date_info = new Date(utc_value * 1000);

    return new Date(
      date_info.getFullYear(),
      date_info.getMonth(),
      date_info.getDate()
    );
  }

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };
  

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and process data
        const rows = jsonData.slice(1) as any[][];
        const processedData = rows
          .filter(row => row.length >= 2 && row[0] && row[1]) // Filter out empty rows
          .map((row, index) => ({
            id: index + 1,
            nom: row[0]?.toString().trim() || '',
            prenom: row[1]?.toString().trim() || '',
            genre: row[2]?.toString().trim() || '',
            dateNaissance: row[3]?.toString().trim() || '',
            // Map to expected API fields
            firstname: row[1]?.toString().trim() || '',
            lastname: row[0]?.toString().trim() || '',
            sex: row[2]?.toString().trim() || '',
            birthDate: excelDateToJSDate(row[3])?.toLocaleDateString('fr-FR') || "",
            nif: row[4]?.toString().trim() || '',
            email: '',
            password: '',
            // role: 'Membre',
            membreActif: true,
            minister: 'Non spécifié'
          }));     
        setPreviewData(processedData);
        setStep('preview');
      } catch (error) {
        console.error('Error processing Excel file:', error);
        setImportResult({
          success: false,
          message: 'Erreur lors du traitement du fichier Excel. Veuillez vérifier le format.',
          errors: ['Format de fichier invalide']
        });
        setStep('result');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {

    if (previewData.length > 0) {
      try {
        const result = await onImport(previewData);
        // console.log("result : ", result)
        setImportResult({
          success: true,
          message: `${result.insertedCount} membres ont été importés avec succès.`,
          data: result.data
        });
        setStep('result');
      } catch (error: any) {
        console.error('Import error:', error);
        let errorMessage = 'Erreur lors de l\'importation des membres.';
        let errorDetails = [];
        
        if (error.data) {
          errorMessage = error.data.error || error.data.message || errorMessage;
          if (error.data.errors) {
            errorDetails = error.data.errors.map((err: any) => 
              `Ligne ${err.index + 1}: ${err.error}`
            );
          }
        }
        
        setImportResult({
          success: false,
          message: errorMessage,
          errors: errorDetails.length > 0 ? errorDetails : [error.message || 'Erreur inconnue']
        });
        setStep('result');
      }
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
    console.log(file)
  };

  const downloadTemplate = () => {
    const templateData = [
      ['nom', 'prenom', 'sex', 'date de naissance', 'ni/nu'],
      ['Dupont', 'Jean', 'Homme', '01/01/1990', 'NI'],
      ['Martin', 'Marie', 'Femme', '15/05/1985', 'NU'],
      ['Durand', 'Pierre', 'Homme', '20/12/1995', 'NI']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Membres');
    XLSX.writeFile(wb, 'template_membres.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Importation en masse des membres
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions :</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Le fichier Excel doit contenir cinq colonnes : "nom", "prenom", "genre", "date de naissance" et "ni/nu"</li>
                  <li>• La première ligne doit contenir les en-têtes</li>
                  <li>• Formats acceptés : .xlsx, .xls</li>
                  <li>• Un email sera généré automatiquement pour chaque membre</li>
                </ul>
              </div>

              {/* Template Download */}
              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Télécharger le modèle Excel
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Sélectionnez votre fichier Excel</p>
                  <p className="text-sm text-gray-500">ou glissez-déposez le fichier ici</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Choisir un fichier
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Aperçu des données ({previewData.length} membres)
                </h3>
                <button
                  onClick={() => setStep('upload')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Changer de fichier
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prénom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sexe
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date de naissance
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NI/NU
                        </th>
                        {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email (généré)
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((user, index) => {
                        // const date = excelDateToJSDate(user.birthDate);
                        // const formattedDate = date.toLocaleDateString('fr-FR');
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{user.nom}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.prenom}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.genre}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.birthDate}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.nif}</td>
                          {/* <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td> */}
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center">
                    ... et {previewData.length - 10} autres membres
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Informations importantes :</p>
                    <ul className="space-y-1">
                      <li>• Tous les membres auront le rôle "Membre" par défaut</li>
                      <li>• Vous pourrez modifier ces informations après l'importation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-6">
              <div className={`border rounded-lg p-6 ${
                importResult.success 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start">
                  {importResult.success ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`text-lg font-medium ${
                      importResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {importResult.success ? 'Importation réussie !' : 'Erreur d\'importation'}
                    </h3>
                    <p className={`mt-1 text-sm ${
                      importResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {importResult.message}
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-800 mb-2">Erreurs détaillées :</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {importResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center  justify-end space-x-3 px-6 py-2 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {step === 'result' ? 'Fermer' : 'Annuler'}
          </button>
          
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={isLoading || previewData.length === 0}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importation en cours...
                </>
              ) : (
                `Importer ${previewData.length} membres`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;