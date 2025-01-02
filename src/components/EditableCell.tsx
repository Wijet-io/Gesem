import React, { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';

interface EditableCellProps {
  value: number;
  suffix?: string;
  step?: string;
  min?: number;
  max?: number;
  onSave: (value: number) => Promise<void>;
}

export default function EditableCell({
  value,
  suffix = '',
  step = '0.01',
  min = 0,
  max,
  onSave
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(parseFloat(e.target.value))}
          step={step}
          min={min}
          max={max}
          className="w-20 text-center"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
        >
          ✓
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsEditing(false)}
          disabled={isLoading}
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="cursor-pointer hover:bg-gray-50 p-2 rounded inline-flex justify-center items-center mx-auto"
      onClick={() => setIsEditing(true)}
    >
      {value.toFixed(2)}{suffix}
    </div>
  );
}