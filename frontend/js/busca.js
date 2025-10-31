import { supabase } from './supabaseClient.js';

const resultsContainer = document.getElementById('search-results-container');
const searchTermDisplay = document.getElementById('search-term-display');
const loadingMessage = document.getElementById('loading-message');
const resultsCount = document.getElementById('results-count');
const searchInputBar = document.getElementById('search-input-bar');
const categoryFiltersContainer = document.getElementById('category-filters');
const brandFiltersContainer = document.getElementById('brand-filters');
const filtersContainer = document.getElementById('filters-container');

function formatPrice(price) {
    if (typeof price !== 'number') return 'Preço a consultar';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function populateFilters() {
    if (!categoryFiltersContainer || !brandFiltersContainer) return;
    const { data: categorias, error: catError } = await supabase.from('produtos').select('tipo_produto');
    const { data: marcas, error: brandError } = await supabase.from('produtos').select('marca');
    if (catError || brandError) { console.error('Erro ao buscar filtros:', catError || brandError); return; }
    const uniqueCategorias = [...new Set(categorias.map(item => item.tipo_produto).filter(Boolean))];
    uniqueCategorias.sort().forEach(cat => { categoryFiltersContainer.innerHTML += `<div class="form-check"><input class="form-check-input filter-checkbox" type="checkbox" value="${cat}" id="cat-${cat}"><label class="form-check-label" for="cat-${cat}">${cat}</label></div>`; });
    const uniqueMarcas = [...new Set(marcas.map(item => item.marca).filter(Boolean))];
    uniqueMarcas.sort().forEach(marca => { brandFiltersContainer.innerHTML += `<div class="form-check"><input class="form-check-input filter-checkbox" type="checkbox" value="${marca}" id="brand-${marca}"><label class="form-check-label" for="brand-${marca}">${marca}</label></div>`; });
}

async function performSearch() {
    loadingMessage.style.display = 'block';
    resultsContainer.innerHTML = '';
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q');
    searchTermDisplay.textContent = searchTerm || 'Todos os produtos';
    if(searchInputBar) searchInputBar.value = searchTerm;
    const selectedCategories = Array.from(categoryFiltersContainer.querySelectorAll('input:checked')).map(input => input.value);
    const selectedBrands = Array.from(brandFiltersContainer.querySelectorAll('input:checked')).map(input => input.value);
    let query = supabase.from('produtos').select('*');
    if (searchTerm) { query = query.or(`nome_produto.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`); }
    if (selectedCategories.length > 0) { query = query.in('tipo_produto', selectedCategories); }
    if (selectedBrands.length > 0) { query = query.in('marca', selectedBrands); }
    const { data: produtos, error } = await query;
    loadingMessage.style.display = 'none';
    if (error) { console.error('Erro ao buscar produtos:', error); resultsContainer.innerHTML = `<p class="text-danger">Erro ao buscar produtos.</p>`; return; }
    resultsCount.textContent = `${produtos.length} produtos encontrados`;

    if (produtos.length === 0) {
        resultsContainer.innerHTML = '<h3 class="col-12">Nenhum resultado encontrado para sua busca.</h3>';
    } else {
        produtos.forEach(produto => {
            // CORREÇÃO: Caminhos dos links ajustados
            const cardHtml = `
                <div class="col">
                    <div class="card h-100 product-card shadow-sm">
                        <img src="${produto.url_imagem}" class="card-img-top" alt="${produto.nome_produto}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title flex-grow-1">
                                <a href="/produto.html?id=${produto.id_produto}" class="stretched-link text-decoration-none text-dark">
                                    ${produto.nome_produto}
                                </a>
                            </h5>
                            <p class="card-text price fs-4 fw-bold main-purple-text">${formatPrice(produto.preco)}</p>
                            <a href="/ecommerce/carrinho.html?id=${produto.id_produto}" class="btn btn-custom w-100 mt-2 position-relative">Adicionar ao Carrinho</a>
                        </div>
                    </div>
                </div>
            `;
            resultsContainer.innerHTML += cardHtml;
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await populateFilters();
    await performSearch();
    if (filtersContainer) {
        filtersContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('filter-checkbox')) {
                performSearch();
            }
        });
    }
});