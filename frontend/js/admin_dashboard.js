// js/admin_dashboard.js

// Importa o "segurança"
import { checkAdminAuth } from './admin_auth.js'; 

// Esta função principal vai rodar tudo na página
async function initDashboard() {
    // 1. VERIFICA A AUTENTICAÇÃO
    // Se não for admin, a função checkAdminAuth() vai expulsá-lo
    // e o código abaixo não será executado.
    const adminUser = await checkAdminAuth();
    if (!adminUser) return; // Para a execução se não for admin

    // 2. O USUÁRIO É ADMIN. CONTINUE CARREGANDO A PÁGINA.
    console.log(`Bem-vindo, Admin ${adminUser.email}`);
    
    // (Aqui você pode adicionar seu código para carregar gráficos, etc.)
    const dashboardContent = document.getElementById('dashboard-content'); // Supondo que você tenha uma div com esse ID
    if(dashboardContent) {
        dashboardContent.innerHTML = `
            <h3>Olá, Administrador!</h3>
            <p>Seu painel de controle está pronto. Use o menu ao lado para gerenciar.</p>
        `;
    }
}

// Inicia a página
document.addEventListener('DOMContentLoaded', initDashboard);