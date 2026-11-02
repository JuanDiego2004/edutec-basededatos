import { MongoClient, Db } from 'mongodb';

let clienteMongo: MongoClient | null = null;

export async function obtenerClienteMongoPrimario(): Promise<Db> {
    const uri = process.env.MONGODB_PRIMARIA_URI || process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI no está configurada en .env');
    }

    if (!clienteMongo) {
        clienteMongo = new MongoClient(uri);
        await clienteMongo.connect();
    }

    return clienteMongo.db();
}

export async function verificarSaludMongoPrimario(): Promise<boolean> {
    try {
        const resultado = await (await obtenerClienteMongoPrimario()).admin().ping();
        return resultado.ok === 1;
    } catch (error) {
        console.error('Error verificando salud MongoDB:', error);
        return false;
    }
}

export async function cerrarConexionesMongo(): Promise<void> {
    if (clienteMongo) {
        await clienteMongo.close();
        clienteMongo = null;
    }
}
