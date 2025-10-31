document.addEventListener('DOMContentLoaded', function() {
    const sendCodeForm = document.getElementById('sendCodeForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const section1 = document.getElementById('reset-section-1');
    const section2 = document.getElementById('reset-section-2');
    const backToStep1Button = document.getElementById('back-to-step1');

    if (sendCodeForm) {
        sendCodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // TODO: Lógica para enviar o código por e-mail (usando uma função do Supabase)
            alert("Simulação: Código de recuperação enviado para o seu e-mail!");
            
            section1.style.display = 'none';
            section2.style.display = 'block';
        });
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newPassword = document.getElementById('new_password').value;
            const confirmNewPassword = document.getElementById('confirm_new_password').value;
            if (newPassword !== confirmNewPassword) {
                alert("As novas senhas não coincidem. Tente novamente.");
                return;
            }
            // TODO: Lógica para redefinir a senha no Supabase
            alert("Senha redefinida com sucesso!");
            
            // CORREÇÃO: Caminho do link ajustado
            window.location.href = "/usuario/login.html";
        });
    }

    if (backToStep1Button) {
        backToStep1Button.addEventListener('click', function(e) {
            e.preventDefault();
            section2.style.display = 'none';
            section1.style.display = 'block';
        });
    }
});