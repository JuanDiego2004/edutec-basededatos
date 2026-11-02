import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const { email, password, role, metadata = {} } = await request.json();
        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Email, password y role son requeridos' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata,
        });
        if (error || !data.user) throw error || new Error('No se pudo crear el usuario');

        const userId = data.user.id;
        const { error: roleError } = await supabaseAdmin.from('user_roles').insert({ user_id: userId, role });
        if (roleError) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw roleError;
        }

        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            user_id: userId,
            profesor_id: metadata.profesor_id || null,
            estudiante_id: metadata.estudiante_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        if (profileError) {
            await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        return NextResponse.json({ success: true, userId, message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error('Error creando usuario:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear usuario' }, { status: 500 });
    }
}
