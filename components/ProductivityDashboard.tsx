
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList 
} from 'recharts';
import { CITIES, MONTHS } from '../constants';
import { ProductivityRecord } from '../types';
import html2canvas from 'html2canvas';

// Mapeamento de cidades por grupo
const CITY_GROUPS = {
  '1ª CIA': ['Lajeado', 'Cruzeiro do Sul', 'Santa Clara do Sul', 'Forquetinha', 'Sério', 'Canudos do Vale'],
  '2ª CIA': ['Encantado', 'Roca Sales', 'Nova Bréscia', 'Coqueiro Baixo', 'Muçum', 'Relvado', 'Doutor Ricardo', 'Vespasiano Correa'],
  '3ª CIA': ['Arroio do Meio', 'Capitão', 'Travesseiro', 'Marques de Souza', 'Pouso Novo', 'Progresso']
} as const;

type CityGroup = keyof typeof CITY_GROUPS;
type City = typeof CITY_GROUPS[CityGroup][number];

interface ProductivityDashboardProps {
  data: ProductivityRecord[];
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (item: ProductivityRecord) => void;
  userGroup?: string;
  userCity?: string;
  userName?: string;
}

const handleExportExpandedChart = async (chartElement: HTMLElement, title: string) => {
    if (!chartElement) return;
    
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
      
      // Clone the chart content
      const clone = chartElement.cloneNode(true) as HTMLElement;
      
      // Apply styles to the clone
      clone.style.width = `${chartElement.offsetWidth}px`;
      clone.style.height = 'auto';
      clone.style.position = 'relative';
      clone.style.backgroundColor = '#030712';
      clone.style.borderRadius = '12px';
      
      // Add the clone to the wrapper
      wrapper.appendChild(clone);
      tempContainer.appendChild(wrapper);
      
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
      link.download = `grafico_22bpm_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (err) {
      console.error('Erro ao exportar gráfico expandido:', err);
      alert('Ocorreu um erro ao exportar o gráfico. Por favor, tente novamente.');
    } finally {
      // Clean up
      const tempContainer = document.querySelector('div[style*="position: fixed; left: -9999px"]');
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  };

const ChartContainer: React.FC<{ 
  title: string; 
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}> = ({ title, children, className = '', action }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

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
      <div className="relative" ref={chartRef}>
        {children}
      </div>
      
      {/* Modal de gráfico expandido */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(false);
        }}>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-6xl h-[90vh] flex flex-col" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-800" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}>
              <h3 className="text-2xl font-bold text-white">{title}</h3>
              <div className="flex items-center gap-3" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    if (chartRef.current) {
                      handleExportExpandedChart(chartRef.current, title);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all text-sm flex items-center gap-2"
                  title="Exportar gráfico como PNG"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    setIsExpanded(false);
                  }}
                  className="text-gray-400 hover:text-white p-2 -mr-2"
                  aria-label="Fechar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 p-6" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}>
              <div className="h-[calc(90vh-120px)]" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}>
                <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-xl h-full" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}>
                  <div className="flex justify-between items-center mb-6" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <div className="flex items-center gap-2" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}>
                      <div onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                      }}>
                        {action}
                      </div>
                    </div>
                  </div>
                  <div className="relative h-[calc(100%-80px)]" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}>
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({ data, isAdmin, onDelete, onEdit, userGroup, userCity, userName }) => {
  const currentYear = new Date().getFullYear().toString();
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
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  // Inicializar com a cidade do usuário ou a primeira cidade por padrão
  useEffect(() => {
    if (userGroup && userCity && CITIES.includes(userCity)) {
      setSelectedCities([userCity]);
    } else if (CITIES.length > 0) {
      setSelectedCities([CITIES[0]]);
    }
  }, [userGroup, userCity]);

  // Filtros de mês para cada gráfico
  const [monthFilterProc, setMonthFilterProc] = useState<string>('all');
  const [monthFilterPrev, setMonthFilterPrev] = useState<string>('all');
  const [monthFilterRepr, setMonthFilterRepr] = useState<string>('all');

  // Filtro de dados base para a tabela e resumo dinâmico
  const filteredData = useMemo(() => {
    return data.filter(d => selectedCities.includes(d.city) && d.year.toString() === selectedYear);
  }, [data, selectedCities, selectedYear]);

  // Usamos selectedYear diretamente para todos os gráficos
  // Isso garante que todos os gráficos sigam o filtro principal

/*   // Função para exportar para PDF
  const exportToPDF = async () => {
    // Criar um novo documento PDF
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Cores
    const primaryColor = [0, 100, 0]; // Verde escuro
    const secondaryColor = [0, 0, 0]; // Preto
    
    // Adicionar cabeçalho
    const addHeader = () => {
      // Fundo do cabeçalho
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('POLÍCIA MILITAR', pageWidth / 2, 30, { align: 'center' });
      doc.setFontSize(16);
      doc.text('22º BATALHÃO DE POLÍCIA MILITAR', pageWidth / 2, 50, { align: 'center' });
      doc.setFontSize(14);
      doc.text('RELATÓRIO DE ATIVIDADES OPERACIONAIS', pageWidth / 2, 70, { align: 'center' });
      
      // Informações da cidade e período
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cidade: ${selectedCities.join(', ')}`, margin, 110); // Ajustado para baixo
      doc.text(`Período: ${selectedYear}`, pageWidth - margin, 110, { align: 'right' }); // Ajustado para baixo
      
      // Linha divisória
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(margin, 130, pageWidth - margin, 130); // Ajustado para baixo
      
      // Retorna a posição Y inicial para o conteúdo
      return 150; // Posição Y inicial para o conteúdo após o cabeçalho
    };

    // Adicionar rodapé
    const addFooter = () => {
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      doc.text(
        `Sistema de Gestão Operacional - Gerado em: ${new Date().toLocaleString('pt-BR')} - Página ${doc.getNumberOfPages()}`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
    };

    // Função para verificar se precisa de nova página
    const checkPageBreak = (requiredHeight: number, currentY: number) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      
      if (currentY + requiredHeight > pageHeight - 50) {
        doc.addPage();
        return addHeader(); // Retorna a posição Y inicial após adicionar nova página
      }
      
      return currentY + 10; // Adiciona uma margem de 10px
    };

    // Adicionar uma nova página e retornar a posição Y inicial
    const addNewPage = () => {
      doc.addPage();
      doc.setPage(doc.getNumberOfPages());
      const initialY = addHeader();
      addFooter();
      return initialY;
    };

    // Capturar elementos HTML como imagem
    const captureElement = async (selector: string) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) return null;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#030712',
        logging: false
      });
      
      return canvas;
    };

    // Iniciar o documento
    addHeader();
    addFooter();

    try {
      // Posição Y inicial para o conteúdo
      let currentY = 130;

      // Calcular totais
      const totals = {
        ba: filteredData.reduce((sum, d) => sum + (d?.ba || 0), 0),
        cop: filteredData.reduce((sum, d) => sum + (d?.cop || 0), 0),
        tc: filteredData.reduce((sum, d) => sum + (d?.tc || 0), 0),
        arrests: filteredData.reduce((sum, d) => sum + (d?.arrests || 0), 0),
        weapons: filteredData.reduce((sum, d) => sum + (d?.weapons || 0), 0),
        drugsKg: parseFloat(filteredData.reduce((sum, d) => {
          const value = typeof d?.drugsKg === 'string' ? parseFloat(d.drugsKg) || 0 : d?.drugsKg || 0;
          return sum + value;
        }, 0).toFixed(1)),
        peopleApproached: filteredData.reduce((sum, d) => sum + (d?.peopleApproached || 0), 0),
        vehiclesInspected: filteredData.reduce((sum, d) => sum + (d?.vehiclesInspected || 0), 0),
        fugitives: filteredData.reduce((sum, d) => sum + (d?.fugitives || 0), 0)
      };

      // Adicionar seção de totais
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO GERAL', margin, currentY);
      
      // Linha de totais
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 20;
      
      // Primeira linha de totais
      doc.text(`BA: ${totals.ba}`, margin, currentY);
      doc.text(`COP: ${totals.cop}`, margin + 100, currentY);
      doc.text(`TC: ${totals.tc}`, margin + 200, currentY);
      doc.text(`Prisões: ${totals.arrests}`, margin + 300, currentY);
      
      // Segunda linha de totais
      currentY += 15;
      doc.text(`Armas: ${totals.weapons}`, margin, currentY);
      doc.text(`Drogas: ${totals.drugsKg}kg`, margin + 100, currentY);
      doc.text(`Abordagens: ${totals.peopleApproached}`, margin + 200, currentY);
      doc.text(`Veículos: ${totals.vehiclesInspected}`, margin + 300, currentY);
      
      // Terceira linha de totais
      currentY += 15;
      doc.text(`Foragidos: ${totals.fugitives}`, margin, currentY);
      
      currentY += 30; // Espaço antes da tabela
      
      // Linha divisória
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY - 10, pageWidth - margin, currentY - 10);
      
      // Título da tabela
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DETALHAMENTO DE LANÇAMENTOS', margin, currentY);
      currentY += 20;

      // 2. Capturar e adicionar gráficos
      const charts = [
        { selector: '.grid-cols-1 > div:nth-child(1)', title: 'DOCUMENTOS OPERACIONAIS', height: 300 },
        { selector: '.grid-cols-1 > div:nth-child(2)', title: 'ATIVIDADES PREVENTIVAS', height: 300 },
        { selector: '.grid-cols-1 > div:nth-child(3)', title: 'REPRESSÃO E APREENSÕES', height: 350 }
      ];

      // Ajustar posição Y para os gráficos
      currentY += 40; // Aumentado o espaçamento inicial
      
      for (const chart of charts) {
        // Verificar se precisa de nova página (altura do título + altura do gráfico + margem)
        const requiredSpace = 50 + chart.height + 60; // Aumentado o espaço necessário
        
        if (currentY + requiredSpace > pageHeight - 50) {
          currentY = addNewPage();
        }

        // Adicionar título da seção com mais espaço
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(chart.title, margin, currentY);
        currentY += 30; // Aumentado o espaçamento após o título
        
        try {
          const chartElement = document.querySelector(chart.selector);
          if (chartElement) {
            const canvas = await html2canvas(chartElement as HTMLElement, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = pageWidth - 2 * margin;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Adicionar a imagem do gráfico
            doc.addImage(imgData, 'PNG', margin, currentY, pdfWidth, pdfHeight);
            currentY += pdfHeight + 20;
          }
        } catch (error) {
          console.error(`Erro ao capturar o gráfico ${chart.title}:`, error);
        }
      }

      // 3. Adicionar tabela de dados
      addNewPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHAMENTO DE LANÇAMENTOS', margin, 50);
      
      // Preparar dados da tabela
      const tableData = filteredData.map(item => [
        item.city,
        `${MONTHS[item.month]}/${item.year}`,
        item.ba,
        item.cop,
        item.tc,
        item.arrests,
        item.weapons,
        `${item.drugsKg}kg`,
        item.peopleApproached,
        item.vehiclesInspected,
        item.fugitives
      ]);

      // Adicionar cabeçalho com a cidade selecionada
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Cidade: ${selectedCities.join(', ')}`, margin, 70);
      
      // Ajustar posição Y para a tabela com mais espaçamento
      currentY = 160; // Aumentado de 100 para 120 para mais espaçamento

      // Adicionar tabela usando o autoTable importado diretamente
      autoTable(doc, {
        startY: currentY,
        head: [
          [
            { content: 'Cidade', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold' } },
            { content: 'Período', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold' } },
            { content: 'BA', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'COP', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'TC', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'Prisões', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'Armas', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'Drogas', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'Abordagens', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'Veículos', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } },
            { content: 'Foragidos', styles: { fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' } }
          ]
        ],
        body: tableData.map(row => [
          row[0], // cidade
          row[1], // período
          { content: row[2].toString(), styles: { halign: 'center' } }, // ba
          { content: row[3].toString(), styles: { halign: 'center' } }, // cop
          { content: row[4].toString(), styles: { halign: 'center' } }, // tc
          { content: row[5].toString(), styles: { halign: 'center' } }, // arrests
          { content: row[6].toString(), styles: { halign: 'center' } }, // weapons
          { content: row[7], styles: { halign: 'center' } }, // drugsKg (já inclui 'kg')
          { content: row[8].toString(), styles: { halign: 'center' } }, // peopleApproached
          { content: row[9].toString(), styles: { halign: 'center' } }, // vehiclesInspected
          { content: row[10].toString(), styles: { halign: 'center' } } // fugitives
        ]),
        margin: { top: currentY, right: margin, bottom: 30, left: margin },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: 'linebreak',
          lineColor: [200, 200, 200],
          lineWidth: 0.2,
          textColor: [0, 0, 0],
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 5,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Cor de fundo para linhas alternadas
        },
        didDrawPage: function(data: any) {
          // Adicionar cabeçalho e rodapé em cada página da tabela
          addHeader();
          addFooter();
        }
      });

      // Adicionar assinatura
      const lastPageNum = doc.getNumberOfPages();
      doc.setPage(lastPageNum);
      
      const signatureY = pageHeight - 100;
      
      // Linha de assinatura
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.7);
      doc.line(pageWidth / 2 - 100, signatureY, pageWidth / 2 + 100, signatureY);
      
      doc.setFontSize(10);
      doc.text(
        `${userName} - TEN CEL PM`,
        pageWidth / 2,
        signatureY + 15,
        { align: 'center' }
      );
      
      doc.setFont('helvetica', 'bold');
      doc.text(
        'Comandante do 22º BPM',
        pageWidth / 2,
        signatureY + 30,
        { align: 'center' }
      );

      // Salvar o PDF
      doc.save(`Relatorio_Operacional_${selectedCities.join('_')}_${selectedYear}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o relatório em PDF. Por favor, tente novamente.');
    }
  }; */

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

  // Lista de anos disponíveis para os filtros (2024 a 2030)
  const availableYears = useMemo(() => {
    const years = [];
    for (let year = 2024; year <= 2030; year++) {
      years.push({
        value: year.toString(),
        label: year.toString()
      });
    }
    return years;
  }, []);

  const availableMonths = useMemo(() => {
    // Always show all months as options
    const monthOptions = [
      { value: 'all', label: 'Todos os meses' }
    ];
    
    // Add all 12 months (0-based index)
    for (let i = 0; i < 12; i++) {
      monthOptions.push({
        value: i.toString(),
        label: MONTHS[i]
      });
    }
    
    return monthOptions;
  }, []);
  
  // Get months that actually have data for the selected year and cities
  const monthsWithData = useMemo(() => {
    const months = new Set<number>();
    const targetYear = selectedYear === 'all' ? null : parseInt(selectedYear, 10);
    
    data.forEach(d => {
      const yearMatch = targetYear === null || d.year === targetYear;
      const cityMatch = selectedCities.length === 0 || selectedCities.includes(d.city);
      
      if (yearMatch && cityMatch) {
        months.add(d.month);
      }
    });
    
    return months;
  }, [data, selectedYear, selectedCities]);

  // Função para filtrar dados por ano e mês
  const filterDataByYearMonth = (data: any[], year: string, month: string) => {
    console.log('Filtering data with:', { year, month });
    
    // Filtra por ano primeiro
    let result = [...data];
    
    if (year !== 'all') {
      const targetYear = parseInt(year, 10);
      result = result.filter(d => d.year === targetYear);
    }
    
    // Se não for 'todos os meses', filtra pelo mês específico
    if (month !== 'all') {
      const targetMonth = parseInt(month, 10);
      // Garante que estamos comparando números com números
      result = result.filter(d => d.month === targetMonth);
    }
    
    console.log('Filtered data:', result);
    return result;
  };

  // Obter dados para o gráfico baseado nos filtros
  const getChartData = (yearFilter: string | undefined, monthFilter: string | undefined) => {
    if (!yearFilter || !monthFilter) return [];
    
    console.log('Getting chart data with filters:', { yearFilter, monthFilter });
    
    // Fazer uma cópia profunda dos dados originais para evitar modificar o estado diretamente
    let filteredData = JSON.parse(JSON.stringify(data || []));
    
    // Aplicar filtros de ano e mês
    filteredData = filterDataByYearMonth(filteredData, yearFilter, monthFilter);
    
    // Se não houver dados ou cidades selecionadas, retornar array vazio
    if (filteredData.length === 0 || !selectedCities || selectedCities.length === 0) {
      console.log('No data found for the selected filters');
      return [];
    }
    
    // Agrupar por cidade
    const cityData = selectedCities.map(city => {
      if (!city) return null;
      
      // Filtra os registros da cidade
      const cityRecords = filteredData.filter(d => d && d.city === city);
      
      if (cityRecords.length === 0) {
        console.log(`No records found for city: ${city}`);
        return null;
      }
      
      console.log(`Processing ${cityRecords.length} records for city: ${city}`, cityRecords);
      
      // Obter o mês e ano para exibição
      const monthName = monthFilter !== 'all' 
        ? MONTHS[parseInt(monthFilter, 10)] 
        : 'Período';
      const yearDisplay = yearFilter !== 'all' ? yearFilter : '';
      
      // Calcular totais para a cidade com verificações de segurança
      const result = {
        name: `${city}\n${monthName} ${yearDisplay}`.trim(),
        BA: cityRecords.reduce((sum, d) => sum + (d?.ba || 0), 0),
        COP: cityRecords.reduce((sum, d) => sum + (d?.cop || 0), 0),
        TC: cityRecords.reduce((sum, d) => sum + (d?.tc || 0), 0),
        Prisões: cityRecords.reduce((sum, d) => sum + (d?.arrests || 0), 0),
        Armas: cityRecords.reduce((sum, d) => sum + (d?.weapons || 0), 0),
        Drogas: parseFloat(cityRecords.reduce((sum, d) => sum + (d?.drugsKg || 0), 0).toFixed(3)),
        Abordagens: cityRecords.reduce((sum, d) => sum + (d?.peopleApproached || 0), 0),
        'Veículos': cityRecords.reduce((sum, d) => sum + (d?.vehiclesInspected || 0), 0),
        Foragidos: cityRecords.reduce((sum, d) => sum + (d?.fugitives || 0), 0)
      };
      
      console.log(`Result for ${city}:`, result);
      return result;
    }).filter(Boolean);
    
    console.log('Final chart data:', cityData);
    return cityData;
  };

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

  // Componente personalizado para renderizar os rótulos do eixo X com quebra de linha
  const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const [city, ...period] = payload.value.split('\n');
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#9ca3af" fontSize={10}>
          {city}
        </text>
        <text x={0} y={0} dy={30} textAnchor="middle" fill="#6b7280" fontSize={9}>
          {period.join('\n')}
        </text>
      </g>
    );
  };

  // Função para renderizar os filtros de ano e mês
  const renderYearMonthFilters = (
    monthValue: string,
    onMonthChange: (value: string) => void
  ) => (
    <div className="flex gap-2">
      <select
        value={selectedYear}
        onChange={(e) => {
          e.stopPropagation();
          setSelectedYear(e.target.value);
        }}
        className="bg-gray-800 text-[10px] font-bold text-gray-300 border border-gray-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {availableYears.map((year) => (
          <option key={year.value} value={year.value}>
            {year.label}
          </option>
        ))}
      </select>
      <select
        value={monthValue}
        onChange={(e) => {
          e.stopPropagation();
          onMonthChange(e.target.value);
        }}
        className="bg-gray-800 text-[10px] font-bold text-gray-300 border border-gray-700 rounded-lg px-3 py-2 outline-none cursor-pointer"
        onClick={(e) => e.stopPropagation()}
        disabled={selectedYear === 'all'}
      >
        {availableMonths.map((month) => {
          const monthNum = parseInt(month.value, 10);
          const hasData = month.value === 'all' || monthsWithData.has(monthNum);
          
          return (
            <option 
              key={month.value} 
              value={month.value}
              disabled={!hasData}
              className={!hasData ? 'text-gray-500' : ''}
            >
              {month.label} {!hasData && month.value !== 'all' ? '(sem dados)' : ''}
            </option>
          );
        })}
      </select>
    </div>
  );

  const toggleCity = (city: string) => {
    setSelectedCities(prev => prev.includes(city) ? (prev.length > 1 ? prev.filter(c => c !== city) : prev) : [...prev, city]);
  };

  const StatMiniCard = ({ label, value, colorClass = "text-white" }: { label: string, value: string | number, colorClass?: string }) => {
    // Função para obter o ícone baseado no label
    const getIcon = (label: string) => {
      const iconClass = 'w-4 h-4 inline-block mr-1';
      
      // Ícone de documento (usado para BA, COP, TC)
      const documentIcon = (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
      
      switch(label) {
        case 'BA':
        case 'COP':
        case 'TC':
          return documentIcon;
          
        case 'Prisões':
          return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          );
          
        case 'Armas':
          return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          );
          
        case 'Drogas':
          return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          );
          
        case 'Foragidos':
          return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          );
          
        case 'Abordagens':
          return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          );
          
        case 'Veículos':
          return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 16H5a1 1 0 01-1-1v-4a1 1 0 011-1h2m11-1h-2m1 2h2a1 1 0 001-1V6a1 1 0 00-1-1h-7l-2 2H5a1 1 0 00-1 1v2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10v6a1 1 0 01-1 1H8a1 1 0 01-1-1V8zm10 2h1a1 1 0 011 1v5a1 1 0 01-1 1h-1m-9 0H6a1 1 0 01-1-1v-5a1 1 0 011-1h1m-3 4h18" />
            </svg>
          );
          
        default:
          return null;
      }
    };

    return (
      <div className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/50 text-center flex flex-col justify-center min-h-[70px] hover:border-gray-700 transition-colors">
        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center justify-center">
          {getIcon(label)}
          {label}
        </p>
        <p className={`text-base font-black ${colorClass}`}>{value}</p>
      </div>
    );
  };

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

  const years = Array.from({ length: 7 }, (_, i) => (2024 + i).toString());
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExportDashboard = async () => {
    if (!dashboardRef.current) return;
    
    // Mostrar um indicador de carregamento
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    loadingIndicator.style.padding = '20px 40px';
    loadingIndicator.style.borderRadius = '8px';
    loadingIndicator.style.zIndex = '99999';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.fontWeight = 'bold';
    loadingIndicator.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
    loadingIndicator.style.border = '1px solid rgba(255,255,255,0.1)';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.innerHTML = 'Preparando exportação...<br><small>Isso pode levar alguns segundos</small>';
    document.body.appendChild(loadingIndicator);
    
    try {
      // Forçar a renderização de elementos que podem estar ocultos
      const allMenus = document.querySelectorAll(
        '.MuiMenu-paper, [role="menu"], [role="tooltip"], ' +
        '.MuiPopover-root, .MuiModal-root, .MuiPopover-paper, ' +
        '.MuiAutocomplete-paper, .MuiAutocomplete-listbox, [role="listbox"]'
      );
      const originalStyles: {[key: string]: any} = {};
      
      // Função para forçar a exibição de tooltips e popovers
      const forceTooltipsAndPopovers = () => {
        // Forçar exibição de tooltips
        const tooltips = document.querySelectorAll('[role="tooltip"]');
        tooltips.forEach((tooltip, i) => {
          const el = tooltip as HTMLElement;
          originalStyles[`tooltip-${i}-style`] = el.getAttribute('style') || '';
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          el.style.setProperty('z-index', '9999', 'important');
        });
        
        // Forçar exibição de popovers
        const popovers = document.querySelectorAll('.MuiPopover-root, .MuiPopover-paper');
        popovers.forEach((popover, i) => {
          const el = popover as HTMLElement;
          originalStyles[`popover-${i}-style`] = el.getAttribute('style') || '';
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          el.style.setProperty('display', 'block', 'important');
          el.style.setProperty('position', 'relative', 'important');
          el.style.setProperty('transform', 'none', 'important');
          el.style.setProperty('z-index', '9998', 'important');
        });
      };
      
      // Função para salvar e modificar estilos
      const saveAndModifyStyles = (element: HTMLElement, index: number) => {
        // Salvar estilos originais
        const styles = window.getComputedStyle(element);
        originalStyles[`${index}-display`] = styles.display;
        originalStyles[`${index}-opacity`] = styles.opacity;
        originalStyles[`${index}-transform`] = styles.transform;
        originalStyles[`${index}-visibility`] = styles.visibility;
        originalStyles[`${index}-zIndex`] = styles.zIndex;
        originalStyles[`${index}-position`] = styles.position;
        originalStyles[`${index}-pointerEvents`] = styles.pointerEvents;
        
        // Aplicar estilos para visibilidade total
        element.style.setProperty('display', 'block', 'important');
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('visibility', 'visible', 'important');
        element.style.setProperty('transform', 'none', 'important');
        element.style.setProperty('z-index', '9998', 'important');
        element.style.setProperty('position', 'relative', 'important');
        element.style.setProperty('pointer-events', 'none', 'important');
        
        // Remover classes que podem afetar a visibilidade
        element.classList.remove('MuiMenu-hidden', 'MuiModal-hidden', 'MuiPopover-hidden');
      };
      
      // Forçar exibição de tooltips e popovers primeiro
      forceTooltipsAndPopovers();
      
      // Aplicar a todos os menus e modais
      allMenus.forEach((menu, index) => {
        const element = menu as HTMLElement;
        // Pular elementos que já foram processados
        if (element.getAttribute('data-export-processed') === 'true') return;
        
        saveAndModifyStyles(element, index);
        element.setAttribute('data-export-processed', 'true');
        
        // Forçar abertura de menus suspensos
        if (element.classList.contains('MuiMenu-paper') || element.getAttribute('role') === 'menu') {
          element.style.setProperty('display', 'block', 'important');
          element.style.setProperty('opacity', '1', 'important');
          element.style.setProperty('visibility', 'visible', 'important');
          element.style.setProperty('position', 'relative', 'important');
          element.style.setProperty('transform', 'none', 'important');
          element.style.setProperty('z-index', '9997', 'important');
          element.style.setProperty('pointer-events', 'none', 'important');
          element.style.setProperty('width', 'auto', 'important');
          element.style.setProperty('height', 'auto', 'important');
          element.style.setProperty('max-height', 'none', 'important');
          element.style.setProperty('overflow', 'visible', 'important');
        }
        
        // Tratar também os elementos filhos que podem estar afetando a visibilidade
        const children = element.querySelectorAll('*');
        children.forEach((child, childIndex) => {
          const childEl = child as HTMLElement;
          if (childEl.getAttribute('data-export-processed') === 'true') return;
          
          const styles = window.getComputedStyle(childEl);
          if (styles.opacity === '0' || styles.visibility === 'hidden' || 
              childEl.classList.contains('MuiMenuItem-root')) {
            saveAndModifyStyles(childEl, index * 1000 + childIndex);
            childEl.setAttribute('data-export-processed', 'true');
            
            // Garantir que itens de menu sejam visíveis
            if (childEl.classList.contains('MuiMenuItem-root')) {
              childEl.style.setProperty('opacity', '1', 'important');
              childEl.style.setProperty('visibility', 'visible', 'important');
              childEl.style.setProperty('display', 'flex', 'important');
              childEl.style.setProperty('position', 'relative', 'important');
            }
          }
        });
      });
      
      // Forçar repintura para garantir que os estilos sejam aplicados
      document.body.offsetHeight;
      
      // Dar tempo para os estilos serem aplicados
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Esperar um frame para garantir que os estilos sejam aplicados
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Forçar nova verificação de elementos que possam ter sido adicionados dinamicamente
      const dynamicElements = document.querySelectorAll('.MuiMenu-paper, [role="menu"], [role="tooltip"], .MuiPopover-root, .MuiModal-root, .MuiPopover-paper, .MuiAutocomplete-paper, .MuiAutocomplete-listbox, [role="listbox"]');
      dynamicElements.forEach((el, i) => {
        if (!el.getAttribute('data-export-processed')) {
          const element = el as HTMLElement;
          saveAndModifyStyles(element, 10000 + i); // Usar um índice alto para não conflitar
          element.setAttribute('data-export-processed', 'true');
        }
      });
      
      // Criar um clone do nó raiz
      const clone = dashboardRef.current.cloneNode(true) as HTMLElement;
      
      // Obter o mês e ano atuais para adicionar aos gráficos
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const currentDate = new Date();
      const currentMonth = monthNames[currentDate.getMonth()];
      const currentYear = currentDate.getFullYear();
      
      // Adicionar informações de data aos títulos dos gráficos
      const chartContainers = clone.querySelectorAll('.chart-container');
      chartContainers.forEach(container => {
        const titleElement = container.querySelector('h3, h4, .chart-title');
        if (titleElement) {
          const isMonthly = container.querySelector('.month-selector') !== null;
          const dateInfo = isMonthly 
            ? `${currentMonth} de ${selectedYear}`
            : `Ano: ${selectedYear}`;
          
          if (!titleElement.textContent?.includes(selectedYear) && !titleElement.textContent?.includes(currentMonth)) {
            const dateSpan = document.createElement('span');
            dateSpan.textContent = ` (${dateInfo})`;
            dateSpan.style.color = '#9ca3af';
            dateSpan.style.fontWeight = 'normal';
            titleElement.appendChild(dateSpan);
          }
        }
      });
      
      // Remover botões de exportação e outros elementos indesejados
      const elementsToRemove = clone.querySelectorAll(
        '[data-export-ignore], button[title*="Exportar"], .MuiBackdrop-root, .export-button'
      );
      elementsToRemove.forEach(el => el.remove());
      
      // Criar container para a exportação
      const exportContainer = document.createElement('div');
      exportContainer.style.backgroundColor = '#030712';
      exportContainer.style.padding = '24px';
      exportContainer.style.borderRadius = '16px';
      exportContainer.style.width = 'fit-content';
      exportContainer.style.margin = '0 auto';
      
      // Adicionar cabeçalho com título e data
      const header = document.createElement('div');
      header.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #10b981; margin: 0 0 8px 0;">
            Estatísticas de Produtividade - 22º BPM
          </h1>
          <p style="color: #9ca3af; margin: 0 0 16px 0;">
            Período: ${selectedYear} | Gerado em ${new Date().toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      `;
      
      exportContainer.appendChild(header);
      exportContainer.appendChild(clone);
      
      // Adicionar temporariamente ao DOM para renderização
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.zIndex = '9998';
      tempContainer.appendChild(exportContainer);
      document.body.appendChild(tempContainer);
      
      // Configurações avançadas para o html2canvas
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        backgroundColor: '#030712',
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        onclone: (clonedDoc) => {
          // Garantir que os estilos sejam aplicados corretamente no clone
          const style = clonedDoc.createElement('style');
          style.textContent = `
            .MuiMenu-paper, [role="menu"], [role="tooltip"], .MuiPopover-root, .MuiModal-root {
              opacity: 1 !important;
              visibility: visible !important;
              position: relative !important;
              transform: none !important;
              max-height: none !important;
              max-width: none !important;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            }
            .MuiBackdrop-root {
              display: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      // Criar link de download
      const link = document.createElement('a');
      link.download = `estatisticas-22bpm-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Função para restaurar estilos originais
      const restoreOriginalStyles = () => {
        // Restaurar tooltips
        const tooltips = document.querySelectorAll('[role="tooltip"]');
        tooltips.forEach((tooltip, i) => {
          const el = tooltip as HTMLElement;
          const originalStyle = originalStyles[`tooltip-${i}-style`];
          if (originalStyle) {
            el.setAttribute('style', originalStyle);
          } else {
            el.removeAttribute('style');
          }
        });
        
        // Restaurar popovers
        const popovers = document.querySelectorAll('.MuiPopover-root, .MuiPopover-paper');
        popovers.forEach((popover, i) => {
          const el = popover as HTMLElement;
          const originalStyle = originalStyles[`popover-${i}-style`];
          if (originalStyle) {
            el.setAttribute('style', originalStyle);
          } else {
            el.removeAttribute('style');
          }
        });
        
        // Restaurar menus e modais
        allMenus.forEach((menu, index) => {
          const element = menu as HTMLElement;
          
          // Remover atributos de processamento
          element.removeAttribute('data-export-processed');
          
          // Restaurar estilos originais
          if (originalStyles[`${index}-display`] !== undefined) {
            element.style.display = originalStyles[`${index}-display`] || '';
            element.style.opacity = originalStyles[`${index}-opacity`] || '';
            element.style.visibility = originalStyles[`${index}-visibility`] || '';
            element.style.transform = originalStyles[`${index}-transform`] || '';
            element.style.zIndex = originalStyles[`${index}-zIndex`] || '';
            element.style.position = originalStyles[`${index}-position`] || '';
            element.style.pointerEvents = originalStyles[`${index}-pointerEvents`] || '';
            
            // Se o elemento tinha um estilo inline, restaurar, senão remover
            if (!originalStyles[`${index}-hasInlineStyle`]) {
              element.removeAttribute('style');
            }
          }
          
          // Restaurar classes se necessário
          if (originalStyles[`${index}-opacity`] === '0') {
            element.classList.add('MuiMenu-hidden', 'MuiModal-hidden', 'MuiPopover-hidden');
          }
          
          // Restaurar estilos dos filhos
          const children = element.querySelectorAll('*');
          children.forEach((child, childIndex) => {
            const childEl = child as HTMLElement;
            const childKey = index * 1000 + childIndex;
            
            childEl.removeAttribute('data-export-processed');
            
            if (originalStyles[`${childKey}-display`] !== undefined) {
              childEl.style.display = originalStyles[`${childKey}-display`] || '';
              childEl.style.opacity = originalStyles[`${childKey}-opacity`] || '';
              childEl.style.visibility = originalStyles[`${childKey}-visibility`] || '';
              
              if (!originalStyles[`${childKey}-hasInlineStyle`]) {
                childEl.removeAttribute('style');
              }
            }
          });
        });
        
        // Forçar nova verificação de elementos dinâmicos
        const dynamicElements = document.querySelectorAll('.MuiMenu-paper, [role="menu"], [role="tooltip"], .MuiPopover-root, .MuiModal-root, .MuiPopover-paper, .MuiAutocomplete-paper, .MuiAutocomplete-listbox, [role="listbox"]');
        dynamicElements.forEach((el) => {
          el.removeAttribute('data-export-processed');
        });
      };
      
      // Configurar evento para restaurar estilos após o download
      link.onclick = () => {
        // Pequeno atraso para garantir que o download foi iniciado
        setTimeout(() => {
          restoreOriginalStyles();
          document.body.removeChild(tempContainer);
          document.body.removeChild(loadingIndicator);
        }, 100);
        
        // Permitir que o navegador continue com o download
        return true;
      };
      
      // Disparar o download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Garantir a limpeza mesmo se algo der errado
      setTimeout(() => {
        try {
          restoreOriginalStyles();
          if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
          }
          if (document.body.contains(loadingIndicator)) {
            document.body.removeChild(loadingIndicator);
          }
        } catch (e) {
          console.error('Erro ao limpar elementos temporários:', e);
        }
      }, 5000); // Timeout de segurança de 5 segundos
      
    } catch (error) {
      console.error('Erro ao exportar o dashboard:', error);
      alert('Ocorreu um erro ao exportar o dashboard. Por favor, tente novamente.');
      document.body.removeChild(loadingIndicator);
    }
  };

  // Log para depuração
  console.log('Valores de permissão:', { userGroup, isAdmin });

  return (
    <div className="space-y-8 animate-fadeIn pb-12" ref={dashboardRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 uppercase tracking-tight">Estatísticas de Produtividade</h2>
          <p className="text-gray-400 text-sm">Visão geral da performance operacional do Batalhão.</p>
        </div>
        <div className="flex flex-row-reverse sm:flex-row gap-3">
          <button 
            onClick={handleExportDashboard}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg"
            title="Exportar Dashboard como PNG"
            data-export-ignore
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
          <div className="flex items-center bg-gray-900 p-2 rounded-xl border border-gray-800 shadow-lg">
            <span className="text-xs font-bold text-gray-500 uppercase ml-2">Filtrar Resumo (Ano):</span>
            <select 
              value={selectedYear} 
              onChange={e => {
                e.stopPropagation();
                setSelectedYear(e.target.value);
              }} 
              className="bg-gray-800 text-white rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-gray-700 transition-colors font-bold text-sm" 
              onClick={e => e.stopPropagation()}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
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
          <StatMiniCard 
            label="Drogas" 
            value={`${battalionTotals.drugs === 0 ? '0' : (battalionTotals.drugs < 1 ? battalionTotals.drugs.toFixed(3) : battalionTotals.drugs.toFixed(1))}kg`} 
            colorClass="text-emerald-500" 
          />
          <StatMiniCard label="Foragidos" value={battalionTotals.fugitives} colorClass="text-amber-400" />
          <StatMiniCard label="Abordagens" value={battalionTotals.people} colorClass="text-blue-400" />
          <StatMiniCard label="Veículos" value={battalionTotals.vehicles} colorClass="text-indigo-400" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Municípios para Comparação nos Gráficos</label>
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
            {getUserCities.map(c => (
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
            <StatMiniCard 
              label="Drogas" 
              value={`${selectedTotals.drugs === 0 ? '0' : (selectedTotals.drugs < 1 ? selectedTotals.drugs.toFixed(3) : selectedTotals.drugs.toFixed(1))}kg`} 
              colorClass="text-emerald-500" 
            />
            <StatMiniCard label="Foragidos" value={selectedTotals.fugitives} colorClass="text-amber-400" />
            <StatMiniCard label="Abordagens" value={selectedTotals.people} colorClass="text-blue-400" />
            <StatMiniCard label="Veículos" value={selectedTotals.vehicles} colorClass="text-indigo-400" />
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico 1: Procedimentos Administrativos */}
          <ChartContainer 
            title="Documentos Operacionais"
            action={
              renderYearMonthFilters(
                monthFilterProc,
                setMonthFilterProc
              )
            }
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData(selectedYear, monthFilterProc)} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis 
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={60}
                    tick={<CustomizedAxisTick />}
                  />
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
          </ChartContainer>

          {/* Gráfico 2: Atividade Preventiva */}
          <ChartContainer 
            title="Atividades Preventivas"
            action={
              renderYearMonthFilters(
                monthFilterPrev,
                setMonthFilterPrev
              )
            }
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData(selectedYear, monthFilterPrev)} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis 
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={60}
                    tick={<CustomizedAxisTick />}
                  />
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
          </ChartContainer>

          {/* Gráfico 3: Repressão e Apreensões */}
          <ChartContainer 
            title="Repressão e Apreensões"
            action={
              renderYearMonthFilters(
                monthFilterRepr,
                setMonthFilterRepr
              )
            }
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData(selectedYear, monthFilterRepr)} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis 
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={60}
                    tick={<CustomizedAxisTick />}
                  />
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
          </ChartContainer>

          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-xl no-export flex flex-col">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Detalhamento por Lançamento Individual</h3>
              <button 
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label={isDetailsExpanded ? "Recolher detalhamento" : "Expandir detalhamento"}
                title={isDetailsExpanded ? "Recolher" : "Expandir"}
              >
                {isDetailsExpanded ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
            <div className={`overflow-x-auto flex-1 transition-all duration-300 ${isDetailsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
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
                                    <button 
                                      onClick={() => {
                                        if (row.id && onDelete) {
                                          onDelete(row.id);
                                        }
                                      }} 
                                      className="text-gray-500 hover:text-red-500 transition-colors"
                                    >
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
