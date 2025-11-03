// js/login.js

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
                // Tenta fazer o login com o Supabase Auth
                const { error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    throw error;
                }
                
                // O Supabase SDK armazena a sessão (token) automaticamente no localStorage.
                // Agora verificamos o redirect.
                const redirectTo = localStorage.getItem('redirectAfterLogin') || '../home.html';
                localStorage.removeItem('redirectAfterLogin');

                alert('Login bem-sucedido! Redirecionando...');
                window.location.href = redirectTo;

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