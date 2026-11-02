import { obtenerClienteSupabasePrimario } from './conexionPostgres';

export interface QueryResult<T> {
    data: T[] | null;
    error: any;
}

export interface SingleResult<T> {
    data: T | null;
    error: any;
}

/** Operaciones de datos dirigidas exclusivamente a la instancia principal. */
export const supabaseDB = {
    getDirectClient: obtenerClienteSupabasePrimario,

    async select<T = any>(
        tabla: string,
        opciones?: {
            seleccion?: string;
            filtros?: Record<string, any>;
            orden?: { campo: string; ascendente?: boolean };
            limite?: number;
        }
    ): Promise<QueryResult<T>> {
        try {
            let query = obtenerClienteSupabasePrimario().from(tabla).select(opciones?.seleccion || '*');
            for (const [key, value] of Object.entries(opciones?.filtros || {})) query = query.eq(key, value);
            if (opciones?.orden) query = query.order(opciones.orden.campo, { ascending: opciones.orden.ascendente ?? true });
            if (opciones?.limite) query = query.limit(opciones.limite);
            const { data, error } = await query;
            return { data: data as unknown as T[] | null, error };
        } catch (error) {
            return { data: null, error };
        }
    },

    async insert<T = any>(tabla: string, datos: any | any[]): Promise<QueryResult<T>> {
        try {
            const items = (Array.isArray(datos) ? datos : [datos]).map((item) =>
                item.id ? item : { ...item, id: crypto.randomUUID() }
            );
            const { data, error } = await obtenerClienteSupabasePrimario().from(tabla).insert(items).select();
            return { data: data as unknown as T[] | null, error };
        } catch (error) {
            return { data: null, error };
        }
    },

    async insertSingle<T = any>(tabla: string, datos: any): Promise<SingleResult<T>> {
        const { data, error } = await this.insert<T>(tabla, datos);
        return { data: data?.[0] ?? null, error };
    },

    async update<T = any>(tabla: string, id: string, datos: any): Promise<QueryResult<T>> {
        try {
            const { data, error } = await obtenerClienteSupabasePrimario().from(tabla).update(datos).eq('id', id).select();
            return { data: data as unknown as T[] | null, error };
        } catch (error) {
            return { data: null, error };
        }
    },

    async delete<T = any>(tabla: string, id: string): Promise<QueryResult<T>> {
        try {
            const { data, error } = await obtenerClienteSupabasePrimario().from(tabla).delete().eq('id', id).select();
            return { data: data as unknown as T[] | null, error };
        } catch (error) {
            return { data: null, error };
        }
    },
};
