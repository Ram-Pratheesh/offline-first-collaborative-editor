import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MapPin } from 'lucide-react';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Location name is required');
      return;
    }
    if (trimmed.length > 200) {
      setError('Location name must be under 200 characters');
      return;
    }
    onCreate(trimmed);
    setName('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Location">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              background: '#f0fdf4',
            }}
          >
            <MapPin size={28} color="#22c55e" />
          </div>
          <p style={{ textAlign: 'center', color: '#656180', fontSize: '14px', marginBottom: '16px' }}>
            Create a new physical location for this inspection.
            All collaborators will be able to add observations here.
          </p>
        </div>
        <Input
          label="Location Name"
          placeholder="e.g. Room 101, East Wall, Ground Floor"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">
            Create Location
          </Button>
        </div>
      </form>
    </Modal>
  );
};
