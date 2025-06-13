import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import DensityMaxMin from '@/components/laboratory/density-max-min';

export default function DensidadeMaxMinPage() {
  const [location] = useLocation();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const loadId = urlParams.get('load');
    
    if (loadId) {
      const event = new CustomEvent('loadTest', { 
        detail: { testId: parseInt(loadId), testType: 'max-min-density' } 
      });
      window.dispatchEvent(event);
    }
  }, [location]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ensaio de Densidade Máxima e Mínima</h1>
        <p className="text-gray-600">ABNT NBR 12004 - Determinação do índice de vazios máximo e mínimo</p>
      </div>
      <DensityMaxMin />
    </div>
  );
}