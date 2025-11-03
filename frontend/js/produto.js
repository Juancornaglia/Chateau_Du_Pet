// js/produto.js

import { supabase } from '/js/supabaseClient.js';
// Precisamos das funções de favoritos para o botão de coração
import { getFavorites, toggleFavorite, updateFavoriteButtons } from '/js/home.js';

function formatPrice(price) { 
    if (typeof price !== 'number') return 'Preço a consultar'; 
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
}

async function loadProductDetails() {
    const container = document.getElementById('product-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) { 
        container.innerHTML = '<h1>Produto não encontrado.</h1>'; 
        return; 
    }

    // 1. Busca os dados do produto
    const { data: produto, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id_produto', productId)
        .single();
    
    if (error || !produto) { 
        console.error('Erro ao buscar produto:', error); 
        container.innerHTML = '<h1>Produto não encontrado.</h1>'; 
        return; 
    }
    
    document.title = produto.nome_produto;
    let priceHtml = `<p class="fs-2 fw-bold main-purple-text mb-1">${formatPrice(produto.preco)}</p>`;
    if (produto.preco_promocional && produto.preco_promocional < produto.preco) { 
        priceHtml = `<p class="price-original mb-0">${formatPrice(produto.preco)}</p><p class="fs-2 fw-bold main-purple-text mb-1">${formatPrice(produto.preco_promocional)}</p>`; 
    }
    
    // Pega o status dos favoritos
    const favorites = getFavorites();
    const isFavorite = favorites.includes(parseInt(produto.id_produto, 10));
    const heartIconClass = isFavorite ? 'bi-heart-fill' : 'bi-heart';

    // 2. Monta o HTML (Sem "Quantidade" e "Adicionar ao Carrinho")
    container.innerHTML = `
        <div class="col-md-6 text-center">
            <img src="${produto.url_imagem}" class="img-fluid rounded shadow-sm" alt="${produto.nome_produto}" style="max-height: 450px; object-fit: contain; padding: 1rem; background: #fff;">
        </div>
        <div class="col-md-6">
            <button class="btn btn-outline-danger btn-favorite position-absolute top-0 end-0 m-3 ${isFavorite ? 'active' : ''}" data-product-id="${produto.id_produto}" style="z-index: 10;">
                <i class="bi ${heartIconClass}"></i>
            </button>
            <h1 class="product-title">${produto.nome_produto}</h1>
            <p class="text-muted">Marca: ${produto.marca || 'Não informado'} | Código: ${produto.id_produto}</p>
            ${priceHtml}
            
            <div id="store-availability-container" class="mt-4">
                <h4><i class="bi bi-shop me-2"></i>Disponibilidade nas Lojas</h4>
                <ul class="store-availability-list" id="store-list">
                    <li><div class="spinner-border spinner-border-sm" role="status"></div> Buscando lojas...</li>
                </ul>
            </div>
        </div>
    `;

    // 3. Preenche o Accordion (igual ao seu código antigo)
    const accordionContainer = document.getElementById('product-info-accordion');
    accordionContainer.innerHTML = `
        <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">Detalhes</button></h2><div id="collapseOne" class="accordion-collapse collapse show"><div class="accordion-body">${produto.descricao || 'Sem descrição.'}</div></div></div>
        <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">Ficha Técnica</button></h2><div id="collapseTwo" class="accordion-collapse collapse"><div class="accordion-body"><ul class="list-group list-group-flush"><li class="list-group-item"><strong>Marca:</strong> ${produto.marca || 'N/A'}</li><li class="list-group-item"><strong>Categoria:</strong> ${produto.tipo_produto || 'N/A'}</li><li class="list-group-item"><strong>Peso/Medida:</strong> ${produto.tamanho_medida || 'N/A'}</li></ul></div></div></div>
    `;
    
    // 4. Carrega a disponibilidade e os produtos relacionados
    loadStoreAvailability(productId);
    loadRelatedProducts(produto.tipo_produto, produto.id_produto);
    
    // 5. Adiciona o listener para o botão de favorito
    document.querySelector('.btn-favorite').addEventListener('click', (event) => {
        const favoriteButton = event.currentTarget;
        const productId = favoriteButton.dataset.productId;
        if (productId) { toggleFavorite(productId); }
    });
}

// ======================================================
// NOVA FUNÇÃO: Buscar Lojas para este Produto
// ======================================================
async function loadStoreAvailability(productId) {
    const storeListEl = document.getElementById('store-list');
    if (!storeListEl) return;

    try {
        // Busca na tabela 'produtos' por esse ID e traz a informação da loja
        // ATENÇÃO: Seu schema 'produtos' não tem 'id_loja'. 
        // Vou assumir que TODOS os produtos estão em TODAS as lojas.
        
        const { data: lojas, error } = await supabase.from('lojas').select('nome_loja');

        if (error) throw error;

        if (lojas && lojas.length > 0) {
            storeListEl.innerHTML = lojas.map(loja => 
                `<li><i class="bi bi-check-circle-fill"></i>${loja.nome_loja}</li>`
            ).join('');
        } else {
            storeListEl.innerHTML = `<li><i class="bi bi-x-circle-fill"></i>Nenhuma loja encontrada.</li>`;
        }

    } catch (error) {
        console.error("Erro ao buscar disponibilidade:", error);
        storeListEl.innerHTML = `<li><i class="bi bi-x-circle-fill"></i>Erro ao consultar disponibilidade.</li>`;
    }
}


async function loadRelatedProducts(tipo_produto, currentProductId) {
    const container = document.getElementById('related-products-container');
    if (!tipo_produto) { if(container) container.style.display = 'none'; return; }
    
    // Busca produtos do mesmo tipo, que não sejam o produto atual
    const { data: related, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('tipo_produto', tipo_produto)
        .not('id_produto', 'eq', currentProductId)
        .limit(4);
        
    if (error || !related || related.length === 0) { 
        if(container) container.innerHTML = '<p class="text-muted">Nenhum produto relacionado encontrado.</p>'; 
        return; 
    }
    
    container.innerHTML = '';
    related.forEach(produto => {
        // Reutiliza a função createProductCard, mas como ela não está aqui,
        // vamos usar um HTML simplificado.
        const isPromo = produto.preco_promocional && produto.preco_promocional < produto.preco;
        const displayPrice = isPromo ? formatPrice(produto.preco_promocional) : formatPrice(produto.preco);

        container.innerHTML += `
            <div class="col">
                <div class="card h-100 product-card shadow-sm">
                    <a href="/produto.html?id=${produto.id_produto}">
                        <img src="${produto.url_imagem}" class="card-img-top" alt="${produto.nome_produto}">
                    </a>
                    <div class="card-body">
                        <h5 class="card-title fs-6">
                            <a href="/produto.html?id=${produto.id_produto}" class="stretched-link text-decoration-none text-dark">${produto.nome_produto}</a>
                        </h5>
                        <p class="card-text price">${displayPrice}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', loadProductDetails);