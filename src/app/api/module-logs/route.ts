import { NextResponse } from 'next/server';
import { obtenerClienteMongoPrimario } from '@/servicios/base-datos/conexionMongo';

const COLLECTION_NAME = 'logs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const camposRequeridos = ['idUsuario', 'correoUsuario', 'rolUsuario', 'tipoActividad', 'modulo'];
        const camposFaltantes = camposRequeridos.filter((campo) => !body[campo]);
        if (camposFaltantes.length) {
            return NextResponse.json({ ok: false, error: 'Faltan campos requeridos', camposFaltantes }, { status: 400 });
        }

        const documentoLog = {
            usuario: { id: body.idUsuario, correo: body.correoUsuario, rol: body.rolUsuario },
            accion: {
                tipo: body.tipoActividad,
                modulo: body.modulo,
                descripcion: body.descripcion || '',
                exitoso: body.exito !== undefined ? body.exito : true,
            },
            entidad: {
                tipo: body.tipoEntidad || null,
                id: body.idEntidad || null,
                datosPrevios: body.datosPrevios || null,
                datosNuevos: body.datosNuevos || null,
            },
            metadatos: body.metadata || {},
            fechaHora: body.fechaHora ? new Date(body.fechaHora) : new Date(),
            creadoEn: new Date(),
        };

        await (await obtenerClienteMongoPrimario()).collection(COLLECTION_NAME).insertOne(documentoLog);
        return NextResponse.json({
            ok: true,
            mensaje: 'Log registrado exitosamente',
            log: {
                usuario: documentoLog.usuario.correo,
                accion: `${documentoLog.accion.tipo} en ${documentoLog.accion.modulo}`,
                timestamp: documentoLog.fechaHora,
            },
        });
    } catch (error) {
        console.error('Error guardando log:', error);
        return NextResponse.json({
            ok: false,
            error: 'Error al guardar el log',
            detalles: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filtros: Record<string, any> = {};
        if (searchParams.get('rol')) filtros['usuario.rol'] = searchParams.get('rol');
        if (searchParams.get('modulo')) filtros['accion.modulo'] = searchParams.get('modulo');
        if (searchParams.get('usuario')) filtros['usuario.id'] = searchParams.get('usuario');
        if (searchParams.get('desde') || searchParams.get('hasta')) {
            filtros.fechaHora = {};
            if (searchParams.get('desde')) filtros.fechaHora.$gte = new Date(searchParams.get('desde')!);
            if (searchParams.get('hasta')) filtros.fechaHora.$lte = new Date(searchParams.get('hasta')!);
        }

        const limite = Math.min(parseInt(searchParams.get('limite') || '50', 10), 1000);
        const logs = await (await obtenerClienteMongoPrimario())
            .collection(COLLECTION_NAME)
            .find(filtros)
            .sort({ fechaHora: -1 })
            .limit(limite)
            .toArray();
        return NextResponse.json({ ok: true, total: logs.length, logs });
    } catch (error) {
        console.error('Error consultando logs:', error);
        return NextResponse.json({
            ok: false,
            error: 'Error al consultar logs',
            detalles: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
