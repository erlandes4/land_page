import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Atenção: As chaves do Supabase não foram encontradas nas variáveis de ambiente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);