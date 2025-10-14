// Seleciona os elementos da página
const sendCodeForm = document.getElementById('sendCodeForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const section1 = document.getElementById('reset-section-1');
const sectionNew = document.getElementById('reset-section-new');
const backToStep1Button = document.getElementById('back-to-step1'); // Botão de voltar da TELA 2

// Quando o formulário de enviar código é submetido
if (sendCodeForm) {
    sendCodeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Lógica para enviar o código por e-mail iria aqui
        alert("Código de recuperação enviado para o seu e-mail!");
        
        // Esconde a primeira tela e mostra a segunda
        section1.style.display = 'none';
        sectionNew.style.display = 'block';
    });
}

// Quando o formulário de redefinir senha é submetido
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new_password').value;
        const confirmNewPassword = document.getElementById('confirm_new_password').value;
        if (newPassword !== confirmNewPassword) {
            alert("As novas senhas não coincidem. Tente novamente.");
            return;
        }
        alert("Senha redefinida com sucesso!");
        window.location.href = "../login/login.html";
    });
}

// LÓGICA PARA O BOTÃO DE VOLTAR DA TELA 2
if (backToStep1Button) {
    backToStep1Button.addEventListener('click', function(e) {
        e.preventDefault(); // Impede que o link '#' mude a URL
        
        // Esconde a segunda tela e mostra a primeira novamente
        sectionNew.style.display = 'none';
        section1.style.display = 'block';
    });
}