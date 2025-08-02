import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  role?: string;
  picture?: string;
}

interface BadgeGeneratorProps {
  member: Member;
  churchName?: string;
  churchAddress?: string;
  churchPhone?: string;
  pastorName?: string;
  onBadgeGenerated?: () => void;
}

const BadgeGenerator: React.FC<BadgeGeneratorProps> = ({
  member,
  churchName,
  churchAddress,
  churchPhone,
  pastorName,
  onBadgeGenerated
}) => {
  const badgeRef = useRef<HTMLDivElement>(null);

  const generateBadge = async () => {
    if (!badgeRef.current) {
      alert('Référence du badge non trouvée');
      return;
    }

    try {
      console.log('Starting badge generation...');
      
      const canvas = await html2canvas(badgeRef.current, {
        scale: 1,
        backgroundColor: '#ffffff',
        useCORS: false,
        allowTaint: false,
        logging: true,
        foreignObjectRendering: false,
        removeContainer: true
      });

      console.log('Canvas generated successfully:', canvas);

      // Simple dataURL approach first
      const dataURL = canvas.toDataURL('image/png');
      
      if (dataURL && dataURL !== 'data:,') {
        const link = document.createElement('a');
        link.download = `badge-${member.firstname}-${member.lastname}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Badge downloaded successfully');
        
        if (onBadgeGenerated) {
          onBadgeGenerated();
        }
      } else {
        throw new Error('Canvas vide généré');
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de la génération du badge: ${errorMessage}`);
    }
  };

  // Generate member ID (similar to the uploaded image)
  const generateMemberId = () => {
    const prefix = "ELC";
    const id = member.id.slice(-3).padStart(3, '0');
    return `${prefix}-${id}`;
  };

  // Generate NIF/NINU (mock data)
  const generateNifNinu = () => {
    return `00${member.id.slice(-8).padStart(8, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Badge Preview */}
      <div 
        ref={badgeRef}
        className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden relative"
        style={{ width: '400px', height: '600px' }}
      >
        {/* Header with church info */}
        <div className="text-white p-4 text-center relative" style={{ background: 'linear-gradient(to right, #1e40af, #1e3a8a)' }}>
          {/* Top notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-4 rounded-b-lg" style={{ backgroundColor: '#000000' }}></div>
          
          <div className="mt-4">
            <h1 className="text-lg font-bold leading-tight">{churchName}</h1>
            <p className="text-sm mt-1 italic">{churchAddress}</p>
            <p className="text-sm">{churchPhone}</p>
          </div>
        </div>

        {/* Member Photo Section */}
        <div className="flex justify-center py-6">
          <div className="w-32 h-32 rounded-full border-4 overflow-hidden" style={{ borderColor: '#1e40af', backgroundColor: '#e5e7eb' }}>
            {member.picture ? (
              <img 
                src={`https://api.ujecc.org${member.picture}`} 
                alt={`${member.firstname} ${member.lastname}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: '#9ca3af' }}>
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Member Information */}
        <div className="px-6 text-center space-y-3">
          <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
            {member.firstname} {member.lastname}
          </h2>
          
          <div className="space-y-1">
            <p className="text-sm" style={{ color: '#4b5563' }}>
              <span className="font-semibold">NIF/NINU:</span> {generateNifNinu()}
            </p>
            <p className="text-sm" style={{ color: '#4b5563' }}>
              <span className="font-semibold">ID Membre:</span> {generateMemberId()}
            </p>
          </div>

          <div className="rounded-lg p-3 mt-4" style={{ backgroundColor: '#dbeafe' }}>
            <p className="text-lg font-bold" style={{ color: '#1e3a8a' }}>
              {member.role || 'Membre'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 text-white p-4" style={{ background: 'linear-gradient(to right, #1e40af, #1e3a8a)' }}>
          <div className="text-center">
            <p className="text-sm font-semibold">{pastorName}</p>
            <div className="flex justify-center items-center mt-2 space-x-4">
              <span className="font-bold text-lg" style={{ color: '#ef4444' }}>2025</span>
              <span style={{ color: '#ffffff' }}>-</span>
              <span className="font-bold text-lg" style={{ color: '#ef4444' }}>2028</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateBadge}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Télécharger le Badge
      </button>
    </div>
  );
};

export default BadgeGenerator;