export type UserRole = 'mother' | 'doula';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
}

export interface Pregnancy {
  id: string;
  mother_id: string;
  doula_id?: string;
  start_date: string;
  estimated_due_date: string;
  hospital_preference?: string;
  birth_plan_notes?: any;
  is_active: boolean;
  pregnancy_number: number;
}

export interface Contraction {
  id: string;
  pregnancy_id: string;
  start_time: string;
  end_time?: string;
  intensity?: number;
}