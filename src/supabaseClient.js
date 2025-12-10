
import { createClient } from '@supabase/supabase-js';

// Estas variables de entorno deben configurarse en un archivo .env
// Ejemplo:
// VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
// VITE_SUPABASE_ANON_KEY=tu-clave-anonima

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si no hay claves, el cliente no funcionará, pero no romperá la app visualmente por ahora
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
