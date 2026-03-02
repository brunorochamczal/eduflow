const API = window.location.origin;

async function fazerLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user, pass})
    });

    if(res.ok) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    } else {
        alert("Credenciais erradas!");
    }
}

function logout() { location.reload(); }

function openMod(tipo) {
    alert("Abrindo módulo: " + tipo + ". (Aqui carregaremos o formulário específico)");
}
