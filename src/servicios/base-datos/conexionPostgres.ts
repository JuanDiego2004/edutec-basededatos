import { createClient, SupabaseClient } from '@supabase/supabase-js';

let clienteSupabasePrimario: SupabaseClient | null = null;

export function obtenerClienteSupabasePrimario(): SupabaseClient {
    if (!clienteSupabasePrimario) {
        const url = process.env.SUPABASE_PRIMARIA_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_PRIMARIA_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            throw new Error('Variables de Supabase no configuradas en .env');
        }

        clienteSupabasePrimario = createClient(url, key);
    }

    return clienteSupabasePrimario;
}

export async function obtenerPoolPostgresPrimario(): Promise<SupabaseClient> {
    return obtenerClienteSupabasePrimario();
}

export async function verificarSaludPostgresPrimario(): Promise<boolean> {
    try {
        const { error } = await obtenerClienteSupabasePrimario().from('profesores').select('id').limit(1);
        return !error || !error.message.includes('connect');
    } catch (error) {
        console.error('Error verificando salud Supabase:', error);
        return false;
    }
}

export async function cerrarConexionesPostgres(): Promise<void> {
    clienteSupabasePrimario = null;
}
