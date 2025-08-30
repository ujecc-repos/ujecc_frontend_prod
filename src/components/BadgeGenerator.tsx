import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import _ from "lodash"

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  role?: string;
  nif?: string;
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
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: true,
        // ignoreElements: (element) => {
        //   // Skip elements that might have unsupported CSS
        //   return element.tagName === 'STYLE' || element.tagName === 'SCRIPT';
        // }
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Badge Preview */}
      <div 
        ref={badgeRef}
        style={{ 
          width: '400px', 
          height: '600px',
          backgroundColor: '#ffffff',
          border: '2px solid #d1d5db',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <div style={{ 
            width: '128px', 
            height: '128px', 
            borderRadius: '50%', 
            border: '4px solid #1e40af', 
            backgroundColor: '#e5e7eb',
            overflow: 'hidden'
          }}>
            {member.picture ? (
              <img 
                src={`https://ujecc-backend.onrender.com${member.picture}`} 
                // src={`http://localhost:4000${member.picture}`} 
                alt={`${_.capitalize(member.firstname)} ${_.capitalize(member.lastname)}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#9ca3af'
              }}>
                <svg style={{ width: '64px', height: '64px' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Member Information */}
        <div style={{ padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 12px 0'
          }}>
            {_.capitalize(member.firstname)} {_.capitalize(member.lastname)}
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#4b5563',
              margin: '4px 0'
            }}>
              <span style={{ fontWeight: '600' }}>NIF/NINU:</span> {member.nif}
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#4b5563',
              margin: '4px 0'
            }}>
              <span style={{ fontWeight: '600' }}>ID Membre:</span> {generateMemberId()}
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#dbeafe',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px'
          }}>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#1e3a8a',
              margin: '0'
            }}>
              {member.role || 'Membre'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(to right, #1e40af, #1e3a8a)',
          color: '#ffffff',
          padding: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>Réverant et Pasteur : {pastorName}</p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '16px'
            }}>
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '18px', 
                color: '#ef4444'
              }}>2025</span>
              <span style={{ color: '#ffffff' }}>-</span>
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '18px', 
                color: '#ef4444'
              }}>2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateBadge}
        style={{
          padding: '12px 24px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          fontWeight: '600',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
      >
        Télécharger le Badge
      </button>
    </div>
  );
};

export default BadgeGenerator;