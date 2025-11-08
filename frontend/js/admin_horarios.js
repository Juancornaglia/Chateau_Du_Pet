// js/admin_horarios.js
// VERSÃO REESCRITA: Segurança desativado e import corrigido

// CORRIGIDO: O caminho deve ser './'
import { supabase } from './supabaseClient.js';
// DESATIVADO:
// import { checkAdminAuth } from './admin_auth.js'; // IMPORTA O SEGURANÇA

// --- ELEMENTOS DO DOM ---
const blockDayForm = document.getElementById('blockDayForm');
const capacityManagementContainer = document.getElementById('capacityManagementContainer');
const storesSelectBlockDay = document.getElementById('block-store');
const blockedDaysList = document.getElementById('blockedDaysList');
const loadingCapacity = document.getElementById('loadingCapacity');
const loadingBlockedDays = document.getElementById('loadingBlockedDays');

let storesData = [];
let servicesData = []; 

// --- FUNÇÕES AUXILIARES ---
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00'); // Evita problemas de fuso
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return 'Data inválida';
    }
}

// --- LÓGICA DE BLOQUEIO ---
async function loadBlockedDays() {
    if (!blockedDaysList || !loadingBlockedDays) return;
    loadingBlockedDays.style.display = 'block';
    blockedDaysList.innerHTML = '';
    try {
        const { data, error } = await supabase
            .from('dias_bloqueados')
            .select(`*, lojas(nome_loja)`)
            .order('data_bloqueada', { ascending: false });
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
                    </li>`;
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

async function blockDay(event) {
    event.preventDefault();
    const dateInput = document.getElementById('block-date');
    const storeSelect = document.getElementById('block-store');
    const reasonInput = document.getElementById('block-reason');
    const button = blockDayForm.querySelector('button[type="submit"]');
    const date = dateInput.value;
    const storeId = storeSelect.value === 'ALL' ? null : parseInt(storeSelect.value);
    const reason = reasonInput.value.trim() || null;
    if (!date) { alert('Selecione uma data.'); return; }
    button.disabled = true;
    button.textContent = 'Bloqueando...';
    try {
        const { error } = await supabase.from('dias_bloqueados').insert([{ data_bloqueada: date, id_loja: storeId, motivo: reason }]);
        if (error) {
            if (error.code === '23505') { alert(`Erro: Este dia já está bloqueado para esta loja.`); }
            else { throw error; }
        } else {
            alert(`Dia bloqueado com sucesso!`);
            blockDayForm.reset(); 
            loadBlockedDays(); 
        }
    } catch (error) {
        alert(`Erro ao bloquear dia: ${error.message}`);
    } finally {
        button.disabled = false;
        button.textContent = 'Bloquear Dia';
    }
}

async function unblockDay(blockId) {
    if (confirm('Tem certeza que deseja desbloquear este dia?')) {
        try {
            const { error } = await supabase.from('dias_bloqueados').delete().eq('id_bloqueio', blockId);
            if (error) throw error;
            alert('Dia desbloqueado!');
            loadBlockedDays(); 
        } catch (error) {
            alert(`Erro ao desbloquear dia: ${error.message}`);
        }
    }
}

// --- LÓGICA DE CAPACIDADE ---
async function loadCapacityRules() {
    if (!capacityManagementContainer || !loadingCapacity) return;
    loadingCapacity.style.display = 'block';
    capacityManagementContainer.innerHTML = ''; 
    try {
        const { data, error } = await supabase
            .from('servicos_loja_regras')
            .select(`*, lojas(nome_loja), servicos(nome_servico)`)
            .order('lojas(nome_loja)').order('servicos(nome_servico)');
        if (error) throw error;
        loadingCapacity.style.display = 'none';
        if (data && data.length > 0) {
            const rulesByStore = data.reduce((acc, rule) => {
                const storeName = rule.lojas?.nome_loja || 'Loja Desconhecida';
                if (!acc[storeName]) { acc[storeName] = []; }
                acc[storeName].push(rule);
                return acc;
            }, {});
            for (const storeName in rulesByStore) {
                const rules = rulesByStore[storeName];
                let storeCardHtml = `<div class="card mb-3"><div class="card-header"><strong>${storeName}</strong></div><ul class="list-group list-group-flush">`;
                rules.forEach(rule => {
                    storeCardHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${rule.servicos?.nome_servico || 'Serviço Desconhecido'}</span>
                            <div class="d-flex align-items-center">
                                <label for="capacity-${rule.id_regra}" class="form-label me-2 mb-0 small">Capacidade:</label>
                                <input type="number" min="0" value="${rule.capacidade_simultanea}" id="capacity-${rule.id_regra}" class="form-control form-control-sm me-2 capacity-input" style="width: 70px;" data-rule-id="${rule.id_regra}">
                                <div class="form-check form-switch me-2">
                                    <input class="form-check-input status-switch" type="checkbox" role="switch" id="status-${rule.id_regra}" ${rule.ativo ? 'checked' : ''} data-rule-id="${rule.id_regra}">
                                    <label class="form-check-label small" for="status-${rule.id_regra}">${rule.ativo ? 'Ativo' : 'Inativo'}</label>
                                </div>
                                <button class="btn btn-sm btn-primary btn-save-capacity" data-rule-id="${rule.id_regra}" disabled title="Salvar Alterações"><i class="bi bi-check-lg"></i></button>
                            </div>
                        </li>`;
                });
                storeCardHtml += `</ul></div>`;
                capacityManagementContainer.innerHTML += storeCardHtml;
            }
        } else {
             capacityManagementContainer.innerHTML = '<p class="text-muted">Nenhuma regra de capacidade definida.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar regras:", error.message);
        loadingCapacity.style.display = 'none';
        capacityManagementContainer.innerHTML = '<p class="text-danger">Erro ao carregar regras.</p>';
    }
}

async function saveCapacityChange(ruleId, newCapacity, newStatus) {
    const dataToUpdate = {};
    if (newCapacity !== null) { dataToUpdate.capacidade_simultanea = parseInt(newCapacity); }
    if (newStatus !== null) { dataToUpdate.ativo = newStatus; }
    if (Object.keys(dataToUpdate).length === 0) return; 

    const saveButton = capacityManagementContainer.querySelector(`.btn-save-capacity[data-rule-id="${ruleId}"]`);
    const originalIcon = '<i class="bi bi-check-lg"></i>';
    if(saveButton){ saveButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; saveButton.disabled = true; }
    try {
        const { error } = await supabase.from('servicos_loja_regras').update(dataToUpdate).eq('id_regra', ruleId);
        if (error) throw error;
        if(saveButton){
             saveButton.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>'; 
             setTimeout(() => { saveButton.innerHTML = originalIcon; saveButton.disabled = true; }, 1500);
        }
        if (newStatus !== null) {
            const switchLabel = capacityManagementContainer.querySelector(`label[for="status-${ruleId}"]`);
            if (switchLabel) { switchLabel.textContent = newStatus ? 'Ativo' : 'Inativo'; }
        }
    } catch (error) {
        alert(`Erro ao salvar: ${error.message}`);
         if(saveButton){ saveButton.innerHTML = originalIcon; saveButton.disabled = false; }
    }
}

// --- INICIALIZAÇÃO ---
async function loadInitialData() {
    try {
        const { data: stores, error: storesError } = await supabase.from('lojas').select('id_loja, nome_loja').order('nome_loja');
        if (storesError) throw storesError;
        storesData = stores || [];
        if (storesSelectBlockDay) {
            storesSelectBlockDay.innerHTML = '<option value="ALL">Todas as Lojas</option>'; 
            storesData.forEach(store => {
                storesSelectBlockDay.innerHTML += `<option value="${store.id_loja}">${store.nome_loja}</option>`;
            });
        }
        loadBlockedDays();
        loadCapacityRules();
    } catch (error) {
        alert("Erro ao carregar dados essenciais da página. Tente recarregar.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. "SEGURANÇA" DESATIVADO
    // const adminUser = await checkAdminAuth();
    // if (!adminUser) return; // Para

    // 2. SÓ CARREGA OS DADOS E LISTENERS
    console.log("Admin (modo teste). Carregando dados de horários...");
    loadInitialData();

    if (blockDayForm) {
        blockDayForm.addEventListener('submit', blockDay);
    }

    if (blockedDaysList) {
        blockedDaysList.addEventListener('click', (event) => {
            const unblockButton = event.target.closest('.btn-unblock');
            if (unblockButton) { unblockDay(unblockButton.dataset.blockId); }
        });
    }

    if (capacityManagementContainer) {
        capacityManagementContainer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.classList.contains('capacity-input') || target.classList.contains('status-switch')) {
                const ruleId = target.dataset.ruleId;
                const saveButton = capacityManagementContainer.querySelector(`.btn-save-capacity[data-rule-id="${ruleId}"]`);
                if (saveButton) saveButton.disabled = false;
            }
        });

         capacityManagementContainer.addEventListener('click', (event) => {
             const saveButton = event.target.closest('.btn-save-capacity');
             if (saveButton && !saveButton.disabled) {
                 const ruleId = saveButton.dataset.ruleId;
                 const capacityInput = capacityManagementContainer.querySelector(`#capacity-${ruleId}`);
                 const statusSwitch = capacityManagementContainer.querySelector(`#status-${ruleId}`);
                 const newCapacity = capacityInput ? parseInt(capacityInput.value) : null;
                 const newStatus = statusSwitch ? statusSwitch.checked : null;
                 saveCapacityChange(ruleId, newCapacity, newStatus);
             }
         });
    }
});