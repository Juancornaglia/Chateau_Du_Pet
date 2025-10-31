// js/home.js
// Este arquivo agora controla TODA a lógica da página inicial:
// 1. Carrega os produtos do Supabase (lógica do antigo homeSupabase.js).
// 2. Controla a UI: sidebar, sliders, geolocalização e vídeos (lógica do antigo home.js).

import { supabase } from './supabaseClient.js';

// --- LÓGICA DE DADOS (do antigo homeSupabase.js) ---

function formatPrice(price) {
    if (typeof price !== 'number') return 'Consulte';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function createProductCard(produto) {
    const displayPrice = produto.preco_promocional && produto.preco_promocional < produto.preco 
        ? produto.preco_promocional 
        : produto.preco;
    
    // CORREÇÃO: Caminhos dos links ajustados
    return `
        <div class="card h-100 product-card shadow-sm">
            <a href="/produto.html?id=${produto.id_produto}">
                <img src="${produto.url_imagem}" class="card-img-top" alt="${produto.nome_produto}">
            </a>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title flex-grow-1">
                    <a href="/produto.html?id=${produto.id_produto}" class="stretched-link text-decoration-none text-dark">
                        ${produto.nome_produto}
                    </a>
                </h5>
                <p class="card-text price fs-5 fw-bold main-purple-text">${formatPrice(displayPrice)}</p>
            </div>
        </div>
    `;
}

async function loadProducts(sectionId, query) {
    const container = document.getElementById(sectionId);
    if (!container) return;
    
    container.innerHTML = '<div class="spinner-border text-primary mx-auto" role="status"><span class="visually-hidden">Loading...</span></div>';
    
    const { data: produtos, error } = await query;
    
    if (error) {
        console.error(`Erro ao carregar seção ${sectionId}:`, error);
        container.innerHTML = '<p class="text-danger">Não foi possível carregar os produtos.</p>';
        return;
    }
    
    if (produtos && produtos.length > 0) {
        container.innerHTML = produtos.map(createProductCard).join('');
    } else {
        container.innerHTML = '<p>Nenhum produto encontrado.</p>';
    }
}


// --- LÓGICA DE UI (do antigo home.js) ---

document.addEventListener('DOMContentLoaded', () => {

    // 1. CHAMA AS FUNÇÕES PARA CARREGAR PRODUTOS DO SUPABASE
    const ofertasQuery = supabase.from('produtos').select('*').not('preco_promocional', 'is', null).order('data_cadastro', { ascending: false }).limit(8);
    loadProducts('ofertas-track', ofertasQuery);

    const recomendadosQuery = supabase.from('produtos').select('*').order('data_cadastro', { ascending: true }).limit(8);
    loadProducts('recomendados-track', recomendadosQuery);

    // 2. LÓGICA DE GEOLOCALIZAÇÃO
    const unidadeProximaSpan = document.getElementById('unidade-proxima');
    if (unidadeProximaSpan) {
        const LIBRARIES = [ { nome: 'Mooca', lat: -23.562772, lon: -46.592535 }, { nome: 'Tatuapé', lat: -23.550186, lon: -46.568469 }, { nome: 'Santos', lat: -23.974917, lon: -46.331445 }, { nome: 'Ipiranga', lat: -23.585501, lon: -46.602766 } ];
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; const toRad = (angle) => angle * (Math.PI / 180);
            const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; 
        };
        const findNearestStore = (userLat, userLon) => {
            let nearestStore = null; let shortestDistance = Infinity;
            LIBRARIES.forEach(store => {
                const distance = calculateDistance(userLat, userLon, store.lat, store.lon);
                if (distance < shortestDistance) { shortestDistance = distance; nearestStore = store; }
            });
            if (nearestStore) { unidadeProximaSpan.innerHTML = `Unidade mais próxima: <a href="/paginas_institucionais/lojas.html?loja=${nearestStore.nome.toLowerCase()}" class="text-white text-decoration-underline"><strong>${nearestStore.nome}</strong> (${shortestDistance.toFixed(1)} km)</a>`; }
        };
        const requestLocation = () => {
            if ("geolocation" in navigator) {
                unidadeProximaSpan.textContent = 'Buscando a unidade mais próxima...';
                navigator.geolocation.getCurrentPosition( (position) => { findNearestStore(position.coords.latitude, position.coords.longitude); }, (error) => {
                    console.error("Erro ao obter localização: ", error);
                    unidadeProximaSpan.textContent = 'Não foi possível obter a localização.';
                });
            } else { 
                unidadeProximaSpan.textContent = 'Geolocalização não suportada.'; 
            }
        };
        requestLocation();
    }

    // 3. INTERAÇÕES DE UI (SIDEBAR)
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const buttonMenu = document.getElementById('button-menu');
    const closeSidebar = document.getElementById('close-sidebar');
    const toggleSidebar = (open) => { if (sidebar && overlay) { sidebar.classList.toggle('active', open); overlay.classList.toggle('active', open); } };
    if(buttonMenu) buttonMenu.addEventListener('click', () => toggleSidebar(true));
    if(closeSidebar) closeSidebar.addEventListener('click', () => toggleSidebar(false));
    if(overlay) overlay.addEventListener('click', () => toggleSidebar(false));
    document.querySelectorAll('.submenu-toggle').forEach(btn => { btn.addEventListener('click', () => { btn.parentElement.classList.toggle('open'); }); });

    // 4. LÓGICA PARA CONTROLE DOS VÍDEOS
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        const video = card.querySelector('video');
        const playButton = card.querySelector('.play-button');
        const togglePlay = () => {
            if (video.paused) { 
                video.play(); 
                video.classList.add('is-playing'); 
                playButton.querySelector('i').className = 'bi bi-pause-circle-fill'; 
            } else { 
                video.pause(); 
                video.classList.remove('is-playing'); 
                playButton.querySelector('i').className = 'bi bi-play-circle-fill'; 
            }
        };
        if(playButton) playButton.addEventListener('click', togglePlay);
        if(video) video.addEventListener('click', togglePlay);
        if(video) video.addEventListener('ended', () => { 
            video.classList.remove('is-playing'); 
            playButton.querySelector('i').className = 'bi bi-play-circle-fill'; 
        });
    });
});