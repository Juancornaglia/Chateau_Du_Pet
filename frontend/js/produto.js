import { supabase } from './supabaseClient.js';

function formatPrice(price) { if (typeof price !== 'number') return 'Preço a consultar'; return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

async function loadProductDetails() {
    const container = document.getElementById('product-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) { container.innerHTML = '<h1>Produto não encontrado.</h1>'; return; }
    const { data: produto, error } = await supabase.from('produtos').select('*').eq('id_produto', productId).single();
    if (error || !produto) { console.error('Erro ao buscar produto:', error); container.innerHTML = '<h1>Produto não encontrado.</h1>'; return; }
    
    document.title = produto.nome_produto;
    let priceHtml = `<p class="fs-2 fw-bold main-purple-text mb-1">${formatPrice(produto.preco)}</p>`;
    if (produto.preco_promocional && produto.preco_promocional < produto.preco) { priceHtml = `<p class="price-original mb-0">${formatPrice(produto.preco)}</p><p class="fs-2 fw-bold main-purple-text mb-1">${formatPrice(produto.preco_promocional)}</p>`; }
    
    container.innerHTML = `
        <div class="col-md-6 text-center"><img src="${produto.url_imagem}" class="img-fluid rounded shadow-sm" alt="${produto.nome_produto}"></div>
        <div class="col-md-6">
            <h1 class="product-title">${produto.nome_produto}</h1><p class="text-muted">Marca: ${produto.marca || 'Não informado'} | Código: ${produto.id_produto}</p>
            ${priceHtml}
            <div class="my-4"><label for="quantity" class="form-label">Quantidade:</label><div class="input-group quantity-selector"><button class="btn btn-outline-secondary" type="button" id="decrease-qty">-</button><input type="text" class="form-control text-center" value="1" id="quantity" readonly><button class="btn btn-outline-secondary" type="button" id="increase-qty">+</button></div></div>
            <div class="d-grid gap-2"><a href="/ecommerce/carrinho.html?id=${produto.id_produto}" class="btn btn-custom btn-lg">Adicionar ao Carrinho</a></div>
        </div>
    `;

    const accordionContainer = document.getElementById('product-info-accordion');
    accordionContainer.innerHTML = `
        <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">Detalhes</button></h2><div id="collapseOne" class="accordion-collapse collapse show"><div class="accordion-body">${produto.descricao || 'Sem descrição.'}</div></div></div>
        <div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">Ficha Técnica</button></h2><div id="collapseTwo" class="accordion-collapse collapse"><div class="accordion-body"><ul class="list-group list-group-flush"><li class="list-group-item"><strong>Marca:</strong> ${produto.marca || 'N/A'}</li><li class="list-group-item"><strong>Categoria:</strong> ${produto.tipo_produto || 'N/A'}</li></ul></div></div></div>
    `;
    
    addQuantityControls();
    loadRelatedProducts(produto.tipo_produto, produto.id_produto);
}

function addQuantityControls() {
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const quantityInput = document.getElementById('quantity');
    if(decreaseBtn) decreaseBtn.addEventListener('click', () => { let val = parseInt(quantityInput.value); if (val > 1) quantityInput.value = val - 1; });
    if(increaseBtn) increaseBtn.addEventListener('click', () => { let val = parseInt(quantityInput.value); quantityInput.value = val + 1; });
}

async function loadRelatedProducts(tipo_produto, currentProductId) {
    const container = document.getElementById('related-products-container');
    if (!tipo_produto) { if(container) container.style.display = 'none'; return; }
    const { data: related, error } = await supabase.from('produtos').select('*').eq('tipo_produto', tipo_produto).not('id_produto', 'eq', currentProductId).limit(4);
    if (error || !related || related.length === 0) { if(container) container.style.display = 'none'; return; }
    container.innerHTML = '';
    related.forEach(produto => {
        container.innerHTML += `<div class="col"><div class="card h-100 product-card shadow-sm"><a href="/produto.html?id=${produto.id_produto}"><img src="${produto.url_imagem}" class="card-img-top" alt="${produto.nome_produto}"></a><div class="card-body"><h5 class="card-title fs-6"><a href="/produto.html?id=${produto.id_produto}" class="stretched-link text-decoration-none text-dark">${produto.nome_produto}</a></h5><p class="card-text price">${formatPrice(produto.preco)}</p></div></div></div>`;
    });
}

document.addEventListener('DOMContentLoaded', loadProductDetails);