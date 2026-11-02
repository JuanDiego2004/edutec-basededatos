import { NextResponse } from 'next/server';
import { obtenerClienteMongoPrimario } from '@/servicios/base-datos/conexionMongo';

export async function GET() {
    const database = 'MongoDB';
    const start = Date.now();
    try {
        await (await obtenerClienteMongoPrimario()).admin().ping();
        return NextResponse.json({
            ok: true,
            database,
            status: 'online',
            latency: Date.now() - start,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error de conexión';
        console.error(`[DB Health] ${database} error:`, message);
        return NextResponse.json({
            ok: false,
            database,
            error: message,
            status: 'offline',
            timestamp: new Date().toISOString(),
        }, { status: 200 });
    }
}
