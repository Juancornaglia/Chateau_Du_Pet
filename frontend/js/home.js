// js/home.js
// ====================================================================
// CORREÇÃO: A lógica do 'homeSupabase.js' foi movida para este arquivo.
// APAGUE o arquivo 'homeSupabase.js' e a tag <script> dele no HTML.
// ====================================================================

// CAMINHOS CORRIGIDOS (./ significa "na mesma pasta")
import { supabase } from './supabaseClient.js'; 
import { CHATEAU_SELECTED_STORE_KEY } from './geolocator.js'; 

// ==========================================================================
// FUNÇÕES ESSENCIAIS DE UX E DADOS (EXPORTADAS PARA BUSCA.JS)
// ==========================================================================

// --- Favoritos (Exported) ---
export function getFavorites() { return JSON.parse(localStorage.getItem('chateau_favorites')) || []; }
function saveFavorites(favorites) { localStorage.setItem('chateau_favorites', JSON.stringify(favorites)); }

export function toggleFavorite(productId) { 
    let favorites = getFavorites();
    const productIdNum = parseInt(productId, 10);
    if (isNaN(productIdNum)) return;
    if (favorites.includes(productIdNum)) {
        favorites = favorites.filter(id => id !== productIdNum);
    } else {
        favorites.push(productIdNum);
    }
    saveFavorites(favorites);
    updateFavoriteButtons();
}
export function updateFavoriteButtons() { 
    const favorites = getFavorites();
    document.querySelectorAll('.btn-favorite').forEach(button => {
        const productId = parseInt(button.dataset.productId, 10);
        if (!isNaN(productId)) {
            button.classList.toggle('active', favorites.includes(productId));
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.toggle('bi-heart', !favorites.includes(productId));
                icon.classList.toggle('bi-heart-fill', favorites.includes(productId));
            }
        }
    });
}
// --- Cards e Preços (Exported) ---
export function formatPrice(price) { 
    if (typeof price !== 'number') return 'Consulte';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
}

export function createProductCard(produto) { 
    if (!produto || typeof produto.id_produto === 'undefined') { return ''; }
    
    const originalPrice = produto.preco;
    const promoPrice = produto.preco_promocional;
    const isPromo = promoPrice && promoPrice < originalPrice;
    const displayPrice = isPromo ? promoPrice : originalPrice;
    
    const favorites = getFavorites();
    const isFavorite = favorites.includes(parseInt(produto.id_produto, 10));
    const heartIconClass = isFavorite ? 'bi-heart-fill' : 'bi-heart';
    // CAMINHO CORRIGIDO (adicionado 'frontend/')
    const productLink = `frontend/produto.html?id=${produto.id_produto}`;
    
    let imageUrl = produto.url_imagem;
    // CAMINHO CORRIGIDO (adicionado 'frontend/')
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `frontend/img/${produto.url_imagem || 'placeholder.png'}`; 
    }
    if (!imageUrl || imageUrl.trim() === "") { imageUrl = 'frontend/img/placeholder.png'; }
    
    return `
        <div class="card h-100 product-card shadow-sm position-relative">
            <button class="btn btn-outline-danger btn-favorite position-absolute top-0 end-0 m-2 ${isFavorite ? 'active' : ''}" data-product-id="${produto.id_produto}" style="z-index: 10;">
                <i class="bi ${heartIconClass}"></i>
            </button>
            <a href="${productLink}" class="d-block text-center pt-3">
                <img src="${imageUrl}" class="card-img-top" alt="${produto.nome_produto || 'Produto sem nome'}">
            </a>
            <div class="card-body d-flex flex-column text-center">
                <h5 class="card-title flex-grow-1 card-title-limit fs-6 mb-2">
                    <a href="${productLink}" class="text-decoration-none text-dark">
                        ${produto.nome_produto || '(Sem Nome)'}
                    </a>
                </h5>
                <div class="price-container mt-auto mb-2">
                    ${isPromo ? `<p class="text-muted text-decoration-line-through small mb-0">${formatPrice(originalPrice)}</p>` : ''}
                    <p class="card-text price fs-5 fw-bold main-purple-text mb-0">${formatPrice(displayPrice)}</p>
                </div>
                
                <a href="${productLink}" class="btn btn-sm btn-custom mt-2" style="z-index: 5;">
                   <i class="bi bi-search me-1"></i> Consultar Produto
                </a>
            </div>
        </div>
    `;
}


// ==========================================================================
// 4. LÓGICA DE GEOLOCALIZAÇÃO E CARREGAMENTO
// ==========================================================================

function getSelectedStoreId() {
    const savedStore = localStorage.getItem(CHATEAU_SELECTED_STORE_KEY);
    if (savedStore) {
        return JSON.parse(savedStore).id;
    }
    return 1; // ID Padrão (Pet Shop Central) se não houver nada salvo
}

async function loadProducts(containerId, initialQueryFn, isGrid = false) {
    const container = document.getElementById(containerId);
    if (!container) { return; }

    if (typeof supabase === 'undefined' || !supabase || !supabase.from) {
         container.innerHTML = `<p class="text-center text-danger">Erro de conexão com a base de dados.</p>`;
         return;
    }

    const storeId = getSelectedStoreId(); 
    container.innerHTML = isGrid 
        ? '<div class="col-12 text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>'
        : '<div class="spinner-border text-primary mx-auto" role="status"></div>';

    try {
        let query = initialQueryFn(supabase, storeId);
        
        const { data: produtos, error } = await query;
        
        if (error) { 
             console.error(`ERRO SUPABASE em ${containerId}:`, error);
             throw new Error(`Falha ao buscar dados: ${error.message}. (Verifique RLS e Colunas)`); 
        }

        if (produtos && produtos.length > 0) {
             container.innerHTML = produtos.map(produto => {
                 const cardHtml = createProductCard(produto);
                 // ====================================================================
                 // CORREÇÃO: Se NÃO for grid (ou seja, é um slider), não envolve em 'col'
                 // ====================================================================
                 return isGrid ? `<div class="col">${cardHtml}</div>` : cardHtml;
             }).join('');
            updateFavoriteButtons();
        } else {
             container.innerHTML = isGrid ? `<div class="col-12"><p class="text-center text-muted">Nenhum produto encontrado nesta seção.</p></div>` : '<p class="text-center text-muted">Nenhum produto encontrado.</p>';
        }

    } catch (error) {
        console.error(`Erro ao processar "${containerId}":`, error.message);
        container.innerHTML = isGrid ? `<div class="col-12"><p class="text-center text-danger">Erro ao carregar: ${error.message}</p></div>` : `<p class="text-center text-danger">Erro ao carregar: ${error.message}</p>`;
    }
}


// --- LÓGICA DA SIDEBAR, GEOLOC, VÍDEOS ---
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const openButton = document.getElementById('button-menu');
    const closeButton = document.getElementById('close-sidebar');
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    if (!sidebar || !overlay || !openButton || !closeButton) {
        console.warn("AVISO: Elementos essenciais da Sidebar não encontrados. Sidebar inativa.");
        return;
    }
    const openSidebar = () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    };
    const closeSidebar = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    };
    openButton.addEventListener('click', openSidebar);
    closeButton.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    submenuToggles.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.menu-item')?.classList.toggle('open');
        });
    });
}
function setupVideoPlayers() { 
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        const video = card.querySelector('video');
        const playButton = card.querySelector('.play-button');
        if (video && playButton) {
            const togglePlay = () => {
                if (video.paused || video.ended) {
                    video.play();
                    video.muted = false;
                    card.classList.add('is-playing');
                }
            };
            playButton.addEventListener('click', togglePlay);
            video.addEventListener('click', () => { if (!video.paused) video.pause(); });
             video.addEventListener('pause', () => { card.classList.remove('is-playing'); });
             video.addEventListener('ended', () => { card.classList.remove('is-playing'); });
        }
    });
    // ====================================================================
    // CORREÇÃO: Chamar setupMediaSliders AQUI, depois que os vídeos foram configurados
    // ====================================================================
    setupMediaSliders();
}

function setupMediaSliders() {
    // ====================================================================
    // CORREÇÃO: Função de slider genérica
    // ====================================================================
    const setupSlider = (trackId, prevId, nextId) => {
        const track = document.getElementById(trackId);
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        
        if (track && prevBtn && nextBtn) {
             const scrollAmount = () => {
                // Tenta pegar a largura do primeiro card no track
                const firstCard = track.querySelector('.card, .card-media');
                if (firstCard) {
                    return firstCard.offsetWidth + 24; // Largura do card + gap (1.5rem)
                }
                return 300; // Valor padrão
            };

            nextBtn.addEventListener('click', () => {
                track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
            });
            prevBtn.addEventListener('click', () => {
                track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
            });
        } else {
            // Aviso se os botões não foram encontrados para um slider
            if(track) console.warn(`Slider "${trackId}" não encontrou botões "${prevId}" ou "${nextId}".`);
        }
    };
    
    // Configura todos os sliders da página
    setupSlider('animais-track', 'amigos-prev', 'amigos-next');
    setupSlider('videos-track', 'videos-prev', 'videos-next');
    
    // ====================================================================
    // CORREÇÃO: Adicionando a lógica do slider para "Mais Vendidos"
    // ====================================================================
    setupSlider('mais-vendidos-track', 'mais-vendidos-prev', 'mais-vendidos-next');
    // Adiciona também para os outros sliders de produto
    setupSlider('ofertas-track', 'ofertas-prev', 'ofertas-next');
    setupSlider('recomendados-track', 'recomendados-prev', 'recomendados-next');
    setupSlider('novidades-track', 'novidades-prev', 'novidades-next');
}

function initProductLoading() {
     const storeId = getSelectedStoreId(); 

    // Funções de Query: As consultas que funcionam no Supabase
    const ofertasQueryFn = (sb) => sb.from('produtos').select('*, preco_promocional').not('preco_promocional', 'is', null).order('data_cadastro', { descending: true }).limit(8);
    const recomendadosQueryFn = (sb) => sb.from('produtos').select('*').order('data_cadastro', { ascending: false }).limit(8);
    const novidadesQueryFn = (sb) => sb.from('produtos').select('*').order('data_cadastro', { ascending: false }).limit(8);
    const maisVendidosQueryFn = (sb) => sb.from('produtos').select('*').order('quantidade_estoque', { descending: true }).limit(12);

    // ====================================================================
    // CORREÇÃO: Carregando todos como sliders (isGrid = false)
    // ====================================================================
    loadProducts('ofertas-track', ofertasQueryFn, false);
    loadProducts('recomendados-track', recomendadosQueryFn, false);
    loadProducts('novidades-track', novidadesQueryFn, false);
    loadProducts('mais-vendidos-track', maisVendidosQueryFn, false);
}

document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();
    setupVideoPlayers();
    
    initProductLoading();
    window.addEventListener('chateauStoreChanged', initProductLoading); 
});

// Listener global para cliques nos botões de coração
document.body.addEventListener('click', (event) => {
    const favoriteButton = event.target.closest('.btn-favorite');
    if (favoriteButton) {
        const productId = favoriteButton.dataset.productId;
        if (productId) { toggleFavorite(productId); }
    }
});