// js/admin_agendamentos.js

import { supabase } from '../js/supabaseClient.js';
// Importa o "segurança"
import { checkAdminAuth } from './admin_auth.js'; 

// --- FUNÇÕES AUXILIARES ---
// (O código formatDateTime e getStatusBadge continua o mesmo)
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return 'Data inválida'; }
}

function getStatusBadge(status) {
    status = status ? status.toLowerCase() : 'desconhecido';
    switch (status) {
        case 'confirmado': return '<span class="badge bg-success">Confirmado</span>';
        case 'pendente': return '<span class="badge bg-warning text-dark">Pendente</span>';
        case 'cancelado': return '<span class="badge bg-danger">Cancelado</span>';
        case 'finalizado': return '<span class="badge bg-secondary">Finalizado</span>';
        default: return `<span class="badge bg-light text-dark">${status}</span>`;
    }
}

// --- LÓGICA PRINCIPAL ---
async function loadAndDisplayAppointments() {
    const tableBody = document.getElementById('appointments-table-body');
    const loadingRow = document.getElementById('loading-row-appointments');
    const noAppointmentsRow = document.getElementById('no-appointments-row');

    if (!tableBody || !loadingRow || !noAppointmentsRow) {
        console.error('Erro: Elementos da tabela de agendamentos não encontrados.');
        if(tableBody) tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erro interno na página.</td></tr>`;
        return;
    }

    loadingRow.style.display = 'table-row';
    noAppointmentsRow.style.display = 'none';
    
    // Limpa apenas as linhas de dados, mantendo a linha de loading
    const existingRows = tableBody.querySelectorAll("tr:not(#loading-row-appointments):not(#no-appointments-row)");
    existingRows.forEach(row => row.remove());

    try {
        let { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select(`
                id_agendamento, data_hora_inicio, status, observacoes_cliente,
                perfis ( nome_completo ),
                pets ( nome_pet ),
                servicos ( nome_servico ),
                lojas ( nome_loja )
            `)
            .order('data_hora_inicio', { ascending: false }); 

        if (error) { throw error; }

        loadingRow.style.display = 'none';

        if (agendamentos && agendamentos.length > 0) {
            agendamentos.forEach(ag => {
                const nomeCliente = ag.perfis?.nome_completo || 'Cliente não encontrado';
                const nomePet = ag.pets?.nome_pet || 'Pet não encontrado';
                const nomeServico = ag.servicos?.nome_servico || 'Serviço não encontrado';
                const nomeLoja = ag.lojas?.nome_loja || 'Loja não encontrada';

                const rowHtml = `
                    <tr id="appointment-row-${ag.id_agendamento}">
                        <td>${nomeCliente}</td>
                        <td>${nomePet}</td>
                        <td>${nomeServico}</td>
                        <td>${nomeLoja}</td>
                        <td>${formatDateTime(ag.data_hora_inicio)}</td>
                        <td>${getStatusBadge(ag.status)}</td>
                        <td>
                            <button class="btn btn-sm btn-info btn-action btn-view" title="Ver Detalhes" data-appointment-id="${ag.id_agendamento}" data-bs-toggle="modal" data-bs-target="#appointmentDetailModal">
                                <i class="bi bi-eye-fill"></i>
                            </button>
                            <button class="btn btn-sm btn-warning btn-action btn-edit-status" title="Alterar Status" data-appointment-id="${ag.id_agendamento}">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action btn-cancel" title="Cancelar Agendamento" data-appointment-id="${ag.id_agendamento}" ${ag.status === 'cancelado' || ag.status === 'finalizado' ? 'disabled' : ''}>
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', rowHtml); // Usa insertAdjacentHTML para adicionar
            });
        } else {
            noAppointmentsRow.style.display = 'table-row';
        }

    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error.message);
        loadingRow.style.display = 'none';
        noAppointmentsRow.style.display = 'none';
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erro ao carregar agendamentos: ${error.message}. Verifique o console.</td></tr>`;
    }
}


// --- FUNÇÕES PARA AÇÕES (Ver, Alterar Status, Cancelar) ---
async function showAppointmentDetails(appointmentId) {
    const modalBody = document.getElementById('appointmentDetailModalBody');
    if(!modalBody) return;
    
    modalBody.innerHTML = `<p class="text-center"><span class="spinner-border spinner-border-sm"></span> Carregando detalhes...</p>`;

    try {
        let { data: ag, error } = await supabase
            .from('agendamentos')
            .select(`*, perfis(*), pets(*), servicos(*), lojas(*)`) // Busca tudo
            .eq('id_agendamento', appointmentId)
            .single();
        if (error) throw error;
        
        if (ag) {
             modalBody.innerHTML = `
                 <p><strong>Cliente:</strong> ${ag.perfis?.nome_completo || 'N/A'} (Tel: ${ag.perfis?.telefone || 'N/A'})</p>
                 <p><strong>Pet:</strong> ${ag.pets?.nome_pet || 'N/A'} (Espécie: ${ag.pets?.especie || 'N/A'}, Raça: ${ag.pets?.raca || 'N/A'})</p>
                 <p><strong>Serviço:</strong> ${ag.servicos?.nome_servico || 'N/A'}</p>
                 <p><strong>Loja:</strong> ${ag.lojas?.nome_loja || 'N/A'}</p>
                 <p><strong>Data/Hora:</strong> ${formatDateTime(ag.data_hora_inicio)}</p>
                 <p><strong>Status Atual:</strong> ${getStatusBadge(ag.status)}</p>
                 <p><strong>Observações Cliente:</strong> ${ag.observacoes_cliente || 'Nenhuma'}</p>
             `;
        } else {
             modalBody.innerHTML = `<p class="text-danger">Agendamento não encontrado.</p>`;
        }
    } catch (error) {
         modalBody.innerHTML = `<p class="text-danger">Erro ao buscar detalhes: ${error.message}</p>`;
    }
}

async function changeAppointmentStatus(appointmentId) {
    console.log(`Alterar status do agendamento ID: ${appointmentId}`);
    const newStatus = prompt(`Digite o novo status para o agendamento ${appointmentId} (Ex: confirmado, finalizado, cancelado):`);

    if (newStatus && ['confirmado', 'finalizado', 'cancelado', 'pendente'].includes(newStatus.toLowerCase())) {
        try {
            const { data, error } = await supabase
                .from('agendamentos')
                .update({ status: newStatus.toLowerCase() })
                .eq('id_agendamento', appointmentId)
                .select(); 

            if (error) throw error;

            alert('Status atualizado com sucesso!');
            const row = document.getElementById(`appointment-row-${appointmentId}`);
            if (row) {
                const statusCell = row.querySelector('td:nth-child(6)'); 
                if (statusCell) {
                    statusCell.innerHTML = getStatusBadge(newStatus);
                }
                const cancelButton = row.querySelector('.btn-cancel');
                 if(cancelButton){
                     cancelButton.disabled = (newStatus.toLowerCase() === 'cancelado' || newStatus.toLowerCase() === 'finalizado');
                 }
            } else {
                loadAndDisplayAppointments(); 
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error.message);
            alert(`Erro ao atualizar status: ${error.message}`);
        }
    } else if (newStatus !== null) { 
        alert('Status inválido. Use: confirmado, finalizado, cancelado ou pendente.');
    }
}

async function cancelAppointment(appointmentId) {
    console.log(`Cancelar agendamento ID: ${appointmentId}`);
    if (confirm(`Tem certeza que deseja CANCELAR o agendamento ID ${appointmentId}?`)) {
        // Corrigido: Para cancelar, o status deve ser 'cancelado'
        await changeAppointmentStatus(appointmentId, 'cancelado'); 
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('click', (event) => {
    const target = event.target;
    const viewButton = target.closest('.btn-view');
    const editStatusButton = target.closest('.btn-edit-status');
    const cancelButton = target.closest('.btn-cancel');

    if (viewButton) {
        const appointmentId = viewButton.dataset.appointmentId;
        showAppointmentDetails(appointmentId);
        return;
    }

    if (editStatusButton) {
        const appointmentId = editStatusButton.dataset.appointmentId;
        changeAppointmentStatus(appointmentId);
        return;
    }

    if (cancelButton) {
        const appointmentId = cancelButton.dataset.appointmentId;
        cancelAppointment(appointmentId);
        return;
    }
});


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. ADICIONA O "SEGURANÇA"
    const adminUser = await checkAdminAuth();
    if (!adminUser) return; // Para a execução se não for admin

    // 2. SÓ CARREGA OS DADOS SE FOR ADMIN
    console.log("Admin verificado. Carregando agendamentos...");
    loadAndDisplayAppointments();
});