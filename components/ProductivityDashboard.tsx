
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList 
} from 'recharts';
import { CITIES, MONTHS } from '../constants';
import { ProductivityRecord } from '../types';

interface ProductivityDashboardProps {
  data: ProductivityRecord[];
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (item: ProductivityRecord) => void;
}

const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({ data, isAdmin, onDelete, onEdit }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedCities, setSelectedCities] = useState<string[]>([CITIES[0]]);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Filtros de período individuais para cada gráfico (formato: "ano-mês" ou "ano")
  const [periodProc, setPeriodProc] = useState<string>('latest');
  const [periodPrev, setPeriodPrev] = useState<string>('latest');
  const [periodRepr, setPeriodRepr] = useState<string>('latest');

  // Filtro de dados base para a tabela e resumo dinâmico
  const filteredData = useMemo(() => {
    return data.filter(d => selectedCities.includes(d.city) && d.year.toString() === selectedYear);
  }, [data, selectedCities, selectedYear]);

  // Totais apenas para as cidades selecionadas no ano selecionado
  const selectedTotals = useMemo(() => {
    return {
      ba: filteredData.reduce((s, d) => s + d.ba, 0),
      cop: filteredData.reduce((s, d) => s + d.cop, 0),
      tc: filteredData.reduce((s, d) => s + d.tc, 0),
      arrests: filteredData.reduce((s, d) => s + d.arrests, 0),
      weapons: filteredData.reduce((s, d) => s + d.weapons, 0),
      drugs: filteredData.reduce((s, d) => s + d.drugsKg, 0),
      people: filteredData.reduce((s, d) => s + d.peopleApproached, 0),
      vehicles: filteredData.reduce((s, d) => s + d.vehiclesInspected, 0),
      fugitives: filteredData.reduce((s, d) => s + d.fugitives, 0),
    };
  }, [filteredData]);

  // Lista de períodos únicos disponíveis nos dados (para os menus dos gráficos)
  const availablePeriods = useMemo(() => {
    const periods = data.map(d => ({
      id: `${d.year}-${d.month}`,
      label: `${MONTHS[d.month]} de ${d.year}`,
      sortVal: Number(d.year) * 12 + Number(d.month)
    }));
    const unique = Array.from(new Map(periods.map(p => [p.id, p])).values());
    return unique.sort((a: any, b: any) => b.sortVal - a.sortVal);
  }, [data]);

  const battalionTotals = useMemo(() => {
    const yearData = data.filter(d => d.year.toString() === selectedYear);
    return {
      ba: yearData.reduce((s, d) => s + d.ba, 0),
      cop: yearData.reduce((s, d) => s + d.cop, 0),
      tc: yearData.reduce((s, d) => s + d.tc, 0),
      arrests: yearData.reduce((s, d) => s + d.arrests, 0),
      weapons: yearData.reduce((s, d) => s + d.weapons, 0),
      drugs: yearData.reduce((s, d) => s + d.drugsKg, 0),
      people: yearData.reduce((s, d) => s + d.peopleApproached, 0),
      vehicles: yearData.reduce((s, d) => s + d.vehiclesInspected, 0),
      fugitives: yearData.reduce((s, d) => s + d.fugitives, 0),
    };
  }, [data, selectedYear]);

  // Função para processar dados de um gráfico baseado no período selecionado
  const getChartDataForPeriod = (periodKey: string) => {
    let targetYear: number, targetMonth: number;

    if (periodKey === 'latest' && data.length > 0) {
      const latest = [...data].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
      targetYear = latest.year;
      targetMonth = latest.month;
    } else if (periodKey !== 'latest') {
      const [y, m] = periodKey.split('-').map(Number);
      targetYear = y;
      targetMonth = m;
    } else {
      return [];
    }

    return selectedCities.map(city => {
      const record = data.find(d => d.city === city && d.year === targetYear && d.month === targetMonth);
      return {
        name: city,
        BA: record?.ba || 0,
        COP: record?.cop || 0,
        TC: record?.tc || 0,
        Prisões: record?.arrests || 0,
        Armas: record?.weapons || 0,
        Drogas: parseFloat((record?.drugsKg || 0).toFixed(1)),
        Abordagens: record?.peopleApproached || 0,
        Veículos: record?.vehiclesInspected || 0,
        Foragidos: record?.fugitives || 0,
      };
    });
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev => prev.includes(city) ? (prev.length > 1 ? prev.filter(c => c !== city) : prev) : [...prev, city]);
  };

  const StatMiniCard = ({ label, value, colorClass = "text-white" }: { label: string, value: string | number, colorClass?: string }) => (
    <div className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/50 text-center flex flex-col justify-center min-h-[70px]">
      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{label}</p>
      <p className={`text-base font-black ${colorClass}`}>{value}</p>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-xl shadow-2xl z-50">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest border-b border-gray-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-black py-0.5" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const years = Array.from({ length: 5 }, (_, i) => (parseInt(currentYear) - 2 + i).toString());

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 uppercase tracking-tight">Estatísticas de Produtividade</h2>
          <p className="text-gray-400 text-sm">Visão geral da performance operacional do Batalhão.</p>
        </div>
        <div className="flex items-center space-x-3 bg-gray-900 p-2 rounded-xl border border-gray-800 shadow-lg">
          <span className="text-xs font-bold text-gray-500 uppercase ml-2">Filtrar Resumo (Ano):</span>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-gray-800 text-white rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-gray-700 transition-colors font-bold text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-4 md:p-6 shadow-inner">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1">Resumo Consolidado 22º BPM ({selectedYear})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
          <StatMiniCard label="BA" value={battalionTotals.ba} />
          <StatMiniCard label="COP" value={battalionTotals.cop} />
          <StatMiniCard label="TC" value={battalionTotals.tc} />
          <StatMiniCard label="Prisões" value={battalionTotals.arrests} colorClass="text-emerald-400" />
          <StatMiniCard label="Armas" value={battalionTotals.weapons} colorClass="text-red-400" />
          <StatMiniCard label="Drogas" value={`${battalionTotals.drugs.toFixed(1)}kg`} colorClass="text-emerald-500" />
          <StatMiniCard label="Foragidos" value={battalionTotals.fugitives} colorClass="text-amber-400" />
          <StatMiniCard label="Abordagens" value={battalionTotals.people} colorClass="text-blue-400" />
          <StatMiniCard label="Veículos" value={battalionTotals.vehicles} colorClass="text-indigo-400" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-lg">
          <label className="text-[10px] font-black text-gray-500 uppercase mb-3 block ml-1">Municípios para Comparação nos Gráficos</label>
          <div className="flex flex-wrap gap-2">
            {CITIES.map(c => (
              <button key={c} onClick={() => toggleCity(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedCities.includes(c) ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Resumo Consolidado das Cidades Selecionadas */}
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-4 md:p-6 shadow-inner">
          <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Total das Cidades Selecionadas ({selectedYear})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
            <StatMiniCard label="BA" value={selectedTotals.ba} />
            <StatMiniCard label="COP" value={selectedTotals.cop} />
            <StatMiniCard label="TC" value={selectedTotals.tc} />
            <StatMiniCard label="Prisões" value={selectedTotals.arrests} colorClass="text-emerald-400" />
            <StatMiniCard label="Armas" value={selectedTotals.weapons} colorClass="text-red-400" />
            <StatMiniCard label="Drogas" value={`${selectedTotals.drugs.toFixed(1)}kg`} colorClass="text-emerald-500" />
            <StatMiniCard label="Foragidos" value={selectedTotals.fugitives} colorClass="text-amber-400" />
            <StatMiniCard label="Abordagens" value={selectedTotals.people} colorClass="text-blue-400" />
            <StatMiniCard label="Veículos" value={selectedTotals.vehicles} colorClass="text-indigo-400" />
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico 1: Procedimentos Administrativos */}
          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Procedimentos Administrativos</h3>
              <select 
                value={periodProc} 
                onChange={e => setPeriodProc(e.target.value)}
                className="bg-gray-800 text-[10px] font-bold text-gray-300 border border-gray-700 rounded-lg px-3 py-2 outline-none uppercase cursor-pointer max-w-[200px]"
              >
                <option value="latest">Mês mais recente</option>
                {availablePeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartDataForPeriod(periodProc)} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
                  <Bar dataKey="BA" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="BA" position="top" style={{ fill: '#3b82f6', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="COP" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="COP" position="top" style={{ fill: '#6366f1', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="TC" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="TC" position="top" style={{ fill: '#8b5cf6', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Atividade Preventiva */}
          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Atividades Preventivas</h3>
              <select 
                value={periodPrev} 
                onChange={e => setPeriodPrev(e.target.value)}
                className="bg-gray-800 text-[10px] font-bold text-gray-300 border border-gray-700 rounded-lg px-3 py-2 outline-none uppercase cursor-pointer max-w-[200px]"
              >
                <option value="latest">Mês mais recente</option>
                {availablePeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartDataForPeriod(periodPrev)} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
                  <Bar dataKey="Abordagens" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Abordagens" position="top" style={{ fill: '#0ea5e9', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="Veículos" fill="#818cf8" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Veículos" position="top" style={{ fill: '#818cf8', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="Foragidos" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Foragidos" position="top" style={{ fill: '#f59e0b', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 3: Repressão e Apreensões */}
          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Repressão e Apreensões</h3>
              <select 
                value={periodRepr} 
                onChange={e => setPeriodRepr(e.target.value)}
                className="bg-gray-800 text-[10px] font-bold text-gray-300 border border-gray-700 rounded-lg px-3 py-2 outline-none uppercase cursor-pointer max-w-[200px]"
              >
                <option value="latest">Mês mais recente</option>
                {availablePeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartDataForPeriod(periodRepr)} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
                  <Bar dataKey="Prisões" fill="#10b981" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Prisões" position="top" style={{ fill: '#10b981', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="Armas" fill="#ef4444" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Armas" position="top" style={{ fill: '#ef4444', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                  <Bar dataKey="Drogas" fill="#059669" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Drogas" position="top" style={{ fill: '#059669', fontSize: '10px', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-xl no-export flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">Detalhamento por Lançamento Individual</h3>
            </div>
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                    <thead className="bg-gray-800/50 text-gray-400 text-[10px] uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Cidade/Mês</th>
                            <th className="px-6 py-4 text-center">BA</th>
                            <th className="px-6 py-4 text-center">Prisões</th>
                            <th className="px-6 py-4 text-center">Armas</th>
                            <th className="px-6 py-4 text-center">Drogas</th>
                            {isAdmin && <th className="px-6 py-4 text-center">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredData.length > 0 ? filteredData.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-white text-sm">{row.city}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-black">{MONTHS[row.month]} {row.year}</p>
                              </td>
                              <td className="px-6 py-4 text-center text-sm">{row.ba}</td>
                              <td className="px-6 py-4 text-center font-bold text-emerald-400 text-sm">{row.arrests}</td>
                              <td className="px-6 py-4 text-center font-bold text-red-400 text-sm">{row.weapons}</td>
                              <td className="px-6 py-4 text-center text-sm">{row.drugsKg}kg</td>
                              {isAdmin && (
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-3">
                                    <button onClick={() => onEdit?.(row)} className="text-gray-500 hover:text-emerald-500 transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                    </button>
                                    <button onClick={() => onDelete?.(row.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                  </div>
                                </td>
                              )}
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm italic">
                              Nenhum registro individual encontrado para o filtro de ano selecionado.
                            </td>
                          </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl p-16 text-center shadow-inner">
          <h4 className="text-xl font-medium text-gray-400">Nenhum dado cadastrado para as cidades selecionadas</h4>
          <p className="text-gray-600 text-sm mt-2 uppercase tracking-widest font-bold">Inicie um novo lançamento de produtividade para alimentar o sistema</p>
        </div>
      )}
    </div>
  );
};

export default ProductivityDashboard;
