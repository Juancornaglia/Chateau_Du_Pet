// js/admin_auth.js
// Este é o "Segurança" que vai proteger todas as suas páginas de admin.

// CORRIGIDO: O caminho estava errado.
import { supabase } from '../js/supabaseClient.js';

/**
 * Verifica se o usuário logado é um admin.
 * Se não for, ele expulsa o usuário para a tela de login.
 * @returns {object | null} Retorna o objeto do usuário se for admin, ou nulo se não for.
 */
export async function checkAdminAuth() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Erro ao pegar sessão:', sessionError);
        window.location.href = '../usuario/login.html'; // Expulsa para o login unificado
        return null;
    }

    if (!session) {
        console.log("Nenhum usuário logado. Redirecionando...");
        window.location.href = '../usuario/login.html';
        return null;
    }

    const userId = session.user.id;

    const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('role')
        .eq('id', userId)
        .single();

    if (perfilError) {
        console.error('Erro ao buscar perfil do admin:', perfilError);
        alert('Erro: Não foi possível verificar seu perfil.');
        await supabase.auth.signOut();
        window.location.href = '../usuario/login.html';
        return null;
    }

    if (perfil && perfil.role === 'admin') {
        console.log('Acesso de admin verificado.');
        return session.user; // Sucesso!
    } else {
        console.warn('Acesso negado: Usuário não é admin.');
        alert('Acesso negado. Esta área é restrita para administradores.');
        await supabase.auth.signOut();
        window.location.href = '../usuario/login.html';
        return null;
    }
}