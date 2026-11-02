import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const { estudiante_id } = await request.json();
        if (!estudiante_id) return NextResponse.json({ error: 'estudiante_id requerido' }, { status: 400 });

        const { data: profile, error: lookupError } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .eq('estudiante_id', estudiante_id)
            .maybeSingle();
        if (lookupError) throw lookupError;

        const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('estudiante_id', estudiante_id);
        if (profileError) throw profileError;

        if (profile?.user_id) {
            const { error: roleError } = await supabaseAdmin.from('user_roles').delete().eq('user_id', profile.user_id);
            if (roleError) throw roleError;
            const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
            if (userError) throw userError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error eliminando perfil:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al eliminar perfil' }, { status: 500 });
    }
}
