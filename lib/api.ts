import { supabase } from '../lib/supabase';
import type { TrafficInfraction, ProductivityRecord, User } from '../types';

export const supabaseReady = !!supabase;

export interface AppUserRow {
  id: string;
  auth_user_id: string;
  username: string;
  email?: string | null;
  role: User['role'];
  rank: string;
  city?: string | null;
  group?: string | null;
}

// -------- App Users (profiles) --------
export const getAppUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, auth_user_id, username, email, role, rank, city, group')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) return null;

  return data;
};


export async function createUserProfile(
  authUserId: string,
  username: string,
  email?: string,
  rank: string = 'Sd',
  role: User['role'] = 'USER',
  city: string = '',
  group: string = ''
): Promise<User> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: created, error: createErr } = await supabase
    .from('app_users')
    .insert({
      auth_user_id: authUserId,
      username,
      email,
      role,
      rank,
      city,
      group
    })
    .select('id, username, email, role, rank, city, group')
    .single();

  if (createErr) throw createErr;

  return {
    id: created!.id,
    username: created!.username,
    email: created!.email || '',
    role: created!.role,
    rank: created!.rank || '',
    city: created!.city || '',
    group: created!.group || ''
  } as User;
}

async function getCurrentProfileId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user?.id) return null;
  const authUserId = authData.user.id;
  // Try existing app_users row
  const { data: prof, error: profErr } = await supabase
    .from('app_users')
    .select('id, username')
    .eq('auth_user_id', authUserId)
    .single();
  if (!profErr && prof?.id) return prof.id as string;
  // Create minimal profile if missing
  const fallback = authData.user.email?.split('@')[0] || `user_${authUserId.slice(0, 8)}`;
  const created = await createAppUser({
    username: fallback,
    email: authData.user.email || null,
    role: 'USER',
    rank: 'Sd',
    auth_user_id: authUserId,
    city: '',  // Default empty string for city
    group: ''  // Default empty string for group
  });
  return created.id;
}

// -------- App Users CRUD (for UserManagement) --------

// Função para atualizar o e-mail de um usuário


export async function listAppUsers(): Promise<AppUserRow[]> {
  if (!supabase) throw new Error('Supabase not configured');

  console.log('=== INÍCIO listAppUsers ===');
  console.log('Configuração do Supabase:', {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '*** (chave definida)' : 'não definida'
  });

  try {
    console.log('Executando consulta ao banco de dados...');
    const { data, error, status } = await supabase
      .from('app_users')
      .select('id, auth_user_id, username, email, role, rank, created_at, city, group')
      .order('username', { ascending: true });

    console.log('Status da resposta:', status);

    if (error) {
      console.error('Erro ao buscar usuários:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('Total de usuários encontrados:', data?.length || 0);
    console.log('Dados completos dos usuários:', JSON.stringify(data, null, 2));

    // Verificar se há usuários sem e-mail
    if (data && data.length > 0) {
      const usersWithoutEmail = data.filter(u => !u.email);
      if (usersWithoutEmail.length > 0) {
        console.warn(`${usersWithoutEmail.length} usuário(s) sem e-mail:`,
          usersWithoutEmail.map(u => `${u.username} (ID: ${u.id})`).join(', '));
      }
    }

    return (data || []) as AppUserRow[];
  } catch (error) {
    console.error('Erro em listAppUsers:', error);
    throw error;
  }
}

export async function createAppUser(row: {
  username: string;
  email?: string | null;
  role: User['role'];
  rank: string;
  auth_user_id?: string | null;
  city?: string | null;
  group?: string | null;
}): Promise<AppUserRow> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('app_users')
    .insert({
      username: row.username,
      email: row.email ?? null,
      role: row.role,
      rank: row.rank,
      auth_user_id: row.auth_user_id ?? null,
      city: row.city ?? null,
      group: row.group ?? null
    })
    .select('id, username, email, role, rank')
    .single();
  if (error) throw error;
  return data as AppUserRow;
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const { error } = await supabase.functions.invoke('reset-password', {
    body: {
      userId,
      newPassword
    }
  });

  if (error) {
    console.error(error);
    throw error;
  }
}





export async function deleteAppUser(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke("delete-user", {
    body: { userId: id }
  });
  if (error) throw error;
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
  const profileId = await getCurrentProfileId();
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
      created_by: profileId,
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
  const { error } = await supabase.from('traffic_infractions').delete().eq('auth_user_id', id);
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
  const profileId = await getCurrentProfileId();
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
      created_by: profileId,
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
    .eq('auth_user_id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductivityById(id: string) {
  if (!supabase) throw new Error('Supabase client not available');
  await supabase.from('productivity_records').delete().eq('auth_user_id', id);
}

import { CITIES } from '../constants';

export async function getActiveCities(): Promise<string[]> {
  // Retorna todas as cidades definidas em constants.tsx
  return [...CITIES].sort();
}

export async function getOrCreateAppUser(authUserId: string, username: string, email?: string, rank: string = 'Sd', role: User['role'] = 'USER'): Promise<User> {
  console.log('=== INICIANDO getOrCreateAppUser ===');
  console.log('Auth User ID:', authUserId, 'Username:', username, 'Email:', email, 'Rank:', rank, 'Role:', role);

  // Primeiro tenta buscar o usuário existente
  const existingUser = await getAppUser(authUserId);
  if (existingUser) {
    console.log('Usuário encontrado, retornando dados existentes');
    return existingUser;
  }

  console.log('Usuário não encontrado, criando novo perfil');
  // Se não existir, cria um novo perfil
  return createUserProfile(authUserId, username, email, rank, role);
}
export async function updateAppUserAdmin(userId: string, updates: any) {
  const res = await fetch(
    "https://jqtwqttcuaegutdbavzz.supabase.co/functions/v1/update-user",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        userId,
        updates,
      }),
    }
  );

  const json = await res.json();

  if (!res.ok) throw new Error(json.error);

  return json;
}
export async function updateAppUser(
  userId: string,
  updates: any,
) {
  return updateAppUserAdmin(userId, updates);
}

export async function updateUserEmail(
  userId: string,
  email: string
) {
  return updateAppUserAdmin(userId, { email });
}