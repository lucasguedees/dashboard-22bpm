
import React, { useState, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LabelList
} from 'recharts';
import { CITIES, MONTHS } from '../constants.tsx';
import { TrafficInfraction } from '../types.ts';
import AitInsights from './AitInsights.tsx';

interface ExpandedChartProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
}

const ExpandedChart: React.FC<ExpandedChartProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  width = '90vw',
  height = '80vh'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-6">
          <div style={{ width, height }} className="mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [tableSearch, setTableSearch] = useState('');
  const [barPeriodFilter, setBarPeriodFilter] = useState('latest');
  const [barYearFilter, setBarYearFilter] = useState('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const isExportingRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedChart, setExpandedChart] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
  }>({ isOpen: false, title: '', content: null });

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
      year: d.year,
      month: d.month,
      sortVal: Number(d.year) * 12 + Number(d.month)
    }));
    
    const unique = Array.from(new Map(periods.map(p => [p.id, p])).values());
    return unique.sort((a: {sortVal: number}, b: {sortVal: number}) => b.sortVal - a.sortVal);
  }, [data]);
  
  const availableYearsForBarChart = useMemo(() => {
    const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
    return [
      { value: 'all', label: 'Todos os anos' },
      ...years.map(year => ({
        value: year.toString(),
        label: year.toString()
      }))
    ];
  }, [data]);
  
  const filteredPeriodsForBarChart = useMemo(() => {
    if (barYearFilter === 'all') return availablePeriods;
    return availablePeriods.filter(p => p.year === parseInt(barYearFilter));
  }, [availablePeriods, barYearFilter]);

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

    if (barYearFilter !== 'all') {
      targetYear = parseInt(barYearFilter);
      // Se tiver um mês específico selecionado, usa ele, senão pega o mais recente do ano
      if (barPeriodFilter !== 'latest' && barPeriodFilter.includes('-')) {
        const [y, m] = barPeriodFilter.split('-').map(Number);
        if (y === targetYear) {
          targetMonth = m;
        } else {
          const monthsInYear = data
            .filter(d => d.year === targetYear)
            .map(d => d.month);
          targetMonth = Math.max(...monthsInYear);
        }
      } else {
        const monthsInYear = data
          .filter(d => d.year === targetYear)
          .map(d => d.month);
        targetMonth = monthsInYear.length > 0 ? Math.max(...monthsInYear) : 0;
      }
    } else if (barPeriodFilter === 'latest') {
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

  const handleExportImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dashboardRef.current || isExportingRef.current) return;
    
    isExportingRef.current = true;
    setIsExporting(true);
    
    try {
      // Create a temporary container for the export
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '9999';
      document.body.appendChild(tempContainer);
      
      // Create a wrapper for the content with padding
      const wrapper = document.createElement('div');
      wrapper.style.padding = '24px';
      wrapper.style.backgroundColor = '#030712';
      wrapper.style.borderRadius = '16px';
      
      // Clone the dashboard content
      const clone = dashboardRef.current.cloneNode(true) as HTMLElement;
      
      // Apply styles to the clone
      clone.style.width = `${dashboardRef.current.offsetWidth}px`;
      clone.style.height = 'auto';
      clone.style.position = 'relative';
      clone.style.backgroundColor = '#030712';
      clone.style.borderRadius = '12px';
      
      // Add the clone to the wrapper
      wrapper.appendChild(clone);
      tempContainer.appendChild(wrapper);
      
      // Show the export header in the clone
      const exportHeader = clone.querySelector('#export-summary-header') as HTMLElement;
      if (exportHeader) {
        exportHeader.style.display = 'block';
      }
      
      // Add a small delay to ensure the DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use html2canvas on the wrapper element
      const canvas = await html2canvas(wrapper, {
        backgroundColor: '#030712',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
      
      // Create and trigger download
      const link = document.createElement('a');
      link.download = `relatorio_22bpm_ait_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Ocorreu um erro ao exportar o relatório. Por favor, tente novamente.');
    } finally {
      // Clean up
      const tempContainer = document.querySelector('div[style*="position: fixed; left: -9999px"]');
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      isExportingRef.current = false;
      setIsExporting(false);
    }
  };

  const TooltipStyle = {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '12px',
    color: '#fff'
  };

  const ChartContainer: React.FC<{ 
    title: string; 
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
  }> = ({ title, children, className = '', action }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className={`bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <div className="flex items-center gap-2">
            {action}
            <button
              onClick={() => setIsExpanded(true)}
              className="text-gray-400 hover:text-blue-500 transition-colors p-1"
              aria-label={`Expandir gráfico: ${title}`}
              title="Expandir gráfico"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
        <div className="relative">
          {children}
        </div>
        
        {/* Modal de gráfico expandido */}
        {isExpanded && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setIsExpanded(false)}>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-white p-2 -mr-2"
                  aria-label="Fechar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-6">
                <div className="h-[calc(90vh-120px)]">
                  {children}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
              type="button"
              onClick={handleExportImage}
              disabled={isExporting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
            <ChartContainer 
              title="Evolução Mensal (Total Geral)"
              action={
                <select 
                  value={selectedYearFilter} 
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-[10px] font-bold text-gray-300 rounded-lg px-2 py-1 outline-none"
                  onClick={e => e.stopPropagation()}
                >
                  <option value="all">Anos (Todos)</option>
                  {availableYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                </select>
              }
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 0, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="periodLabel" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" fontSize={11} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]} />
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
            </ChartContainer>

            <ChartContainer 
              title="Distribuição por Categoria"
              action={
                <div className="flex gap-2">
                  <select 
                    value={barYearFilter}
                    onChange={(e) => {
                      setBarYearFilter(e.target.value);
                      setBarPeriodFilter('latest');
                    }}
                    className="bg-gray-800 border border-gray-700 text-[10px] font-bold text-gray-300 rounded-lg px-2 py-1 outline-none max-w-[120px]"
                    onClick={e => e.stopPropagation()}
                  >
                    {availableYearsForBarChart.map(year => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                  <select 
                    value={barPeriodFilter} 
                    onChange={(e) => setBarPeriodFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-[10px] font-bold text-gray-300 rounded-lg px-2 py-1 outline-none max-w-[150px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="latest">Mês mais recente</option>
                    {filteredPeriodsForBarChart.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              }
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 0, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" fontSize={11} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]} />
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
            </ChartContainer>
          </div>
          
          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-xl no-export">
            <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between gap-4">
                <h3 className="text-lg font-bold text-white">Histórico Detalhado</h3>
                <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Pesquisar cidade..." 
                      value={tableSearch} 
                      onChange={(e) => setTableSearch(e.target.value)} 
                      className="bg-gray-800 border border-gray-700 text-xs rounded-xl px-4 py-2 outline-none text-white focus:ring-1 focus:ring-blue-500" 
                    />
                    <button
                      aria-expanded={isHistoryOpen}
                      onClick={() => setIsHistoryOpen(v => !v)}
                      className="px-3 py-2 text-xs font-black uppercase tracking-widest rounded-xl border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors flex items-center gap-2"
                      title={isHistoryOpen ? 'Recolher' : 'Expandir'}
                    >
                      <svg className={`w-4 h-4 transition-transform ${isHistoryOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                      {isHistoryOpen ? 'Recolher' : 'Expandir'}
                    </button>
                </div>
            </div>

            {isHistoryOpen && (
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
            )}
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
