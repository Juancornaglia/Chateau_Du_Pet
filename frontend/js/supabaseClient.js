// js/supabaseClient.js

// ======================================================
// SUAS NOVAS CHAVES DE ACESSO
// ======================================================
const SUPABASE_URL =  'https://lslnyyfpwxhwsesnihfj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbG55eWZwd3hod3Nlc25paGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjE5NDEsImV4cCI6MjA3NzUzNzk0MX0.o1yO79aBHvDt6MQ5PRhMPsl4Qzad6SuA8HDTbn73TgI';

let supabase;

// Define o schema 'public' como padrão (como está no seu SQL)
const options = {
    db: {
        schema: 'public',
    },
};

try {
    // Importa a função 'createClient' diretamente do SDK que já deve estar carregado no HTML
    const { createClient } = window.supabase; 

    if (createClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
        // Passa as 'options' na criação do cliente
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
        console.log("Supabase Client Conectado com Sucesso ao esquema 'public'!");
    } else {
         console.error("ERRO CRÍTICO: O SDK do Supabase (window.supabase) não foi encontrado. Verifique se o script <script> está no HTML.");
         // Objeto de simulação para evitar que o resto quebre
         supabase = { auth: { getSession: () => Promise.resolve({ data: { session: null } }) }, from: () => ({ select: () => Promise.resolve({ error: { message: "Supabase SDK não carregado" }}) }) };
    }
} catch (e) {
    console.error("Erro fatal ao configurar o Supabase. Verifique o console.", e);
    supabase = { auth: { getSession: () => Promise.resolve({ data: { session: null } }) }, from: () => ({ select: () => Promise.resolve({ error: { message: "Erro fatal no Supabase" }}) }) };
}

export { supabase };