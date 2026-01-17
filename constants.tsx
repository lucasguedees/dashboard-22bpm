
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
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className} filter drop-shadow-lg`}
  >
    <path 
      d="M12 2L3 7V11C3 15.11 6.84 19.43 12 22C17.16 19.43 21 15.11 21 11V7L12 2Z" 
      fill="url(#shield_gradient)" 
      stroke="#60a5fa" 
      strokeWidth="1.5"
    />
    <path 
      d="M12 5V19M12 5L9 8M12 5L15 8" 
      stroke="white" 
      strokeWidth="1" 
      strokeLinecap="round" 
      opacity="0.5"
    />
    <defs>
      <linearGradient id="shield_gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e40af" />
        <stop offset="1" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>
  </svg>
);
