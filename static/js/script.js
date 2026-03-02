const API = window.location.origin;

async function handleLogin() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const btn = document.getElementById('btn-login');

    if (!user || !pass) return alert("Preencha tudo!");

    btn.innerText = "Verificando...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
            document.getElementById('user-display').innerText = data.user.nome;
            loadStats(); // Carrega os gráficos modernos
        } else {
            alert(data.mensagem || "Erro ao acessar");
        }
    } catch (err) {
        alert("Erro de conexão com o servidor");
    } finally {
        btn.innerText = "Acessar Sistema";
        btn.disabled = false;
    }
}

async function loadStats() {
    // Aqui você integraria uma biblioteca como Chart.js para o BI
    const res = await fetch(`${API}/api/stats`);
    const stats = await res.json();
    console.log("Estatísticas para o BI:", stats);
}

function showSection(section) {
    if(section === 'home') {
        document.getElementById('home-section').classList.remove('hidden');
        document.getElementById('dynamic-content').classList.add('hidden');
    } else {
        document.getElementById('home-section').classList.add('hidden');
        document.getElementById('dynamic-content').classList.remove('hidden');
        document.getElementById('module-container').innerHTML = `<h2>Módulo: ${section.toUpperCase()}</h2><p>Carregando ferramentas avançadas...</p>`;
    }
}
