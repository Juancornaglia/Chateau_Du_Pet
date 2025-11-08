// js/supabaseClient.js
// ESTA É A VERSÃO CORRIGIDA

// Importa a função 'createClient' direto do CDN oficial do Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ======================================================
// SUAS CHAVES DE ACESSO (COPIADAS DO SEU ARQUIVO)
// ======================================================
const SUPABASE_URL = 'https://lslnyyfpwxhwsesnihfj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbG55eWZwd3hod3Nlc25paGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjE5NDEsImV4cCI6MjA3NzUzNzk0MX0.o1yO79aBHvDt6MQ5PRhMPsl4Qzad6SuA8HDTbn73TgI';

// =KA CORREÇÃO MAIS IMPORTANTE ESTÁ AQUI
const options = {
    db: {
        schema: 'public', // Diz ao Supabase para usar o esquema 'public'
    },
};

// Cria e exporta o cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);

console.log("Supabase Client Conectado com Sucesso ao esquema 'public'!");