// js/admin_auth.js
// Este é o "Segurança" que vai proteger todas as suas páginas de admin.

import { supabase } from './supabaseClient.js';

/**
 * Verifica se o usuário logado é um admin.
 * Se não for, ele expulsa o usuário para a tela de login.
 * @returns {object | null} Retorna o objeto do usuário se for admin, ou nulo se não for.
 */
export async function checkAdminAuth() {
    // 1. Pega o usuário logado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Erro ao pegar sessão:', sessionError);
        window.location.href = 'admin_login.html'; // Expulsa por segurança
        return null;
    }

    if (!session) {
        // 2. Se NINGUÉM estiver logado, expulsa para o login
        console.log("Nenhum usuário logado. Redirecionando...");
        window.location.href = 'admin_login.html';
        return null;
    }

    const userId = session.user.id;

    // 3. Verifica na sua tabela 'perfis' se o usuário logado é um ADMIN
    const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('role') // Pega a coluna 'role'
        .eq('id', userId) // Onde o 'id' é igual ao do usuário logado
        .single();

    if (perfilError) {
        console.error('Erro ao buscar perfil do admin:', perfilError);
        alert('Erro: Não foi possível verificar seu perfil.');
        await supabase.auth.signOut(); // Desloga por segurança
        window.location.href = 'admin_login.html';
        return null;
    }

    // 4. A VERIFICAÇÃO FINAL
    if (perfil && perfil.role === 'admin') {
        // SUCESSO! O usuário é um admin.
        console.log('Acesso de admin verificado.');
        return session.user; // Retorna os dados do usuário admin
    } else {
        // 5. O usuário é um 'cliente' (ou outro role) tentando acessar o painel admin.
        console.warn('Acesso negado: Usuário não é admin.');
        alert('Acesso negado. Esta área é restrita para administradores.');
        await supabase.auth.signOut(); // Desloga o usuário
        window.location.href = 'admin_login.html';
        return null;
    }
}