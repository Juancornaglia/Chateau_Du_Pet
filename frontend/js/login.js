// js/login.js
// (Login Unificado para Cliente e Admin)

import { supabase } from '../js/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('senha');

    if (loginForm) {
        const submitButton = loginForm.querySelector('button[type="submit"]');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('senha').value;

            submitButton.disabled = true;
            submitButton.textContent = 'ACESSANDO...';

            try {
                // PASSO 1: AUTENTICAR (Ver se email e senha batem)
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (authError) {
                    throw authError; // Joga o erro para o catch
                }
                
                if (!authData.user) {
                    throw new Error("Dados de usuário não retornados.");
                }

                // PASSO 2: AUTORIZAR (Ver se é admin ou cliente)
                const userId = authData.user.id;
                
                console.log("Usuário autenticado. Verificando perfil...");

                // AGORA ISTO VAI FUNCIONAR, pois o supabaseClient sabe olhar o schema 'public'
                const { data: perfil, error: perfilError } = await supabase
                    .from('perfis')       
                    .select('role')     
                    .eq('id', userId)   
                    .single();

                if (perfilError) {
                    console.error("Erro ao buscar perfil:", perfilError.message);
                    await supabase.auth.signOut();
                    throw new Error("Erro ao verificar seu perfil. (O usuário existe no Auth, mas não na tabela 'perfis'?)");
                }

                if (!perfil) {
                    await supabase.auth.signOut();
                    throw new Error("Perfil de usuário não encontrado. Contate o suporte.");
                }

                // PASSO 3: REDIRECIONAR
                if (perfil.role === 'admin') {
                    // É ADMIN!
                    alert('Acesso de administrador concedido. Bem-vindo!');
                    window.location.href = '../admin/dashboard.html';
                
                } else {
                    // É CLIENTE!
                    const redirectTo = localStorage.getItem('redirectAfterLogin') || '../home.html';
                    localStorage.removeItem('redirectAfterLogin');

                    alert('Login bem-sucedido! Redirecionando...');
                    window.location.href = redirectTo;
                }

            } catch (error) {
                console.error('Erro no login:', error.message);
                
                if (error.message.includes("Invalid login credentials")) {
                    alert("Email ou senha incorretos. Tente novamente.");
                } else if (error.message.includes("Email not confirmed")) {
                    alert("Seu email ainda não foi confirmado. Verifique sua caixa de entrada.");
                } else {
                    alert(`Erro ao fazer login: ${error.message}`);
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'ACESSAR';
            }
        });
    }
    
    // Lógica para mostrar/esconder a senha
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('bi-eye-fill');
            this.classList.toggle('bi-eye-slash-fill');
        });
    }
});