// js/admin_produtos.js

import { supabase } from '../js/supabaseClient.js'; // Importa a conexão

// --- VARIÁVEIS GLOBAIS E ELEMENTOS DO DOM ---
let productModalInstance; // Instância do Modal do Bootstrap
const productModalElement = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productModalLabel = document.getElementById('productModalLabel');
const editProductIdInput = document.getElementById('editProductId'); // Input hidden para ID
const saveProductButton = document.getElementById('saveProductButton');
const addProductButton = document.getElementById('add-product-button'); // Botão principal "Adicionar"

// --- FUNÇÕES AUXILIARES ---

// Formata o preço para Reais (BRL)
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) { return 'Inválido'; }
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Limpa os campos do formulário no modal
function clearProductForm() {
    productForm.reset(); // Limpa todos os inputs
    editProductIdInput.value = ''; // Limpa o ID oculto
    productModalLabel.textContent = 'Adicionar Novo Produto'; // Reseta o título
    saveProductButton.textContent = 'Salvar Produto';
    saveProductButton.disabled = false;
}

// Preenche o formulário do modal com dados de um produto (para edição)
function populateProductForm(produto) {
    if (!produto) return;
    document.getElementById('nome_produto').value = produto.nome_produto || '';
    document.getElementById('preco').value = produto.preco !== null ? produto.preco : '';
    document.getElementById('quantidade_estoque').value = produto.quantidade_estoque !== null ? produto.quantidade_estoque : '';
    document.getElementById('url_imagem').value = produto.url_imagem || '';
    document.getElementById('descricao').value = produto.descricao || '';
    document.getElementById('marca').value = produto.marca || '';
    document.getElementById('tipo_produto').value = produto.tipo_produto || '';
    // Preencha outros campos aqui se os adicionou no modal
    editProductIdInput.value = produto.id_produto; // Guarda o ID no campo oculto
    productModalLabel.textContent = `Editar Produto (ID: ${produto.id_produto})`; // Atualiza título
}

// --- FUNÇÕES CRUD (Create, Read, Update, Delete) ---

// READ: Busca e exibe todos os produtos na tabela
async function loadAndDisplayProducts() {
    const tableBody = document.getElementById('product-table-body');
    const loadingRow = document.getElementById('loading-row');
    const noProductsRow = document.getElementById('no-products-row');

    if (!tableBody || !loadingRow || !noProductsRow) { console.error('Erro: Elementos da tabela não encontrados.'); return; }

    loadingRow.style.display = 'table-row';
    noProductsRow.style.display = 'none';
    tableBody.innerHTML = ''; // Limpa antes de carregar

    try {
        // Busca incluindo mais colunas para a edição
        let { data: produtos, error } = await supabase
            .from('produtos')
            .select('id_produto, nome_produto, preco, quantidade_estoque, url_imagem, descricao, marca, tipo_produto') // Adicione mais colunas se precisar editar
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
                tableBody.innerHTML += rowHtml;
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

// READ (Single): Busca detalhes de um produto específico para edição
async function fetchProductDetails(productId) {
    try {
        let { data: produto, error } = await supabase
            .from('produtos')
            .select('id_produto, nome_produto, preco, quantidade_estoque, url_imagem, descricao, marca, tipo_produto') // Colunas do formulário
            .eq('id_produto', productId)
            .single(); // Espera apenas um resultado

        if (error) { throw error; }
        return produto; // Retorna os dados do produto

    } catch (error) {
        console.error(`Erro ao buscar detalhes do produto ID ${productId}:`, error.message);
        alert(`Não foi possível carregar os dados do produto ID ${productId}. Tente novamente.`);
        return null; // Retorna nulo em caso de erro
    }
}

// CREATE: Adiciona um novo produto ao banco
async function addProduct(productData) {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .insert([productData]) // Insere o objeto com os dados
            .select(); // Retorna os dados inseridos

        if (error) { throw error; }
        
        console.log('Produto adicionado:', data);
        alert('Produto adicionado com sucesso!');
        return true; // Indica sucesso

    } catch (error) {
        console.error('Erro ao adicionar produto:', error.message);
        alert(`Erro ao adicionar produto: ${error.message}`);
        return false; // Indica falha
    }
}

// UPDATE: Atualiza um produto existente no banco
async function updateProduct(productId, productData) {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .update(productData) // Atualiza com os novos dados
            .eq('id_produto', productId) // Onde o ID corresponde
            .select(); // Retorna os dados atualizados

        if (error) { throw error; }

        console.log('Produto atualizado:', data);
        alert('Produto atualizado com sucesso!');
        return true; // Indica sucesso

    } catch (error) {
        console.error(`Erro ao atualizar produto ID ${productId}:`, error.message);
        alert(`Erro ao atualizar produto: ${error.message}`);
        return false; // Indica falha
    }
}

// DELETE: Remove um produto do banco
async function deleteProduct(productId) {
    try {
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('id_produto', productId); // Onde o ID corresponde

        if (error) { throw error; }

        console.log(`Produto ID ${productId} excluído.`);
        alert('Produto excluído com sucesso!');
        return true; // Indica sucesso

    } catch (error) {
        console.error(`Erro ao excluir produto ID ${productId}:`, error.message);
        alert(`Erro ao excluir produto: ${error.message}`);
        return false; // Indica falha
    }
}


// --- EVENT LISTENERS ---

// Inicializa a instância do Modal do Bootstrap quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
    if (productModalElement) {
        productModalInstance = new bootstrap.Modal(productModalElement);
    } else {
        console.error("Elemento do Modal #productModal não encontrado.");
    }
    
    // Carrega a lista inicial de produtos
    loadAndDisplayProducts();
});

// Listener para o botão principal "Adicionar Novo Produto"
if (addProductButton) {
    addProductButton.addEventListener('click', () => {
        clearProductForm(); // Limpa o formulário para garantir que está no modo "Adicionar"
        // O modal abre automaticamente via atributos data-bs-*
    });
}

// Listener para cliques nos botões dentro da tabela (Editar, Excluir)
document.addEventListener('click', async (event) => {
    const target = event.target;
    const editButton = target.closest('.btn-edit');
    const deleteButton = target.closest('.btn-delete');

    // Se clicou em EDITAR
    if (editButton) {
        const productId = editButton.dataset.productId;
        console.log(`Abrindo modal para editar produto ID: ${productId}`);
        clearProductForm(); // Limpa antes de preencher
        const productData = await fetchProductDetails(productId); // Busca dados no Supabase
        if (productData) {
            populateProductForm(productData); // Preenche o formulário
            // O modal abre via atributos data-bs-*, não precisa chamar productModalInstance.show()
        }
        return; 
    }

    // Se clicou em EXCLUIR
    if (deleteButton) {
        const productId = deleteButton.dataset.productId;
        const productName = deleteButton.closest('tr').querySelector('td:nth-child(2)').textContent; // Pega o nome da linha
        
        if (confirm(`Tem certeza que deseja EXCLUIR o produto "${productName}" (ID: ${productId})?`)) {
            const success = await deleteProduct(productId); // Chama a função de exclusão
            if (success) {
                // Remove a linha da tabela visualmente sem recarregar tudo
                const rowToRemove = document.getElementById(`product-row-${productId}`);
                if (rowToRemove) {
                    rowToRemove.remove();
                } else {
                    // Se não conseguir remover a linha, recarrega a lista
                    loadAndDisplayProducts(); 
                }
                // Verifica se a tabela ficou vazia
                const tableBody = document.getElementById('product-table-body');
                if (tableBody && tableBody.children.length === 0) {
                     document.getElementById('no-products-row').style.display = 'table-row';
                }
            }
        }
        return;
    }
});

// Listener para o ENVIO do formulário do modal (Adicionar ou Salvar Edição)
if (productForm) {
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o envio padrão HTML
        saveProductButton.disabled = true; // Desabilita o botão

        // Pega os dados do formulário
        const productData = {
            nome_produto: document.getElementById('nome_produto').value.trim(),
            preco: parseFloat(document.getElementById('preco').value) || null,
            quantidade_estoque: parseInt(document.getElementById('quantidade_estoque').value) || 0,
            url_imagem: document.getElementById('url_imagem').value.trim() || null,
            descricao: document.getElementById('descricao').value.trim() || null,
            marca: document.getElementById('marca').value.trim() || null,
            tipo_produto: document.getElementById('tipo_produto').value.trim() || null,
            // Adicione outros campos aqui se necessário
        };

        // Verifica campos obrigatórios
        if (!productData.nome_produto || productData.preco === null || isNaN(productData.preco) || productData.quantidade_estoque === null || isNaN(productData.quantidade_estoque)) {
             alert('Por favor, preencha todos os campos obrigatórios (*).');
             saveProductButton.disabled = false;
             return;
        }

        const editingId = editProductIdInput.value; // Pega o ID (se estiver editando)

        let success = false;
        if (editingId) {
            // --- MODO EDIÇÃO ---
            saveProductButton.textContent = 'Salvando Alterações...';
            console.log(`Atualizando produto ID ${editingId} com dados:`, productData);
            success = await updateProduct(editingId, productData);
        } else {
            // --- MODO ADIÇÃO ---
            saveProductButton.textContent = 'Adicionando Produto...';
            console.log("Adicionando novo produto com dados:", productData);
             // IMPORTANTE: Se o seu id_produto não for gerado automaticamente pelo banco,
             // você precisará definir um ID aqui antes de inserir.
             // Ex: productData.id_produto = await getNextProductId();
            success = await addProduct(productData);
        }

        // Se a operação foi bem-sucedida
        if (success) {
            productModalInstance.hide(); // Fecha o modal
            loadAndDisplayProducts(); // Recarrega a lista de produtos na tabela
        } else {
            // Reabilita o botão em caso de erro
           saveProductButton.disabled = false;
           saveProductButton.textContent = editingId ? 'Salvar Alterações' : 'Salvar Produto';
        }
    });
}

// Limpa o formulário quando o modal é fechado (opcional, mas bom para UX)
if (productModalElement) {
    productModalElement.addEventListener('hidden.bs.modal', () => {
        clearProductForm();
    });
}