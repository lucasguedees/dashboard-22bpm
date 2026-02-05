import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LabelList
} from 'recharts';
import { CITIES, MONTHS } from '../constants';
import { TrafficInfraction } from '../types';

declare var html2canvas: any;

interface AitDashboardProps {
  data: TrafficInfraction[];
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (item: TrafficInfraction) => void;
  userGroup?: string;
  userCity?: string;
}

// Mapeamento de cidades por grupo
const CITY_GROUPS = {
  '1ª CIA': ['Lajeado', 'Cruzeiro do Sul', 'Santa Clara do Sul', 'Forquetinha', 'Sério', 'Canudos do Vale'],
  '2ª CIA': ['Encantado', 'Roca Sales', 'Nova Bréscia', 'Coqueiro Baixo', 'Muçum', 'Relvado', 'Doutor Ricardo', 'Vespasiano Correa'],
  '3ª CIA': ['Arroio do Meio', 'Capitão', 'Travesseiro', 'Marques de Souza', 'Pouso Novo', 'Progresso']
} as const;

type CityGroup = keyof typeof CITY_GROUPS;
type City = typeof CITY_GROUPS[CityGroup][number];

const CITY_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#a855f7", "#14b8a6"
];

const ExpandedModal: React.FC<{
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, isOpen, onClose, onExport, isExporting, action, children }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-6xl h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <div className="flex items-center gap-3">
            {action}
            <button
              onClick={onExport}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {isExporting ? 'Exportando…' : 'Exportar PNG'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >✕</button>
          </div>
        </div>

        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
};

const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  selectedYearFilter?: string;
  barChartData?: any[];
}> = ({ title, children, action, selectedYearFilter, barChartData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const modalChartRef = useRef<HTMLDivElement>(null);
  const isExportingRef = useRef(false);

  const handleExportExpandedChart = async () => {
    const targetRef = modalChartRef.current || chartRef.current;
    if (!targetRef || isExportingRef.current) return;
    
    isExportingRef.current = true;
    setIsExporting(true);
    
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '9999';
      document.body.appendChild(tempContainer);
      
      const wrapper = document.createElement('div');
      wrapper.style.padding = '24px';
      wrapper.style.backgroundColor = '#030712';
      wrapper.style.borderRadius = '16px';
      
      // Adicionar header com informações do filtro
      const header = document.createElement('div');
      header.style.padding = '16px';
      header.style.backgroundColor = '#111827';
      header.style.borderRadius = '8px';
      header.style.marginBottom = '16px';
      header.style.borderLeft = '4px solid #3b82f6';
      
      const titleElement = document.createElement('h2');
      titleElement.style.color = '#ffffff';
      titleElement.style.fontSize = '18px';
      titleElement.style.fontWeight = 'bold';
      titleElement.style.margin = '0 0 8px 0';
      titleElement.textContent = title;
      
      const subtitle = document.createElement('p');
      subtitle.style.color = '#9ca3af';
      subtitle.style.fontSize = '14px';
      subtitle.style.margin = '0';
      
      // Determinar qual informação de filtro mostrar
      if (title.includes('Evolução Mensal')) {
        const yearFilter = selectedYearFilter === 'all' ? 'Todos os anos' : `Ano: ${selectedYearFilter}`;
        subtitle.textContent = `Período: ${yearFilter}`;
      } else if (title.includes('Distribuição por Categoria')) {
        const periodInfo = barChartData?.[0]?.periodInfo || 'Período não disponível';
        subtitle.textContent = `Período: ${periodInfo}`;
      } else {
        subtitle.textContent = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
      }
      
      header.appendChild(titleElement);
      header.appendChild(subtitle);
      
      const clone = targetRef.cloneNode(true) as HTMLElement;
      
      clone.style.width = `${targetRef.offsetWidth}px`;
      clone.style.height = 'auto';
      clone.style.position = 'relative';
      clone.style.backgroundColor = '#030712';
      clone.style.borderRadius = '12px';
      
      wrapper.appendChild(header);
      wrapper.appendChild(clone);
      tempContainer.appendChild(wrapper);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      
      const link = document.createElement('a');
      link.download = `grafico_22bpm_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (err) {
      console.error('Erro ao exportar gráfico expandido:', err);
      alert('Ocorreu um erro ao exportar o gráfico. Por favor, tente novamente.');
    } finally {
      const tempContainer = document.querySelector('div[style*="position: fixed; left: -9999px"]');
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      isExportingRef.current = false;
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl">
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
        <div className="relative" ref={chartRef}>
          {children}
        </div>
      </div>

      <ExpandedModal
        title={title}
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        onExport={handleExportExpandedChart}
        isExporting={isExporting}
        action={action}
      >
        <div className="relative" ref={modalChartRef}>
          {children}
        </div>
      </ExpandedModal>
    </>
  );
};

const AitDashboard: React.FC<AitDashboardProps> = ({ data, isAdmin, onDelete, onEdit, userGroup, userCity }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  // Função para selecionar todas as cidades do grupo do usuário
  const selectGroupCities = () => {
    if (userGroup && CITY_GROUPS[userGroup as CityGroup]) {
      setSelectedCities([...CITY_GROUPS[userGroup as CityGroup]]);
    }
  };

  // Função para limpar todas as seleções e voltar para a cidade do usuário
  const clearSelection = () => {
    if (userCity && CITIES.includes(userCity)) {
      setSelectedCities([userCity]);
    } else if (CITIES.length > 0) {
      setSelectedCities([CITIES[0]]);
    } else {
      setSelectedCities([]);
    }
  };

  // Usar todas as cidades
  const getUserCities = useMemo(() => {
    return CITIES; // Retorna todas as cidades
  }, []);

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedAnnualYear, setSelectedAnnualYear] = useState<string>('latest');
  const [tableSearch, setTableSearch] = useState('');
  const [barPeriodFilter, setBarPeriodFilter] = useState('latest');
  const [barYearFilter, setBarYearFilter] = useState('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const isExportingRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);

  // Inicializar com a cidade do usuário ou a primeira cidade por padrão
  useEffect(() => {
    if (userGroup && userCity && CITIES.includes(userCity)) {
      setSelectedCities([userCity]);
    } else if (CITIES.length > 0) {
      setSelectedCities([CITIES[0]]);
    }
  }, [userGroup, userCity]);

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

  // Calcular total anual por cidade
  const annualTotals = useMemo(() => {
    const totals: { [city: string]: number } = {};
    const allYears = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
    
    selectedCities.forEach(city => {
      const cityData = data.filter(d => d.city === city);
      
      let targetYear: number;
      if (selectedAnnualYear === 'latest') {
        // Obter o ano mais recente para cada cidade
        const cityYears = Array.from(new Set(cityData.map(d => d.year)));
        targetYear = cityYears.length > 0 ? Math.max(...cityYears) : new Date().getFullYear();
      } else {
        targetYear = parseInt(selectedAnnualYear);
      }
      
      // Somar todos os meses do ano selecionado
      const yearTotal = cityData
        .filter(d => d.year === targetYear)
        .reduce((sum, d) => sum + d.total, 0);
      
      totals[city] = yearTotal;
    });
    return totals;
  }, [data, selectedCities, selectedAnnualYear]);

  // Obter anos disponíveis para o menu
  const availableYearsForAnnual = useMemo(() => {
    const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
    return [
      { value: 'latest', label: 'Mais recente' },
      ...years.map(year => ({
        value: year.toString(),
        label: year.toString()
      }))
    ];
  }, [data]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(data.map(d => Number(d.year)))).sort((a, b) => (b as number) - (a as number));
  }, [data]);

  const availablePeriods = useMemo(() => {
    // Get unique periods that actually have data
    const uniquePeriods = Array.from(new Set(data.map(d => `${d.year}-${d.month}`)));
    
    const periods = uniquePeriods.map(periodStr => {
      const [year, month] = periodStr.split('-').map(Number);
      // d.month is 1-based (1-12), so subtract 1 for array indexing (0-11)
      const monthIndex = month - 1;
      return {
        id: `${year}-${month}`,
        label: `${MONTHS[monthIndex]} de ${year}`,
        year: year,
        month: month,
        sortVal: Number(year) * 12 + monthIndex
      };
    });
    
    return periods.sort((a: {sortVal: number}, b: {sortVal: number}) => a.sortVal - b.sortVal);
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
    // Obter períodos que têm dados para as cidades e filtro de ano selecionados
    const yearToFilter = barYearFilter === 'all' ? null : parseInt(barYearFilter);
    const records = yearToFilter 
      ? filteredData.filter(d => d.year === yearToFilter)
      : filteredData;

    // Obter períodos únicos dos registros filtrados
    const uniquePeriods = Array.from(
      new Map(
        records.map(item => [
          `${item.year}-${String(item.month).padStart(2, '0')}`,
          { year: item.year, month: item.month }
        ])
      ).values()
    );
    
    const periods = uniquePeriods.map(({ year, month }) => {
      // Converter do formato do banco (0-11) para o formato de exibição (1-12)
      const displayMonth = month + 1;
      const monthName = MONTHS[month] || `Mês ${displayMonth}`; // MONTHS já está indexado em 0-11
      
      return {
        id: `${year}-${displayMonth}`,
        label: `${monthName} de ${year}`,
        year: year,
        month: displayMonth, // Usar o mês no formato 1-12 para exibição
        sortVal: year * 12 + month // Manemos o mês no formato 0-11 para ordenação
      };
    });
    
    return periods.sort((a, b) => a.sortVal - b.sortVal);
  }, [filteredData, barYearFilter]);

  const lineChartData = useMemo(() => {
    const yearToFilter = selectedYearFilter === 'all' ? null : parseInt(selectedYearFilter);
    const records = yearToFilter 
      ? filteredData.filter(d => d.year === yearToFilter)
      : filteredData;

    // Ordenar os registros por ano e mês
    const sortedRecords = [...records].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Usar os registros ordenados para criar os períodos únicos
    const uniquePeriods = Array.from(
      new Map(
        sortedRecords.map(item => [
          `${item.year}-${String(item.month).padStart(2, '0')}`,
          { year: item.year, month: item.month }
        ])
      ).values()
    );
    
    return uniquePeriods.map(({ year, month }) => {
      // Converter do formato do banco (0-11) para o formato de exibição (1-12)
      const displayMonth = month + 1;
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const fullMonthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const monthAbbr = monthNames[month]; // Já está no formato 0-11
      const fullMonthName = fullMonthNames[month]; // Já está no formato 0-11
      
      const entry: any = {
        periodLabel: `${monthAbbr}/${String(year).substring(2)}`,
        fullName: `${fullMonthName} de ${year}`,
        month: displayMonth, // Usar o mês no formato 1-12 para exibição
        year: year,
        monthName: fullMonthName,
        // Adiciona uma propriedade para ordenação correta
        sortKey: year * 100 + displayMonth
      };
      
      // Buscar os dados para cada cidade no período
      selectedCities.forEach(city => {
        const record = records.find(d => 
          d.city === city && 
          d.month === month && // Usar o mês no formato 0-11 para busca
          d.year === year
        );
        entry[city] = record ? record.total : 0;
      });
      
      return entry;
    }).sort((a, b) => a.sortKey - b.sortKey); // Ordenar por ano e mês
  }, [filteredData, selectedCities, selectedYearFilter]);

  const barChartData = useMemo(() => {
    if (data.length === 0) return [];
    
    let targetYear: number, targetMonth: number;

    if (barPeriodFilter === 'latest') {
      const latest = [...data].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
      targetYear = latest.year;
      targetMonth = latest.month; // Já está no formato 0-11 do banco de dados
    } else if (barPeriodFilter.includes('-')) {
      // O barPeriodFilter está no formato 'YYYY-MM' (MM é 1-12)
      const [y, m] = barPeriodFilter.split('-').map(Number);
      targetYear = y;
      // Converter do formato de exibição (1-12) para o formato do banco (0-11)
      targetMonth = Math.max(0, Math.min(11, m - 1));
    } else if (barYearFilter !== 'all') {
      targetYear = parseInt(barYearFilter);
      const monthsInYear = data
        .filter(d => d.year === targetYear)
        .map(d => d.month);
      targetMonth = monthsInYear.length > 0 ? Math.max(...monthsInYear) : 1;
    } else {
      const latest = [...data].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
      targetYear = latest.year;
      targetMonth = latest.month;
    }

    // targetMonth is 1-based (1-12), so subtract 1 for array indexing (0-11)
    const displayMonth = targetMonth - 1;
    
    return selectedCities.map(city => {
      const record = data.find(d => d.city === city && d.year === targetYear && d.month === targetMonth);
      return {
        name: city,
        Carros: record?.cars || 0,
        Motos: record?.motorcycles || 0,
        Caminhões: record?.trucks || 0,
        Outros: record?.others || 0,
        total: record?.total || 0,
        periodInfo: `${MONTHS[displayMonth]} de ${targetYear}`
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
    
    const originalStates = {
      selectedCities: [...selectedCities],
      selectedYearFilter,
      tableSearch,
      barPeriodFilter,
      barYearFilter,
      isHistoryOpen
    };
    
    isExportingRef.current = true;
    setIsExporting(true);
    
    try {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '9999';
      document.body.appendChild(tempContainer);
      
      const wrapper = document.createElement('div');
      wrapper.style.padding = '24px';
      wrapper.style.backgroundColor = '#030712';
      wrapper.style.borderRadius = '16px';
      
      const clone = dashboardRef.current.cloneNode(true) as HTMLElement;
      
      clone.style.width = `${dashboardRef.current.offsetWidth}px`;
      clone.style.height = 'auto';
      clone.style.position = 'relative';
      clone.style.backgroundColor = '#030712';
      clone.style.borderRadius = '12px';
      
      wrapper.appendChild(clone);
      tempContainer.appendChild(wrapper);
      
      const exportHeader = clone.querySelector('#export-summary-header') as HTMLElement;
      if (exportHeader) {
        exportHeader.style.display = 'block';
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      
      const link = document.createElement('a');
      link.download = `relatorio_22bpm_ait_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Ocorreu um erro ao exportar o relatório. Por favor, tente novamente.');
    } finally {
      const tempContainer = document.querySelector('div[style*="position: fixed; left: -9999px"]');
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      
      if (JSON.stringify(selectedCities) !== JSON.stringify(originalStates.selectedCities)) {
        setSelectedCities(originalStates.selectedCities);
      }
      if (selectedYearFilter !== originalStates.selectedYearFilter) {
        setSelectedYearFilter(originalStates.selectedYearFilter);
      }
      if (tableSearch !== originalStates.tableSearch) {
        setTableSearch(originalStates.tableSearch);
      }
      if (barPeriodFilter !== originalStates.barPeriodFilter) {
        setBarPeriodFilter(originalStates.barPeriodFilter);
      }
      if (barYearFilter !== originalStates.barYearFilter) {
        setBarYearFilter(originalStates.barYearFilter);
      }
      if (isHistoryOpen !== originalStates.isHistoryOpen) {
        setIsHistoryOpen(originalStates.isHistoryOpen);
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

  // Tooltip customizado para mostrar nome completo do mês
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={TooltipStyle} className="p-3">
          <p className="font-bold text-white mb-2">{data.fullName || data.monthName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                handleExportImage(e);
              }}
              disabled={isExporting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Processando...' : 'Exportar PNG'}
            </button>
          </div>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Cidades Ativas</label>
            <div className="flex gap-2">
              <button 
                onClick={clearSelection}
                className="text-[10px] bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded-md transition-colors"
                title="Limpar seleção"
              >
                Limpar
              </button>
              {userGroup && CITY_GROUPS[userGroup as CityGroup] && (
                <button 
                  onClick={selectGroupCities}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md transition-colors"
                  title={`Selecionar cidades da ${userGroup}`}
                >
                  Selecionar {userGroup}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {getUserCities.map((city) => (
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

        {/* Espaçamento entre as seções */}
        <div className="h-4"></div>

        {/* Painel de Total Anual de Infrações */}
        {selectedCities.length > 0 && (
          <div className="bg-gray-900/30 p-4 rounded-2xl border border-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-gray-500 uppercase">Total Anual de Infrações</label>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedAnnualYear}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedAnnualYear(e.target.value);
                  }}
                  className="bg-gray-800 border border-gray-700 text-[10px] font-bold text-gray-300 rounded-lg px-2 py-1 outline-none"
                  onClick={e => e.stopPropagation()}
                >
                  {availableYearsForAnnual.map(year => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1">
              {selectedCities.map((city) => {
                const total = annualTotals[city] || 0;
                const displayYear = selectedAnnualYear === 'latest' 
                  ? (() => {
                      const cityData = data.filter(d => d.city === city);
                      const cityYears = Array.from(new Set(cityData.map(d => d.year)));
                      return cityYears.length > 0 ? Math.max(...cityYears) : new Date().getFullYear();
                    })()
                  : parseInt(selectedAnnualYear);
                
                return (
                  <div key={city} className="bg-gray-800/50 p-0.5 rounded border border-gray-700/50 hover:border-blue-500/30 transition-colors aspect-square flex flex-col justify-center items-center">
                    <div className="text-[15px] text-gray-500 font-medium text-center truncate w-full leading-none">{city}</div>
                    <div className="text-[40px] font-black text-blue-400 leading-none">{total.toLocaleString('pt-BR')}</div>
                    <div className="text-[14px] text-gray-600 leading-none">{displayYear}</div>
                  </div>
                );
              })}
            </div>
            {selectedCities.length > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">Total Geral</span>
                  <span className="text-sm font-black text-emerald-400">
                    {Object.values(annualTotals).reduce((sum, total) => sum + total, 0).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
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
              selectedYearFilter={selectedYearFilter}
              action={
                <select 
                  value={selectedYearFilter} 
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedYearFilter(e.target.value);
                  }}
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
                  <LineChart data={lineChartData} margin={{ top: 0, right: 30, left: 10, bottom: 5 }} key={`line-chart-${selectedYearFilter}-${selectedCities.join('-')}`}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="periodLabel" stroke="#4b5563" fontSize={11} />
                    <YAxis stroke="#4b5563" fontSize={11} domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36}/>
                    {selectedCities.map((city, idx) => (
                      <Line 
                        key={`${city}-${selectedYearFilter}`}
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
              barChartData={barChartData}
              action={
                <div className="flex gap-2">
                  <select 
                    value={barYearFilter}
                    onChange={(e) => {
                      e.stopPropagation();
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
                    onChange={(e) => {
                      e.stopPropagation();
                      setBarPeriodFilter(e.target.value);
                    }}
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
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                  {(() => {
                                    // O mês já está no formato 0-11 do banco de dados
                                    // Precisamos apenas garantir que esteja dentro do intervalo válido
                                    const monthIndex = Math.max(0, Math.min(11, row.month));
                                    return MONTHS[monthIndex] ? `${MONTHS[monthIndex]} de ${row.year}` : `Mês ${monthIndex + 1} de ${row.year}`;
                                  })()}
                                </td>
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
                                          console.log('Delete clicked - Row:', row);
                                          console.log('Row ID:', row.id);
                                          console.log('onDelete:', typeof onDelete);
                                          if (onDelete && row.id) {
                                            console.log('Calling onDelete...');
                                            onDelete(row.id);
                                          } else {
                                            alert('Erro: ID ou função de exclusão não encontrados');
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
        </div>
      )}
    </div>
  );
};

export default AitDashboard;
