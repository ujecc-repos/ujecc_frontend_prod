import React, { useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import _ from "lodash"
import { QRCodeSVG } from 'qrcode.react';

interface Member {
  id: string;
  firstname: string;
  lastname: string;
  email?: string;
  role?: string;
  nif?: string;
  picture?: string;
  groupeSanguin?: string;
  zone?: string;
  code?: string;
  ministry?: {
    name: string;
  };
}

interface BadgeGeneratorProps {
  member: Member;
  churchName?: string;
  churchAddress?: string;
  churchPhone?: string;
  churchEmail?: string;
  churchPicture?: string;
  churchOption?: string;
  pastorName?: string;
  onBadgeGenerated?: () => void;
}

const BadgeGenerator: React.FC<BadgeGeneratorProps> = ({
  member,
  churchName,
  churchAddress,
  churchPhone,
  churchEmail,
  churchPicture,
  churchOption,
  pastorName,
  onBadgeGenerated
}) => {
  const badgeRef = useRef<HTMLDivElement>(null);

  console.log("member id : ", member.id)

  const generateBadge = async () => {
    if (!badgeRef.current) {
      alert('Référence du badge non trouvée');
      return;
    }

    try {
      console.log('Starting badge generation...');

      // Use html-to-image which has better SVG support
      const dataURL = await htmlToImage.toPng(badgeRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });

      console.log('Image generated successfully');

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
        throw new Error('Image vide générée');
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
    const id = member.code || member.id.slice(-3).padStart(3, '0');
    return `${prefix}-${id}`;
  };

  // Calculate red wave position based on church name length
  const getWaveTopPosition = () => {
    // If church name is long (likely 2 lines), use 160px, otherwise 135px
    const churchNameLength = churchName?.length || 0;
    return churchNameLength > 32 ? '160px' : '135px';
  };

  // Calculate church logo position based on church name length
  const getChurchLogoTopPosition = () => {
    // If church name is long (likely 2 lines), use 122px, otherwise 100px
    const churchNameLength = churchName?.length || 0;
    return churchNameLength > 32 ? '122px' : '100px';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Badge Preview */}
      <div
        ref={badgeRef}
        style={{
          width: '400px',
          height: '650px',
          // backgroundColor: '#2B5F7F',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Full background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // backgroundColor: '#2B5F7F',
          zIndex: 0
        }}></div>

        {/* Top white rounded rectangle */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: 'calc(50% - 60px)',
          width: '120px',
          height: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          zIndex: 10
        }}></div>

        {/* Header with church info */}
        <div style={{
          paddingTop: '50px',
          paddingBottom: '10px',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative',
          backgroundColor: '#2B5F7F'
        }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            fontStyle: 'italic',
            margin: '0 0 8px 0',
            lineHeight: '1.2',
            padding: '0 20px'
          }}>
            {churchName}
          </h1>
          <p style={{
            fontSize: '11px',
            margin: '3px 0',
            lineHeight: '1.3',
            padding: '0 15px'
          }}>
            {churchAddress}
          </p>
          <p style={{
            fontSize: '11px',
            margin: '3px 0',
            lineHeight: '1.3'
          }}>
            Phone: {churchPhone}
          </p>
          <p style={{
            fontSize: '11px',
            margin: '3px 0',
            lineHeight: '1.3'
          }}>
            Email: {churchEmail}
          </p>
        </div>

        {/* Red wave decoration top - Original SVG (html-to-image supports SVG!) */}
        <svg
          viewBox="0 0 400 80"
          style={{
            width: '100%',
            height: '20px',
            position: 'absolute',
            top: getWaveTopPosition(),
            left: 0,
            zIndex: 5
          }}
          preserveAspectRatio="none"
        >
          <path
            d="M 0 40 Q 100 10, 200 40 Q 300 10, 400 40 L 400 80 Q 300 50, 200 80 Q 100 50, 0 80 Z"
            fill="#DC2626"
            opacity="0.9"
          />
        </svg>

        {/* Church Logo - Top Left */}
        {churchPicture && (
          <div style={{
            position: 'absolute',
            top: getChurchLogoTopPosition(),
            left: '27px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '3px solid #8B4513',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            zIndex: 10
          }}>
            <img
              src={`${import.meta.env.VITE_API_URL_PHOTO}${churchPicture}`}
              alt="Church Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Member Photo - Center with red border */}
        <div style={{
          position: 'absolute',
          top: '200px',
          left: 'calc(50% - 80px)',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          border: '5px solid #DC2626',
          backgroundColor: '#e5e7eb',
          overflow: 'hidden',
          zIndex: 10
        }}>
          {member.picture ? (
            <img
              src={`${import.meta.env.VITE_API_URL_PHOTO}${member.picture}`}
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
              backgroundColor: '#D1D5DB',
              color: '#6B7280'
            }}>
              <svg style={{ width: '80px', height: '80px' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Member ID badge on right side */}
        <div style={{
          position: 'absolute',
          top: '260px',
          right: '15px',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#DC2626',
          letterSpacing: '2px',
          zIndex: 10
        }}>
          {generateMemberId()}
        </div>

        {/* Member Information - Below photo */}
        <div style={{
          position: 'absolute',
          top: '370px',
          left: '0',
          right: '0',
          textAlign: 'center',
          color: '#1e3a8a',
          padding: '0 20px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#1e3a8a'
          }}>
            {_.toUpper(member.firstname)} {_.capitalize(member.lastname)}
          </h2>

          <p style={{
            fontSize: '14px',
            margin: '5px 0',
            color: '#1e3a8a'
          }}>
            NIF/ NINU : {member.nif || 'Non renseigné'}
          </p>

          <p style={{
            fontSize: '14px',
            margin: '5px 0',
            color: '#1e3a8a'
          }}>
            Fonction : {member.role || 'Membre'}
          </p>

          {member.ministry?.name && (
            <p style={{
              fontSize: '14px',
              margin: '5px 0',
              color: '#1e3a8a'
            }}>
              {churchOption || 'Ministère'} : {member.ministry.name}
            </p>
          )}

          <p style={{
            fontSize: '14px',
            margin: '5px 0',
            color: 'red'
          }}>
            {member.groupeSanguin || 'A+'}
          </p>
        </div>


        {/* QR Code - Bottom Right */}
        <div style={{
          position: 'absolute',
          bottom: '52px',
          right: '30px',
          backgroundColor: '#ffffff',
          padding: '5px',
          borderRadius: '4px',
          zIndex: 10
        }}>
          <QRCodeSVG
            value={member.id || ''}
            size={90}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Red wave decoration bottom - Original SVG (html-to-image supports SVG!) */}
        <svg
          viewBox="0 0 400 60"
          style={{
            width: '100%',
            height: '34px',
            position: 'absolute',
            bottom: '44px',
            left: 0,
            zIndex: 5
          }}
          preserveAspectRatio="none"
        >
          <path
            d="M 0 30 Q 100 0, 200 30 T 400 30 L 400 0 L 0 0 Z"
            fill="#DC2626"
            opacity="0.9"
          />
        </svg>

        {/* Footer - Pastor signature and dates */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: '#2B5F7F',
          color: '#ffffff',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px'
        }}>
          <div style={{ flex: 1 }}>
            {/* Pastor's signature - handwritten style */}
            <div style={{
              fontSize: '28px',
              fontFamily: "'Alex Brush', cursive",
              // marginBottom: '-2px',
              color: '#ffffff',
              transform: 'rotate(-3deg)',
              // letterSpacing: '1px',
              fontWeight: '200'
            }}>
              {pastorName || 'Pastor'}
            </div>
            <p style={{
              fontSize: '10px',
              margin: '0',
              fontWeight: '600',
              opacity: 0.9
            }}>
              {pastorName}, Pasteur
            </p>
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'right',
            marginTop: "20px"
          }}>
            2025-2030
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