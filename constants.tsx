
import React from 'react';

// Importar a imagem diretamente
import brasaoImg from '../public/brasao.png';

export const CITIES = [
  "Arroio do Meio", "Canudos do Vale", "Capitão", "Coqueiro Baixo", 
  "Cruzeiro do Sul", "Doutor Ricardo", "Encantado", "Forquetinha", 
  "Lajeado", "Marques de Souza", "Muçum", "Nova Bréscia", 
  "Pouso Novo", "Progresso", "Relvado", "Roca Sales", 
  "Santa Clara do Sul", "Sério", "Travesseiro", "Vespasiano Correa"
].sort();

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const COLORS = {
  primary: "#3b82f6", 
  secondary: "#10b981", 
  accent: "#f59e0b",
  background: "#030712",
  card: "#111827"
};

export const ShieldIcon = ({ className = "w-40 h-auto" }: { className?: string }) => {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img 
        src="/brasao.png" 
        alt="Brasão 22º BPM" 
        className="max-w-full max-h-full object-contain"
        onError={(e) => {
        console.error('Erro ao carregar a imagem do brasão');
        // Fallback para um ícone SVG se a imagem não carregar
        const target = e.target as HTMLImageElement;
        target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTEyIDFMMyA1djZjMCA1LjU1IDMuODQgMTAuNzQgOSAxMiA1LjE2LTEuMjYgOS02LjQ1IDktMTJWNWwtOS00em0wIDMuOWh2MS4wOEwxNS44MiAxOUgxM3YyaC0ydi0ySDguMTdMMTIgNi43N1Y0Ljl6Ii8+PC9zdmc+';
        }}
      />
    </div>
  );
};
