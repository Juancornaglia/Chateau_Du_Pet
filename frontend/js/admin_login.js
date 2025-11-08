// js/admin_login.js

import { supabase } from '../js/supabaseClient.js';
// Importa o "segurança" que acabamos de criar
import { checkAdminAuth } from './admin_auth.js'; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // VERIFICAÇÃO INICIAL: Se o usuário já é um admin logado,
    // não precisa fazer login de novo. Vai direto pro dashboard.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Temos uma sessão. Vamos checar o 'role' silenciosamente
        const { data: perfil } = await supabase
            .from('perfis')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
        if (perfil && perfil.role === 'admin') {
            console.log("Admin já logado. Redirecionando para o dashboard...");
            // O dashboard.html está na mesma pasta que admin_login.html
            window.location.href = 'dashboard.html'; 
            return; // Para a execução do script
        }
    }
    // Se não tinha sessão, ou a sessão não era admin, continua para o login.

    const adminLoginForm = document.getElementById('adminLoginForm');
    
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const button = e.target.querySelector('button[type="submit"]');

            button.disabled = true;
            button.textContent = 'VERIFICANDO...';

            let userId = null;

            try {
                // 1. Tentar fazer o login no Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: senha,
                });

                if (authError) {
                    // Trata erro de "Email não confirmado"
                    if (authError.message.includes("Email not confirmed")) {
                         throw new Error("Email não confirmado. Por favor, verifique sua caixa de entrada.");
                    }
                    throw new Error(authError.message);
                }

                if (!authData.user) {
                    throw new Error("Usuário não encontrado.");
                }

                userId = authData.user.id; // Guarda o ID do usuário logado

                // 2. Verificar se o usuário é um administrador (usando a função do admin_auth)
                // Isso vai checar o 'role' na tabela 'perfis'
                const adminUser = await checkAdminAuth();

                if (adminUser) {
                    // É ADMIN! Redirecionar para o Dashboard.
                    console.log('Login de admin bem-sucedido!');
                    window.location.href = 'dashboard.html';
                }
                // Se não for admin, o checkAdminAuth() já cuidou de deslogar e mostrar o alerta.

            } catch (error) {
                console.error('Erro no login de admin:', error.message);
                
                if (userId) { // Se o login auth funcionou mas a permissão falhou
                    await supabase.auth.signOut();
                }

                if (error.message.includes("Invalid login credentials")) {
                    alert("Email ou senha incorretos.");
                } else {
                    alert(error.message);
                }
                
                button.disabled = false;
                button.textContent = 'ENTRAR';
            }
        });
    }
});