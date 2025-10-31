// js/supabaseClient.js

// --- ESTRUTURA PRONTA PARA SUPABASE ---

// 🔻🔻🔻 COLOQUE SEUS DADOS REAIS AQUI 🔻🔻🔻
const SUPABASE_URL =  'https://sgsoqvphinhrgbaqivyo.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnc29xdnBoaW5ocmdiYXFpdnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDAyOTMsImV4cCI6MjA3NDY3NjI5M30.mKzZ8y_UOIeJuSTUE9qubo27AYl75tL04SC6rfxudBs';

// O resto do código permanece o mesmo
let supabase;

try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.includes('supabase.co')) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Client Conectado com Sucesso!");
    } else {
        // Objeto de mock para evitar erros quando as chaves estão vazias
        supabase = {
            from: () => ({ 
                select: () => {
                    console.error("MOCK: A busca não vai funcionar pois as chaves do Supabase estão vazias em supabaseClient.js");
                    return Promise.resolve({ data: [], error: { message: "Supabase não ativado. Chaves vazias." } });
                }
            })
        };
        console.warn("AVISO: Supabase Client está em modo de mock. Preencha as chaves no arquivo js/supabaseClient.js");
    }
} catch (e) {
    console.error("Erro fatal ao configurar o Supabase. Verifique se o script do Supabase foi importado no HTML.");
}

export { supabase };