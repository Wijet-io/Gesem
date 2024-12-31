import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function PayrollGeneration() {
  const [startDate, setStartDate] = useState('');

  return (
    <div>
      <PageHeader
        title="Génération des Salaires"
        description="Générez les rapports de salaire pour la période sélectionnée"
      />
      
      <Card className="p-6">
        <div className="space-y-6">
          <div className="max-w-xl">
            <Input
              type="date"
              label="Date de début de période"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-4">
            <Button
              onClick={() => console.log('Generate reports')}
              disabled={!startDate}
            >
              Générer les Rapports
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => setStartDate('')}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}