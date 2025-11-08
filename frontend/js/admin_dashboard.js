// js/admin_dashboard.js
// CÓDIGO COM O "SEGURANÇA" DESATIVADO PARA TESTE DO BACKDOOR

// Importa o "segurança"
// LINHA 1: DESATIVADO O IMPORT
// import { checkAdminAuth } from './admin_auth.js'; 

async function initDashboard() {
    // 1. VERIFICA A AUTENTICAÇÃO
    // LINHA 2: DESATIVADO A VERIFICAÇÃO
    // const adminUser = await checkAdminAuth();
    // LINHA 3: DESATIVADO O BLOQUEIO
    // if (!adminUser) return; // Para a execução se não for admin

    // 2. O USUÁRIO É ADMIN. CONTINUE CARREGANDO A PÁGINA.
    // Alterado para não depender da const 'adminUser'
    console.log(`Bem-vindo, Admin! (Modo de teste)`);
    
    const dashboardContent = document.getElementById('dashboard-content');
    if(dashboardContent) {
        // Este é o seu código original, que está correto.
        dashboardContent.innerHTML = `
            <h3>Olá, Administrador!</h3>
            <p>Seu painel de controle está pronto. Use o menu ao lado para gerenciar.</p>
        `;
    }
}
document.addEventListener('DOMContentLoaded', initDashboard);