// js/admin_produtos.js

import { supabase } from '../js/supabaseClient.js';
// Importa o "segurança"
import { checkAdminAuth } from './admin_auth.js'; 

// --- VARIÁVEIS GLOBAIS E ELEMENTOS DO DOM ---
let productModalInstance; 
const productModalElement = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productModalLabel = document.getElementById('productModalLabel');
const editProductIdInput = document.getElementById('editProductId'); 
const saveProductButton = document.getElementById('saveProductButton');
const addProductButton = document.getElementById('add-product-button'); 

// --- FUNÇÕES AUXILIARES ---
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) { return 'Inválido'; }
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function clearProductForm() {
    productForm.reset(); 
    editProductIdInput.value = ''; 
    productModalLabel.textContent = 'Adicionar Novo Produto'; 
    saveProductButton.textContent = 'Salvar Produto';
    saveProductButton.disabled = false;
}

function populateProductForm(produto) {
    if (!produto) return;
    document.getElementById('nome_produto').value = produto.nome_produto || '';
    document.getElementById('preco').value = produto.preco !== null ? produto.preco : '';
    document.getElementById('quantidade_estoque').value = produto.quantidade_estoque !== null ? produto.quantidade_estoque : '';
    document.getElementById('url_imagem').value = produto.url_imagem || '';
    document.getElementById('descricao').value = produto.descricao || '';
    document.getElementById('marca').value = produto.marca || '';
    document.getElementById('tipo_produto').value = produto.tipo_produto || '';
    editProductIdInput.value = produto.id_produto; 
    productModalLabel.textContent = `Editar Produto (ID: ${produto.id_produto})`; 
}

// --- FUNÇÕES CRUD (Create, Read, Update, Delete) ---
async function loadAndDisplayProducts() {
    const tableBody = document.getElementById('product-table-body');
    const loadingRow = document.getElementById('loading-row');
    const noProductsRow = document.getElementById('no-products-row');

    if (!tableBody || !loadingRow || !noProductsRow) { console.error('Erro: Elementos da tabela não encontrados.'); return; }

    loadingRow.style.display = 'table-row';
    noProductsRow.style.display = 'none';
    
    // Limpa linhas antigas
    const existingRows = tableBody.querySelectorAll("tr:not(#loading-row):not(#no-products-row)");
    existingRows.forEach(row => row.remove());

    try {
        let { data: produtos, error } = await supabase
            .from('produtos')
            .select('id_produto, nome_produto, preco, quantidade_estoque, url_imagem, descricao, marca, tipo_produto')
            .order('nome_produto', { ascending: true });

        if (error) { throw error; }
        loadingRow.style.display = 'none';

        if (produtos && produtos.length > 0) {
            produtos.forEach(produto => {
                const rowHtml = `
                    <tr id="product-row-${produto.id_produto}"> <td>${produto.id_produto}</td>
                        <td>${produto.nome_produto || '(Sem nome)'}</td>
                        <td>${formatPrice(produto.preco)}</td>
                        <td>${produto.quantidade_estoque !== null && !isNaN(produto.quantidade_estoque) ? produto.quantidade_estoque : 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning btn-action btn-edit" title="Editar" data-product-id="${produto.id_produto}" data-bs-toggle="modal" data-bs-target="#productModal">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action btn-delete" title="Excluir" data-product-id="${produto.id_produto}">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', rowHtml);
            });
        } else {
            noProductsRow.style.display = 'table-row';
        }

    } catch (error) {
        console.error('Erro ao carregar produtos:', error.message);
        loadingRow.style.display = 'none';
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar produtos: ${error.message}.</td></tr>`;
    }
}

async function fetchProductDetails(productId) {
    try {
        let { data: produto, error } = await supabase
            .from('produtos')
            .select('id_produto, nome_produto, preco, quantidade_estoque, url_imagem, descricao, marca, tipo_produto') 
            .eq('id_produto', productId)
            .single(); 

        if (error) { throw error; }
        return produto; 

    } catch (error) {
        console.error(`Erro ao buscar detalhes do produto ID ${productId}:`, error.message);
        alert(`Não foi possível carregar os dados do produto ID ${productId}. Tente novamente.`);
        return null; 
    }
}

async function addProduct(productData) {
    try {
        // Precisamos de um ID, já que a sua tabela não é 'serial' para id_produto
        // Vamos pegar o ID mais alto e somar 1
        let { data: maxIdData, error: maxIdError } = await supabase
            .from('produtos')
            .select('id_produto')
            .order('id_produto', { descending: true })
            .limit(1)
            .single();
            
        if (maxIdError && maxIdError.code !== 'PGRST116') { // PGRST116 = 0 resultados, o que é ok
             throw new Error('Erro ao buscar último ID: ' + maxIdError.message);
        }

        const nextId = maxIdData ? maxIdData.id_produto + 1 : 1;
        productData.id_produto = nextId; // Adiciona o novo ID ao objeto

        const { data, error } = await supabase
            .from('produtos')
            .insert([productData]) 
            .select(); 

        if (error) { throw error; }
        
        console.log('Produto adicionado:', data);
        alert('Produto adicionado com sucesso!');
        return true; 

    } catch (error) {
        console.error('Erro ao adicionar produto:', error.message);
        alert(`Erro ao adicionar produto: ${error.message}`);
        return false; 
    }
}

async function updateProduct(productId, productData) {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .update(productData) 
            .eq('id_produto', productId) 
            .select(); 

        if (error) { throw error; }

        console.log('Produto atualizado:', data);
        alert('Produto atualizado com sucesso!');
        return true; 

    } catch (error) {
        console.error(`Erro ao atualizar produto ID ${productId}:`, error.message);
        alert(`Erro ao atualizar produto: ${error.message}`);
        return false; 
    }
}

async function deleteProduct(productId) {
    try {
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id_produto', productId); 

        if (error) { throw error; }

        console.log(`Produto ID ${productId} excluído.`);
        alert('Produto excluído com sucesso!');
        return true; 

    } catch (error) {
        console.error(`Erro ao excluir produto ID ${productId}:`, error.message);
        alert(`Erro ao excluir produto: ${error.message}`);
        return false; 
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. ADICIONA O "SEGURANÇA"
    const adminUser = await checkAdminAuth();
    if (!adminUser) return; // Para a execução se não for admin

    // 2. SÓ RODA O CÓDIGO DA PÁGINA SE FOR ADMIN
    console.log("Admin verificado. Carregando produtos...");
    
    if (productModalElement) {
        productModalInstance = new bootstrap.Modal(productModalElement);
    } else {
        console.error("Elemento do Modal #productModal não encontrado.");
    }
    
    loadAndDisplayProducts();
});

if (addProductButton) {
    addProductButton.addEventListener('click', () => {
        clearProductForm(); 
    });
}

document.addEventListener('click', async (event) => {
    const target = event.target;
    const editButton = target.closest('.btn-edit');
    const deleteButton = target.closest('.btn-delete');

    if (editButton) {
        const productId = editButton.dataset.productId;
        clearProductForm(); 
        const productData = await fetchProductDetails(productId); 
        if (productData) {
            populateProductForm(productData); 
        }
        return; 
    }

    if (deleteButton) {
        const productId = deleteButton.dataset.productId;
        const productName = deleteButton.closest('tr').querySelector('td:nth-child(2)').textContent; 
        
        if (confirm(`Tem certeza que deseja EXCLUIR o produto "${productName}" (ID: ${productId})?`)) {
            const success = await deleteProduct(productId); 
            if (success) {
                const rowToRemove = document.getElementById(`product-row-${productId}`);
                if (rowToRemove) {
                    rowToRemove.remove();
                } else {
                    loadAndDisplayProducts(); 
                }
                const tableBody = document.getElementById('product-table-body');
                if (tableBody && tableBody.children.length === 1) { // Só sobrou o <tr> de loading
                    document.getElementById('no-products-row').style.display = 'table-row';
                }
            }
        }
        return;
    }
});

if (productForm) {
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        saveProductButton.disabled = true; 

        const productData = {
            nome_produto: document.getElementById('nome_produto').value.trim(),
            preco: parseFloat(document.getElementById('preco').value) || null,
            quantidade_estoque: parseInt(document.getElementById('quantidade_estoque').value) || 0,
            url_imagem: document.getElementById('url_imagem').value.trim() || null,
            descricao: document.getElementById('descricao').value.trim() || null,
            marca: document.getElementById('marca').value.trim() || null,
            tipo_produto: document.getElementById('tipo_produto').value.trim() || null,
        };

        if (!productData.nome_produto || productData.preco === null || isNaN(productData.preco) || productData.quantidade_estoque === null || isNaN(productData.quantidade_estoque)) {
             alert('Por favor, preencha todos os campos obrigatórios (*).');
             saveProductButton.disabled = false;
             return;
        }

        const editingId = editProductIdInput.value; 

        let success = false;
        if (editingId) {
            saveProductButton.textContent = 'Salvando Alterações...';
            success = await updateProduct(editingId, productData);
        } else {
            saveProductButton.textContent = 'Adicionando Produto...';
            success = await addProduct(productData);
        }

        if (success) {
            productModalInstance.hide(); 
            loadAndDisplayProducts(); 
        } else {
           saveProductButton.disabled = false;
           saveProductButton.textContent = editingId ? 'Salvar Alterações' : 'Salvar Produto';
        }
    });
}

if (productModalElement) {
    productModalElement.addEventListener('hidden.bs.modal', () => {
        clearProductForm();
    });
}