import { NextResponse } from 'next/server';
import { verificarSaludPostgresPrimario } from '@/servicios/base-datos/conexionPostgres';
import { verificarSaludMongoPrimario } from '@/servicios/base-datos/conexionMongo';

export async function GET() {
    const [supabase, mongodb] = await Promise.all([
        verificarSaludPostgresPrimario(),
        verificarSaludMongoPrimario(),
    ]);
    const ok = supabase && mongodb;
    return NextResponse.json({
        estado: ok ? 'OK' : 'ERROR',
        timestamp: new Date().toISOString(),
        basesDatos: {
            supabase: { estado: supabase ? 'ACTIVA' : 'CAIDA' },
            mongodb: { estado: mongodb ? 'ACTIVA' : 'CAIDA' },
        },
    }, { status: ok ? 200 : 503 });
}
