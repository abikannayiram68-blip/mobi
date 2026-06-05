import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://azwtmgexcksfhhcitemr.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4xjvhqKZ2C3ehQ5b4Cj7XQ_peIuvGb-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
