
import React, { useState, useEffect } from 'react';
import { CITIES, MONTHS } from '../constants';
import { TrafficInfraction } from '../types';

interface AitFormProps {
  onSave: (data: Omit<TrafficInfraction, 'id' | 'timestamp' | 'total'>) => void;
  onCancel: () => void;
  initialData?: TrafficInfraction;
}

const AitForm: React.FC<AitFormProps> = ({ onSave, onCancel, initialData }) => {
  const currentYear = new Date().getFullYear();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    city: initialData?.city || CITIES[0],
    month: initialData?.month ?? new Date().getMonth(),
    year: initialData?.year || currentYear,
    cars: initialData?.cars ?? ('' as string | number),
    motorcycles: initialData?.motorcycles ?? ('' as string | number),
    trucks: initialData?.trucks ?? ('' as string | number),
    others: initialData?.others ?? ('' as string | number)
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      cars: Number(formData.cars) || 0,
      motorcycles: Number(formData.motorcycles) || 0,
      trucks: Number(formData.trucks) || 0,
      others: Number(formData.others) || 0,
    };

    onSave(dataToSave as any);
    
    if (!initialData) {
      setFormData(prev => ({
        ...prev,
        cars: '',
        motorcycles: '',
        trucks: '',
        others: ''
      }));
    }
    
    setShowSuccess(true);
    
    // Prevent form from submitting and causing page refresh
    return false;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="animate-fadeIn relative">
      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span className="font-bold text-sm">{initialData ? 'Registro atualizado!' : 'Registro salvo!'}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{initialData ? 'Editar AIT' : 'Lançar AIT'}</h2>
          <p className="text-xs text-gray-400">{initialData ? 'Corrija os dados abaixo.' : 'Informe os dados de trânsito do período.'}</p>
        </div>
        <button onClick={onCancel} className="text-xs text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-widest">
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-lg">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-500 uppercase mb-1.5 ml-1">Cidade</label>
            <select 
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-500 uppercase mb-1.5 ml-1">Mês</label>
            <select 
              value={formData.month}
              onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              {MONTHS.map((month, idx) => <option key={month} value={idx}>{month}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-500 uppercase mb-1.5 ml-1">Ano</label>
            <select 
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-lg">
          {[
            { label: 'Carros', key: 'cars', color: 'border-blue-500' },
            { label: 'Motos', key: 'motorcycles', color: 'border-emerald-500' },
            { label: 'Caminhões', key: 'trucks', color: 'border-amber-500' },
            { label: 'Outros', key: 'others', color: 'border-gray-500' }
          ].map((field) => (
            <div key={field.key} className="flex flex-col">
              <label className="text-[10px] font-black text-gray-500 uppercase mb-1.5 ml-1">{field.label}</label>
              <input 
                type="number"
                min="0"
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                className={`bg-gray-800 border-l-2 ${field.color} border-t border-r border-b border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-white outline-none transition-all text-base font-bold`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-10 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            {initialData ? 'Atualizar Dados' : 'Lançar no Sistema'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AitForm;
