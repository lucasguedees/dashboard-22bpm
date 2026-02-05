
export type UserRole = 'ADMIN' | 'COMANDO' | 'USER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  rank: string; // Posto/Graduação
  city?: string; // Cidade de atuação
  group?: string; // Grupo (1ª CIA, 2ª CIA, 3ª CIA)
  password?: string; // Armazenado para autenticação local
  created_at?: string;
  updated_at?: string;
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

export type ViewType = 'AIT_FORM' | 'AIT_DASHBOARD' | 'PRODUCTIVITY_FORM' | 'PRODUCTIVITY_DASHBOARD' | 'HOME' | 'DATA_MANAGEMENT' | 'USER_MANAGEMENT' | 'USER_PROFILE';

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
