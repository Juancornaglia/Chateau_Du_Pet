// js/admin_horarios.js

import { supabase } from '../js/supabaseClient.js'; // Importa a conexão

// --- VARIÁVEIS GLOBAIS E ELEMENTOS DO DOM ---
const blockDayForm = document.getElementById('blockDayForm');
const capacityManagementContainer = document.getElementById('capacityManagementContainer');
const storesSelectBlockDay = document.getElementById('block-store'); // Select de lojas no form de bloqueio
const blockedDaysList = document.getElementById('blockedDaysList'); // Onde listamos os dias bloqueados
const loadingCapacity = document.getElementById('loadingCapacity');
const loadingBlockedDays = document.getElementById('loadingBlockedDays');

let storesData = []; // Para guardar os dados das lojas carregados
let servicesData = []; // Para guardar os dados dos serviços carregados

// --- FUNÇÕES AUXILIARES ---

// Formata Data (Ex: 26/10/2025)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return 'Data inválida';
    }
}

// --- LÓGICA DE BLOQUEIO DE DIAS ---

// Busca e exibe os dias já bloqueados
async function loadBlockedDays() {
    if (!blockedDaysList || !loadingBlockedDays) return;
    loadingBlockedDays.style.display = 'block';
    blockedDaysList.innerHTML = '';

    try {
        const { data, error } = await supabase
            .from('dias_bloqueados')
            .select(`
                id_bloqueio,
                data_bloqueada,
                motivo,
                lojas ( id_loja, nome_loja )
            `)
            .order('data_bloqueada', { ascending: false }); // Mais recentes primeiro

        if (error) throw error;

        loadingBlockedDays.style.display = 'none';

        if (data && data.length > 0) {
            data.forEach(block => {
                const storeName = block.lojas ? block.lojas.nome_loja : 'Todas as Lojas';
                const listItem = `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${formatDate(block.data_bloqueada)}</strong> - ${storeName}
                            ${block.motivo ? `<br><small class="text-muted">${block.motivo}</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-danger btn-unblock" data-block-id="${block.id_bloqueio}" title="Desbloquear Dia">
                            <i class="bi bi-trash"></i>
                        </button>
                    </li>
                `;
                blockedDaysList.innerHTML += listItem;
            });
        } else {
            blockedDaysList.innerHTML = '<li class="list-group-item text-muted">Nenhum dia bloqueado encontrado.</li>';
        }

    } catch (error) {
        console.error("Erro ao carregar dias bloqueados:", error.message);
        loadingBlockedDays.style.display = 'none';
        blockedDaysList.innerHTML = '<li class="list-group-item text-danger">Erro ao carregar bloqueios.</li>';
    }
}

// Bloqueia um novo dia
async function blockDay(event) {
    event.preventDefault();
    if (!blockDayForm) return;

    const dateInput = document.getElementById('block-date');
    const storeSelect = document.getElementById('block-store');
    const reasonInput = document.getElementById('block-reason'); // Input de motivo adicionado no HTML
    const button = blockDayForm.querySelector('button[type="submit"]');

    const date = dateInput.value;
    const storeId = storeSelect.value === 'ALL' ? null : parseInt(storeSelect.value); // NULL para 'Todas as Lojas'
    const reason = reasonInput.value.trim() || null;

    if (!date) {
        alert('Por favor, selecione uma data para bloquear.');
        return;
    }

    // Validação simples para data no passado (opcional)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera hora para comparar só a data
    const selectedDate = new Date(date + 'T00:00:00');
    if (selectedDate < today) {
         if(!confirm('A data selecionada está no passado. Deseja bloquear mesmo assim?')) {
              return;
         }
    }


    button.disabled = true;
    button.textContent = 'Bloqueando...';

    try {
        const { error } = await supabase
            .from('dias_bloqueados')
            .insert([{
                data_bloqueada: date,
                id_loja: storeId,
                motivo: reason
            }]);

        if (error) {
            // Trata erro de chave única (dia/loja já bloqueado)
            if (error.code === '23505') { // Código de erro do PostgreSQL para unique violation
                 alert(`Erro: A data ${formatDate(date)} já está bloqueada para ${storeId === null ? 'todas as lojas' : storeSelect.options[storeSelect.selectedIndex].text}.`);
            } else {
                throw error;
            }
        } else {
             alert(`Dia ${formatDate(date)} bloqueado com sucesso!`);
             blockDayForm.reset(); // Limpa o formulário
             loadBlockedDays(); // Recarrega a lista de bloqueios
        }

    } catch (error) {
        console.error("Erro ao bloquear dia:", error.message);
        alert(`Erro ao bloquear dia: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = 'Bloquear Dia';
    }
}

// Desbloqueia um dia
async function unblockDay(blockId) {
    if (!blockId) return;

    if (confirm('Tem certeza que deseja desbloquear este dia? Os clientes poderão agendar novamente.')) {
        try {
            const { error } = await supabase
                .from('dias_bloqueados')
                .delete()
                .eq('id_bloqueio', blockId);

            if (error) throw error;

            alert('Dia desbloqueado com sucesso!');
            loadBlockedDays(); // Recarrega a lista

        } catch (error) {
            console.error("Erro ao desbloquear dia:", error.message);
            alert(`Erro ao desbloquear dia: ${error.message}`);
        }
    }
}

// --- LÓGICA DE GESTÃO DE CAPACIDADE ---

// Carrega as regras de capacidade existentes
async function loadCapacityRules() {
    if (!capacityManagementContainer || !loadingCapacity) return;
    loadingCapacity.style.display = 'block';
    capacityManagementContainer.innerHTML = ''; // Limpa antes

    try {
        // Busca todas as regras existentes, juntando nome da loja e serviço
        const { data, error } = await supabase
            .from('servicos_loja_regras')
            .select(`
                id_regra,
                capacidade_simultanea,
                ativo,
                lojas ( id_loja, nome_loja ),
                servicos ( id_servico, nome_servico )
            `)
            .order('lojas(nome_loja)')
            .order('servicos(nome_servico)');

        if (error) throw error;
        loadingCapacity.style.display = 'none';

        if (data && data.length > 0) {
            // Agrupa as regras por loja para melhor visualização
            const rulesByStore = data.reduce((acc, rule) => {
                const storeName = rule.lojas?.nome_loja || 'Loja Desconhecida';
                if (!acc[storeName]) {
                    acc[storeName] = [];
                }
                acc[storeName].push(rule);
                return acc;
            }, {});

            // Cria um card para cada loja
            for (const storeName in rulesByStore) {
                const rules = rulesByStore[storeName];
                let storeCardHtml = `
                    <div class="card mb-3">
                        <div class="card-header">
                            <strong>${storeName}</strong>
                        </div>
                        <ul class="list-group list-group-flush">
                `;

                rules.forEach(rule => {
                    const serviceName = rule.servicos?.nome_servico || 'Serviço Desconhecido';
                    const ruleId = rule.id_regra;
                    const currentCapacity = rule.capacidade_simultanea;
                    const isActive = rule.ativo;

                    storeCardHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${serviceName}</span>
                            <div class="d-flex align-items-center">
                                <label for="capacity-${ruleId}" class="form-label me-2 mb-0 small">Capacidade:</label>
                                <input type="number" min="0" value="${currentCapacity}" id="capacity-${ruleId}" class="form-control form-control-sm me-2 capacity-input" style="width: 70px;" data-rule-id="${ruleId}">
                                <div class="form-check form-switch me-2">
                                  <input class="form-check-input status-switch" type="checkbox" role="switch" id="status-${ruleId}" ${isActive ? 'checked' : ''} data-rule-id="${ruleId}">
                                  <label class="form-check-label small" for="status-${ruleId}">${isActive ? 'Ativo' : 'Inativo'}</label>
                                </div>
                                <button class="btn btn-sm btn-primary btn-save-capacity" data-rule-id="${ruleId}" disabled title="Salvar Alterações">
                                    <i class="bi bi-check-lg"></i>
                                </button>
                            </div>
                        </li>
                    `;
                });

                storeCardHtml += `</ul></div>`;
                capacityManagementContainer.innerHTML += storeCardHtml;
            }

        } else {
             capacityManagementContainer.innerHTML = '<p class="text-muted">Nenhuma regra de capacidade definida. Crie as associações entre lojas e serviços primeiro.</p>';
        }

    } catch (error) {
        console.error("Erro ao carregar regras de capacidade:", error.message);
        loadingCapacity.style.display = 'none';
        capacityManagementContainer.innerHTML = '<p class="text-danger">Erro ao carregar regras de capacidade.</p>';
    }
}

// Salva a alteração de capacidade ou status
async function saveCapacityChange(ruleId, newCapacity, newStatus) {
    if (!ruleId || (newCapacity === null && newStatus === null)) return;

    const dataToUpdate = {};
    if (newCapacity !== null) {
        dataToUpdate.capacidade_simultanea = parseInt(newCapacity);
    }
    if (newStatus !== null) {
        dataToUpdate.ativo = newStatus;
    }

    if (Object.keys(dataToUpdate).length === 0) return; // Nada a atualizar

    // Adiciona feedback visual no botão Salvar
    const saveButton = capacityManagementContainer.querySelector(`.btn-save-capacity[data-rule-id="${ruleId}"]`);
     const originalIcon = '<i class="bi bi-check-lg"></i>';
    if(saveButton){
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        saveButton.disabled = true;
    }


    try {
        const { error } = await supabase
            .from('servicos_loja_regras')
            .update(dataToUpdate)
            .eq('id_regra', ruleId);

        if (error) throw error;

        console.log(`Regra ${ruleId} atualizada com sucesso.`);
        // Feedback visual de sucesso (opcional, pode ser só reabilitar o botão)
        if(saveButton){
             saveButton.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>'; // Ícone de sucesso
             setTimeout(() => {
                 saveButton.innerHTML = originalIcon; // Volta ao normal
                 saveButton.disabled = true; // Desabilita de novo pois já salvou
             }, 1500);
        }
        // Atualiza o texto do label Ativo/Inativo
        if (newStatus !== null) {
            const switchLabel = capacityManagementContainer.querySelector(`label[for="status-${ruleId}"]`);
             if (switchLabel) {
                 switchLabel.textContent = newStatus ? 'Ativo' : 'Inativo';
             }
        }


    } catch (error) {
        console.error("Erro ao salvar alteração de capacidade/status:", error.message);
        alert(`Erro ao salvar: ${error.message}`);
         if(saveButton){
             saveButton.innerHTML = originalIcon; // Volta ao ícone normal em caso de erro
             saveButton.disabled = false; // Permite tentar salvar de novo
        }
    }
}


// --- INICIALIZAÇÃO E EVENT LISTENERS ---

// Função para carregar dados iniciais (lojas, serviços)
async function loadInitialData() {
    try {
        // Carrega Lojas
        const { data: stores, error: storesError } = await supabase.from('loja').select('id_loja, nome_loja').order('nome_loja');
        if (storesError) throw storesError;
        storesData = stores || [];

        // Popula o select de lojas no formulário de bloqueio
        if (storesSelectBlockDay) {
            storesSelectBlockDay.innerHTML = '<option value="ALL">Todas as Lojas</option>'; // Opção padrão
            storesData.forEach(store => {
                storesSelectBlockDay.innerHTML += `<option value="${store.id_loja}">${store.nome_loja}</option>`;
            });
        }

        // Carrega Serviços (necessário para adicionar novas regras no futuro)
        const { data: services, error: servicesError } = await supabase.from('servicos').select('id_servico, nome_servico').order('nome_servico');
        if (servicesError) throw servicesError;
        servicesData = services || [];

        // Agora carrega as regras e bloqueios que dependem das lojas
        loadBlockedDays();
        loadCapacityRules();

    } catch (error) {
        console.error("Erro ao carregar dados iniciais (lojas/serviços):", error.message);
        alert("Erro ao carregar dados essenciais da página. Tente recarregar.");
    }
}

// Listener para o formulário de Bloquear Dia
if (blockDayForm) {
    blockDayForm.addEventListener('submit', blockDay);
}

// Listener para cliques nos botões de Desbloquear (na lista de dias bloqueados)
if (blockedDaysList) {
    blockedDaysList.addEventListener('click', (event) => {
        const unblockButton = event.target.closest('.btn-unblock');
        if (unblockButton) {
            const blockId = unblockButton.dataset.blockId;
            unblockDay(blockId);
        }
    });
}

// Listener para alterações nos inputs de capacidade ou switches de status
if (capacityManagementContainer) {
    capacityManagementContainer.addEventListener('input', (event) => {
        if (event.target.classList.contains('capacity-input')) {
            const ruleId = event.target.dataset.ruleId;
            const saveButton = capacityManagementContainer.querySelector(`.btn-save-capacity[data-rule-id="${ruleId}"]`);
            if (saveButton) saveButton.disabled = false; // Habilita o botão Salvar
        }
    });
    capacityManagementContainer.addEventListener('change', (event) => {
         if (event.target.classList.contains('status-switch')) {
            const ruleId = event.target.dataset.ruleId;
            const saveButton = capacityManagementContainer.querySelector(`.btn-save-capacity[data-rule-id="${ruleId}"]`);
            if (saveButton) saveButton.disabled = false; // Habilita o botão Salvar
        }
    });

    // Listener para cliques nos botões SALVAR de capacidade/status
     capacityManagementContainer.addEventListener('click', (event) => {
        const saveButton = event.target.closest('.btn-save-capacity');
         if (saveButton && !saveButton.disabled) {
             const ruleId = saveButton.dataset.ruleId;
             const capacityInput = capacityManagementContainer.querySelector(`#capacity-${ruleId}`);
             const statusSwitch = capacityManagementContainer.querySelector(`#status-${ruleId}`);

             const newCapacity = capacityInput ? parseInt(capacityInput.value) : null;
             const newStatus = statusSwitch ? statusSwitch.checked : null;

             if (newCapacity !== null && (isNaN(newCapacity) || newCapacity < 0)) {
                 alert("A capacidade deve ser um número igual ou maior que zero.");
                 return;
             }

             saveCapacityChange(ruleId, newCapacity, newStatus);
         }
     });
}


// --- INICIALIZAÇÃO GERAL ---
document.addEventListener('DOMContentLoaded', loadInitialData);