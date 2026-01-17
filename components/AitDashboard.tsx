
import React, { useState, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LabelList
} from 'recharts';
import { CITIES, MONTHS } from '../constants.tsx';
import { TrafficInfraction } from '../types.ts';
import AitInsights from './AitInsights.tsx';

declare var html2canvas: any;

interface AitDashboardProps {
  data: TrafficInfraction[];
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (item: TrafficInfraction) => void;
}

const CITY_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#a855f7", "#14b8a6"
];

const AitDashboard: React.FC<AitDashboardProps> = ({ data, isAdmin, onDelete, onEdit }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([CITIES[0]]);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const [tableSearch, setTableSearch] = useState('');
  const [barPeriodFilter, setBarPeriodFilter] = useState<string>('latest');

  const toggleCity = (city: string) => {
    setSelectedCities(prev => {
      if (prev.includes(city)) {
        if (prev.length === 1) return prev; 
        return prev.filter(c => c !== city);
      }
      return [...prev, city];
    });
  };

  const filteredData = useMemo(() => {
    return data.filter(d => selectedCities.includes(d.city));
  }, [data, selectedCities]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(data.map(d => Number(d.year)))).sort((a, b) => (b as number) - (a as number));
  }, [data]);

  const availablePeriods = useMemo(() => {
    const periods = data.map(d => ({
      id: `${d.year}-${d.month}`,
      label: `${MONTHS[d.month]} de ${d.year}`,
      sortVal: Number(d.year) * 12 + Number(d.month)
    }));
    
    const unique = Array.from(new Map(periods.map(p => [p.id, p])).values());
    return unique.sort((a: {sortVal: number}, b: {sortVal: number}) => b.sortVal - a.sortVal);
  }, [data]);

  const lineChartData = useMemo(() => {
    const yearToFilter = selectedYearFilter === 'all' ? null : parseInt(selectedYearFilter);
    const records = yearToFilter 
      ? filteredData.filter(d => d.year === yearToFilter)
      : filteredData;

    const uniquePeriods = Array.from(new Set(records.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`)))
      .sort((a, b) => (a as string).localeCompare(b as string));
    
    return uniquePeriods.map(period => {
      const [year, month] = (period as string).split('-').map(Number);
      const entry: any = {
        periodLabel: `${MONTHS[month].substring(0, 3)}/${String(year).substring(2)}`,
        fullName: `${MONTHS[month]} de ${year}`
      };
      selectedCities.forEach(city => {
        const record = records.find(d => d.city === city && d.month === month && d.year === year);
        entry[city] = record ? record.total : 0;
      });
      return entry;
    });
  }, [filteredData, selectedCities, selectedYearFilter]);

  const barChartData = useMemo(() => {
    if (data.length === 0) return [];
    
    let targetYear: number, targetMonth: number;

    if (barPeriodFilter === 'latest') {
      const latest = [...data].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
      targetYear = latest.year;
      targetMonth = latest.month;
    } else {
      const [y, m] = barPeriodFilter.split('-').map(Number);
      targetYear = y;
      targetMonth = m;
    }

    return selectedCities.map(city => {
      const record = data.find(d => d.city === city && d.year === targetYear && d.month === targetMonth);
      return {
        name: city,
        Carros: record?.cars || 0,
        Motos: record?.motorcycles || 0,
        Caminhões: record?.trucks || 0,
        Outros: record?.others || 0,
        total: record?.total || 0,
        periodInfo: `${MONTHS[targetMonth]} de ${targetYear}`
      };
    });
  }, [data, selectedCities, barPeriodFilter]);

  const tableData = useMemo(() => {
    return filteredData.filter(d => {
      const matchesSearch = d.city.toLowerCase().includes(tableSearch.toLowerCase());
      const matchesYear = selectedYearFilter === 'all' ? true : d.year === parseInt(selectedYearFilter);
      return matchesSearch && matchesYear;
    }).sort((a, b) => (Number(b.year) * 12 + Number(b.month)) - (Number(a.year) * 12 + Number(a.month)));
  }, [filteredData, tableSearch, selectedYearFilter]);

  const handleExportImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#030712',
        scale: 2,
        logging: false,
        useCORS: true,
        onclone: (clonedDoc: Document) => {
          const exportHeader = clonedDoc.getElementById('export-summary-header');
          if (exportHeader) (exportHeader as HTMLElement).style.display = 'block';
        }
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/png");
      link.download = `relatorio_22bpm_ait_${new Date().getTime()}.png`;
      link.click();
    } catch (err) {
      alert("Erro ao exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  const TooltipStyle = {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '12px',
    color: '#fff'
  };

  return (
    <div className="animate-fadeIn pb-12" ref={dashboardRef}>
      <div id="export-summary-header" className="hidden mb-8 p-6 bg-gray-900 border-b-4 border-blue-600 rounded-t-3xl text-white">
        <h1 className="text-3xl font-black mb-1 uppercase text-center">22º Batalhão de Polícia Militar</h1>
        <p className="text-sm font-bold text-blue-400 uppercase tracking-widest text-center">Relatório Geral de Infrações de Trânsito</p>
      </div>

      <div className="no-export mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Análise Comparativa</h2>
            <p className="text-gray-400">Dados consolidados do Batalhão por Município.</p>
          </div>
          <div className="flex gap-2">
             <button 
              onClick={handleExportImage}
              disabled={isExporting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all text-xs"
            >
              {isExporting ? 'Processando...' : 'Exportar PNG'}
            </button>
          </div>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
          <label className="text-[10px] font-black text-gray-500 uppercase mb-3 block ml-1">Cidades Ativas</label>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => toggleCity(city)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedCities.includes(city) 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/20' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-3xl p-12 text-center">
          <p className="text-gray-400 italic">Nenhum dado cadastrado para as cidades selecionadas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Evolução Mensal (Total Geral)</h3>
                <select 
                  value={selectedYearFilter} 
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-[10px] font-bold text-gray-300 rounded-lg px-2 py-1 outline-none"
                >
                  <option value="all">Anos (Todos)</option>
                  {availableYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 30, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="periodLabel" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" fontSize={11} />
                    <Tooltip contentStyle={TooltipStyle} itemStyle={{ color: '#fff' }} />
                    <Legend verticalAlign="top" height={36}/>
                    {selectedCities.map((city, idx) => (
                      <Line 
                        key={city} 
                        type="monotone" 
                        dataKey={city} 
                        stroke={CITY_COLORS[idx % CITY_COLORS.length]} 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: CITY_COLORS[idx % CITY_COLORS.length] }}
                      >
                         <LabelList 
                           dataKey={city} 
                           position="top" 
                           dy={-15} 
                           style={{ fill: '#9ca3af', fontSize: '10px', fontWeight: 'bold' }} 
                         />
                      </Line>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Distribuição por Categoria</h3>
                <select 
                  value={barPeriodFilter} 
                  onChange={(e) => setBarPeriodFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-[10px] font-bold text-gray-300 rounded-lg px-2 py-1 outline-none max-w-[150px]"
                >
                  <option value="latest">Mais Recente</option>
                  {availablePeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" fontSize={11} />
                    <Tooltip contentStyle={TooltipStyle} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar dataKey="Carros" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Carros" position="top" dy={-10} style={{ fill: '#60a5fa', fontSize: '9px', fontWeight: 'bold' }} />
                    </Bar>
                    <Bar dataKey="Motos" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Motos" position="top" dy={-10} style={{ fill: '#34d399', fontSize: '9px', fontWeight: 'bold' }} />
                    </Bar>
                    <Bar dataKey="Caminhões" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Caminhões" position="top" dy={-10} style={{ fill: '#fbbf24', fontSize: '9px', fontWeight: 'bold' }} />
                    </Bar>
                    <Bar dataKey="Outros" fill="#6b7280" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Outros" position="top" dy={-10} style={{ fill: '#9ca3af', fontSize: '9px', fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-xl no-export">
            <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between gap-4">
                <h3 className="text-lg font-bold text-white">Histórico Detalhado</h3>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Pesquisar cidade..." 
                      value={tableSearch} 
                      onChange={(e) => setTableSearch(e.target.value)} 
                      className="bg-gray-800 border border-gray-700 text-xs rounded-xl px-4 py-2 outline-none text-white focus:ring-1 focus:ring-blue-500" 
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-800/50 text-gray-500 text-[10px] uppercase tracking-widest font-black">
                        <tr>
                            <th className="px-6 py-4">Cidade</th>
                            <th className="px-6 py-4">Mês/Ano</th>
                            <th className="px-6 py-4 text-center">Carros</th>
                            <th className="px-6 py-4 text-center">Motos</th>
                            <th className="px-6 py-4 text-center">Cam.</th>
                            <th className="px-6 py-4 text-center">Outros</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            {isAdmin && <th className="px-6 py-4 text-center">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {tableData.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-white">{row.city}</td>
                              <td className="px-6 py-4 text-gray-400 text-sm">{MONTHS[row.month]} de {row.year}</td>
                              <td className="px-6 py-4 text-center text-gray-300">{row.cars}</td>
                              <td className="px-6 py-4 text-center text-gray-300">{row.motorcycles}</td>
                              <td className="px-6 py-4 text-center text-gray-300">{row.trucks}</td>
                              <td className="px-6 py-4 text-center text-gray-300">{row.others}</td>
                              <td className="px-6 py-4 text-right">
                                  <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-xs font-black">
                                      {row.total}
                                  </span>
                              </td>
                              {isAdmin && (
                                <td className="px-6 py-4 text-center">
                                  <div className="flex justify-center gap-3">
                                    <button 
                                      onClick={() => onEdit?.(row)} 
                                      className="text-gray-500 hover:text-blue-400 transition-colors"
                                      title="Editar lançamento"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (row.id && onDelete) {
                                          onDelete(row.id);
                                        }
                                      }} 
                                      className="text-gray-500 hover:text-red-500 transition-colors"
                                      title="Excluir lançamento"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                  </div>
                                </td>
                              )}
                          </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          <div className="no-export">
            <AitInsights data={data} selectedCities={selectedCities} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AitDashboard;
