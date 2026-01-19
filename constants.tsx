
import React from 'react';

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
  danger: "#ef4444", 
  info: "#8b5cf6", 
  background: "#030712",
  card: "#111827"
};

export const ShieldIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <img 
    src="/brasao.png" 
    alt="Brasão 22º BPM" 
    className={`${className} object-contain`}
    onError={(e) => {
      // Fallback em caso de erro no carregamento
      const target = e.target as HTMLImageElement;
      target.onerror = null; // Previne loop de erro
      target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTEyIDFMMyA1djZjMCA1LjU1IDMuODQgMTAuNzQgOSAxMiA1LjE2LTEuMjYgOS02LjQ1IDktMTJWNWwtOS00em0wIDMuOThoNS41OEwxMiAxNS4xOCA2LjQyIDQuOThIMTJ2LS4wMnoiLz48L3N2Zz4=';
    }}
  />
);
