// js/admin_login.js

// Importa o cliente Supabase
import { supabase } from '../js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
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
                    throw new Error(authError.message); // Joga o erro para o catch
                }

                if (!authData.user) {
                    throw new Error("Usuário não encontrado.");
                }

                userId = authData.user.id; // Guarda o ID do usuário logado

                // 2. Verificar se o usuário é um administrador
                // Vamos consultar uma tabela 'perfis' que deve ter o role do usuário
                const { data: perfilData, error: perfilError } = await supabase
                    .from('perfis') // Assumindo que sua tabela de perfis se chama 'perfis'
                    .select('role') // Assumindo que a coluna de permissão se chama 'role'
                    .eq('id', userId) // Ligando ao ID do usuário do Auth
                    .single();
                
                if (perfilError) {
                    console.error("Erro ao buscar perfil:", perfilError);
                    throw new Error("Não foi possível verificar sua permissão de acesso.");
                }

                // 3. Checar a permissão (role)
                if (perfilData && perfilData.role === 'admin') {
                    // É ADMIN! Redirecionar para o Dashboard.
                    alert('Acesso de administrador concedido. Bem-vindo!');
                    // (Estamos em /admin/admin_login.html, então o dashboard está na mesma pasta)
                    window.location.href = 'dashboard.html';
                } else {
                    // Não é admin.
                    throw new Error("Acesso negado. Esta conta não possui privilégios de administrador.");
                }

            } catch (error) {
                console.error('Erro no login de admin:', error.message);
                
                // Se o login falhou ou ele não é admin, desloga por segurança
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