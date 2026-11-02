import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function DELETE(request: Request) {
    try {
        const userId = new URL(request.url).searchParams.get('id');
        if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        const { error: roleError } = await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
        if (roleError) throw roleError;
        const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('user_id', userId);
        if (profileError) throw profileError;
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al eliminar usuario' }, { status: 500 });
    }
}
