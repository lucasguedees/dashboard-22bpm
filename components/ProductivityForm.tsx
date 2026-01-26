
import React, { useState, useEffect } from 'react';
import { CITIES, MONTHS } from '../constants';
import { ProductivityRecord } from '../types';

interface ProductivityFormProps {
  onSave: (data: Omit<ProductivityRecord, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
  initialData?: ProductivityRecord;
}

const ProductivityForm: React.FC<ProductivityFormProps> = ({ onSave, onCancel, initialData }) => {
  const currentYear = new Date().getFullYear();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    city: initialData?.city || CITIES[0],
    month: initialData?.month ?? new Date().getMonth(),
    year: initialData?.year || currentYear,
    ba: initialData?.ba ?? ('' as string | number),
    cop: initialData?.cop ?? ('' as string | number),
    tc: initialData?.tc ?? ('' as string | number),
    fugitives: initialData?.fugitives ?? ('' as string | number),
    vehiclesInspected: initialData?.vehiclesInspected ?? ('' as string | number),
    peopleApproached: initialData?.peopleApproached ?? ('' as string | number),
    drugsKg: initialData?.drugsKg ?? ('' as string | number),
    weapons: initialData?.weapons ?? ('' as string | number),
    arrests: initialData?.arrests ?? ('' as string | number)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      ba: Number(formData.ba) || 0,
      cop: Number(formData.cop) || 0,
      tc: Number(formData.tc) || 0,
      fugitives: Number(formData.fugitives) || 0,
      vehiclesInspected: Number(formData.vehiclesInspected) || 0,
      peopleApproached: Number(formData.peopleApproached) || 0,
      drugsKg: Number(formData.drugsKg) || 0,
      weapons: Number(formData.weapons) || 0,
      arrests: Number(formData.arrests) || 0,
    };

    onSave(dataToSave as any);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    
    if (!initialData) {
      setFormData(prev => ({ 
        ...prev, 
        ba: '', cop: '', tc: '', fugitives: '', 
        vehiclesInspected: '', peopleApproached: '', 
        drugsKg: '', weapons: '', arrests: '' 
      }));
    }
  };

  const fields = [
    { label: 'Quantidade de BA', key: 'ba', placeholder: 'Ex: 15' },
    { label: 'Quantidade de COP', key: 'cop', placeholder: 'Ex: 05' },
    { label: 'Quantidade de TC', key: 'tc', placeholder: 'Ex: 02' },
    { label: 'Quantidade de Foragidos', key: 'fugitives', placeholder: 'Capturados' },
    { label: 'Veículos Fiscalizados', key: 'vehiclesInspected', placeholder: 'Total abordados' },
    { label: 'Pessoas Abordadas', key: 'peopleApproached', placeholder: 'Total pessoas' },
    { label: 'Drogas (KG)', key: 'drugsKg', placeholder: 'Peso total em KG' },
    { label: 'Quantidade de Armas', key: 'weapons', placeholder: 'Total apreendidas' },
    { label: 'Quantidade de Prisões', key: 'arrests', placeholder: 'Total flagrantes' },
  ];

  return (
    <div className="animate-fadeIn">
      {showSuccess && (
        <div className="fixed top-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce">
          {initialData ? 'Registro atualizado!' : 'Registro salvo com sucesso!'}
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-emerald-400">{initialData ? 'Editar Produtividade' : 'Novo Registro de Produtividade'}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">Cancelar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <div className="flex flex-col">
            <label className="text-sm text-gray-400 mb-2">Cidade</label>
            <select value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="bg-gray-800 text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-emerald-500">
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-400 mb-2">Mês</label>
            <select value={formData.month} onChange={e => setFormData({...formData, month: parseInt(e.target.value)})} className="bg-gray-800 text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-emerald-500">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-400 mb-2">Ano</label>
            <select 
              value={formData.year} 
              onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} 
              className="bg-gray-800 text-white rounded-lg p-2 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {Array.from({ length: 7 }, (_, i) => 2024 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-900 p-6 rounded-2xl border border-gray-800">
          {fields.map(f => (
            <div key={f.key} className="flex flex-col">
              <label className="text-sm text-gray-400 mb-2">{f.label}</label>
              <input 
                type="number" 
                step={f.key === 'drugsKg' ? '0.001' : '1'} 
                placeholder={f.placeholder}
                value={formData[f.key as keyof typeof formData]} 
                onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 text-lg font-bold outline-none focus:border-emerald-500"/>
            </div>
          ))}
        </div>
        <button type="submit" className="w-full bg-emerald-600 py-4 rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg active:scale-95">
          {initialData ? 'Atualizar Registro' : 'Confirmar Lançamento'}
        </button>
      </form>
    </div>
  );
};

export default ProductivityForm;
