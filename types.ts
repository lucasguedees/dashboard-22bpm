
export type UserRole = 'ADMIN' | 'COMANDO' | 'USER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  rank: string; // Posto/Graduação
  password?: string; // Armazenado para autenticação local
}

export interface TrafficInfraction {
  id: string;
  city: string;
  month: number; // 0-11
  year: number;
  cars: number;
  motorcycles: number;
  trucks: number;
  others: number;
  total: number;
  timestamp: number;
}

export type ViewType = 'AIT_FORM' | 'AIT_DASHBOARD' | 'PRODUCTIVITY_FORM' | 'PRODUCTIVITY_DASHBOARD' | 'HOME' | 'DATA_MANAGEMENT' | 'USER_MANAGEMENT';

export interface ProductivityRecord {
  id: string;
  city: string;
  month: number;
  year: number;
  ba: number;
  cop: number;
  tc: number;
  fugitives: number;
  vehiclesInspected: number;
  peopleApproached: number;
  drugsKg: number;
  weapons: number;
  arrests: number;
  timestamp: number;
}
