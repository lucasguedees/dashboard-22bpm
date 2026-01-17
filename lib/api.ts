import { supabase } from './supabase';
import type { TrafficInfraction, ProductivityRecord, User } from '../types';

export const supabaseReady = !!supabase;

// -------- App Users (profiles) --------
export async function getOrCreateAppUser(authUserId: string, usernameFallback?: string): Promise<User> {
  if (!supabase) throw new Error('Supabase not configured');

  // Try to find existing profile
  const { data: found, error: findErr } = await supabase
    .from('app_users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  if (!findErr && found) {
    return {
      id: found.id,
      username: found.username,
      role: found.role,
      rank: found.rank,
    } as User;
  }

  // Create minimal profile if not exists
  const username = usernameFallback || `user_${authUserId.slice(0, 8)}`;
  const { data: created, error: createErr } = await supabase
    .from('app_users')
    .insert({
      auth_user_id: authUserId,
      username,
      role: 'USER',
      rank: 'Sd',
    })
    .select('*')
    .single();
  if (createErr) throw createErr;
  return {
    id: created!.id,
    username: created!.username,
    role: created!.role,
    rank: created!.rank,
  } as User;
}

// -------- Traffic Infractions --------
export async function fetchInfractions(): Promise<TrafficInfraction[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('traffic_infractions')
    .select('*')
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('city', { ascending: true });
  if (error) throw error;
  // Cast to app types (timestamp exists as created_at; keep original timestamp if present)
  return (data || []).map((row: any) => ({
    id: row.id,
    city: row.city,
    month: row.month,
    year: row.year,
    cars: row.cars,
    motorcycles: row.motorcycles,
    trucks: row.trucks,
    others: row.others,
    total: row.total,
    timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }));
}

export async function insertInfraction(payload: Omit<TrafficInfraction, 'id' | 'timestamp' | 'total'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('traffic_infractions')
    .insert({
      city: payload.city,
      month: payload.month,
      year: payload.year,
      cars: payload.cars,
      motorcycles: payload.motorcycles,
      trucks: payload.trucks,
      others: payload.others,
      created_by: null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateInfraction(id: string, payload: Omit<TrafficInfraction, 'id' | 'timestamp' | 'total'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('traffic_infractions')
    .update({
      city: payload.city,
      month: payload.month,
      year: payload.year,
      cars: payload.cars,
      motorcycles: payload.motorcycles,
      trucks: payload.trucks,
      others: payload.others,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInfractionById(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('traffic_infractions').delete().eq('id', id);
  if (error) throw error;
}

// -------- Productivity Records --------
export async function fetchProductivity(): Promise<ProductivityRecord[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('productivity_records')
    .select('*')
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('city', { ascending: true });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    city: row.city,
    month: row.month,
    year: row.year,
    ba: row.ba,
    cop: row.cop,
    tc: row.tc,
    fugitives: row.fugitives,
    vehiclesInspected: row.vehicles_inspected,
    peopleApproached: row.people_approached,
    drugsKg: Number(row.drugs_kg ?? 0),
    weapons: row.weapons,
    arrests: row.arrests,
    timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }));
}

export async function insertProductivity(payload: Omit<ProductivityRecord, 'id' | 'timestamp'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('productivity_records')
    .insert({
      city: payload.city,
      month: payload.month,
      year: payload.year,
      ba: payload.ba,
      cop: payload.cop,
      tc: payload.tc,
      fugitives: payload.fugitives,
      vehicles_inspected: payload.vehiclesInspected,
      people_approached: payload.peopleApproached,
      drugs_kg: payload.drugsKg,
      weapons: payload.weapons,
      arrests: payload.arrests,
      created_by: null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateProductivity(id: string, payload: Omit<ProductivityRecord, 'id' | 'timestamp'>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('productivity_records')
    .update({
      city: payload.city,
      month: payload.month,
      year: payload.year,
      ba: payload.ba,
      cop: payload.cop,
      tc: payload.tc,
      fugitives: payload.fugitives,
      vehicles_inspected: payload.vehiclesInspected,
      people_approached: payload.peopleApproached,
      drugs_kg: payload.drugsKg,
      weapons: payload.weapons,
      arrests: payload.arrests,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductivityById(id: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('productivity_records').delete().eq('id', id);
  if (error) throw error;
}
