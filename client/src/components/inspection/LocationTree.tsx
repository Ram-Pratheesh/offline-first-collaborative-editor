import React, { useState } from 'react';
import { MapPin, Plus, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import type { InspectionLocation, ObservationMeta } from '../../types';

interface LocationTreeProps {
  locations: InspectionLocation[];
  observations: ObservationMeta[];
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string) => void;
  onCreateLocation: () => void;
  onDeleteLocation?: (locationId: string) => void;
  isFinalized?: boolean;
}

export const LocationTree: React.FC<LocationTreeProps> = ({
  locations,
  observations,
  selectedLocationId,
  onSelectLocation,
  onCreateLocation,
  onDeleteLocation,
  isFinalized,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getObservationCount = (locationId: string) => {
    return observations.filter((o) => o.locationId === locationId).length;
  };

  const handleDelete = async (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation();
    if (!onDeleteLocation) return;
    setDeletingId(locationId);
    try {
      await onDeleteLocation(locationId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid #ebe6f0',
        }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#8a849d',
            marginBottom: '12px',
          }}
        >
          Locations
        </h3>
        <button
          onClick={onCreateLocation}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            border: '2px dashed #d4d0e0',
            borderRadius: '12px',
            background: 'transparent',
            color: '#7c43e8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#7c43e8';
            e.currentTarget.style.background = '#faf7ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d4d0e0';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Plus size={16} />
          Create Location
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {locations.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#8a849d',
              fontSize: '13px',
            }}
          >
            <MapPin size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <p>No locations yet.</p>
            <p style={{ marginTop: '4px' }}>Create your first location to start adding observations.</p>
          </div>
        ) : (
          locations.map((loc) => {
            const isSelected = selectedLocationId === loc.locationId;
            const obsCount = getObservationCount(loc.locationId);
            const isHovered = hoveredId === loc.locationId;
            const isDeleting = deletingId === loc.locationId;

            return (
              <div
                key={loc.locationId}
                style={{ position: 'relative', marginBottom: '4px' }}
                onMouseEnter={() => setHoveredId(loc.locationId)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelectLocation(loc.locationId)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    paddingRight: !isFinalized && (isHovered || isDeleting) ? '40px' : '12px',
                    border: 'none',
                    borderRadius: '12px',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f3e8ff, #fce7f3)'
                      : isHovered
                        ? '#f9fafb'
                        : 'transparent',
                    color: isSelected ? '#7c3aed' : '#374151',
                    fontSize: '14px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(124, 58, 237, 0.1)' : 'none',
                  }}
                >
                  <MapPin
                    size={16}
                    style={{
                      flexShrink: 0,
                      color: isSelected ? '#7c3aed' : '#9ca3af',
                    }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loc.name}
                  </span>
                  {obsCount > 0 && (
                    <span
                      style={{
                        flexShrink: 0,
                        minWidth: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '11px',
                        background: isSelected ? '#7c3aed' : '#e5e7eb',
                        color: isSelected ? '#ffffff' : '#6b7280',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '0 6px',
                      }}
                    >
                      {obsCount}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    style={{
                      flexShrink: 0,
                      opacity: isSelected ? 1 : 0.3,
                      color: isSelected ? '#7c3aed' : '#9ca3af',
                    }}
                  />
                </button>

                {/* Delete button — shown on hover, not when finalized */}
                {!isFinalized && (isHovered || isDeleting) && onDeleteLocation && (
                  <button
                    onClick={(e) => handleDelete(e, loc.locationId)}
                    disabled={isDeleting}
                    title="Delete location"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '28px',
                      height: '28px',
                      display: 'grid',
                      placeItems: 'center',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      cursor: isDeleting ? 'wait' : 'pointer',
                      transition: 'background 0.15s',
                      zIndex: 1,
                    }}
                  >
                    {isDeleting ? (
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
