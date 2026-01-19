
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
    src="/image/brasao.png" 
    alt="Brasão 22º BPM" 
    className={`${className} object-contain`}
  />
);
