async function handleLogin() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const btn = document.getElementById('btn-login');

    btn.innerText = "Carregando...";
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user, pass})
        });
        const data = await res.json();

        if (res.ok) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
            loadRadar(); // Carrega funcionalidade moderna de faltas
        } else {
            alert(data.mensagem);
        }
    } catch (e) {
        alert("Erro de conexão!");
    } finally {
        btn.innerText = "Acessar Sistema";
    }
}

async function loadRadar() {
    const res = await fetch('/api/radar');
    const alertas = await res.json();
    if(alertas.length > 0) {
        console.log("Radar Pedagógico detectou riscos:", alertas);
        // Aqui você pode injetar um aviso visual no Dashboard
    }
}

function showSection(section) {
    // Lógica para esconder o grid e mostrar formulários
    alert("Abrindo módulo de " + section);
}
