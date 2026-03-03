const API_BASE = window.location.origin + "/api";

async function handleLogin() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const btn = document.getElementById('btn-login');

    if (!user || !pass) { alert("⚠️ Preencha os campos."); return; }

    btn.disabled = true;
    btn.innerHTML = 'AUTENTICANDO...';

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        const data = await res.json();

        if (res.ok) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
            document.getElementById('user-display').innerText = data.user.nome;
        } else {
            alert("❌ " + data.mensagem);
        }
    } catch (e) {
        alert("🔌 Erro de conexão com o Railway.");
    } finally {
        btn.disabled = false;
        btn.innerText = "ACESSAR SISTEMA";
    }
}

function showSection(section) {
    const home = document.getElementById('home-section');
    const dynamic = document.getElementById('dynamic-content');
    const container = document.getElementById('module-container');

    if (section === 'home') {
        home.classList.remove('hidden');
        dynamic.classList.add('hidden');
    } else {
        home.classList.add('hidden');
        dynamic.classList.remove('hidden');
        document.getElementById('section-title').innerText = "Gestão de " + section;
        loadModule(section, container);
    }
}

function loadModule(type, container) {
    const backBtn = `<button class="btn-back" onclick="showSection('home')">← Voltar ao Menu</button>`;
    
    const templates = {
        'alunos': `${backBtn}<div class="form-modern"><h3>Matrícula</h3><input id="cad-nome" placeholder="Nome"><input id="cad-serie" placeholder="Série"><input id="cad-turno" placeholder="Turno"><button onclick="salvarCadastro('alunos')">Salvar</button></div>`,
        'professores': `${backBtn}<div class="form-modern"><h3>Docente</h3><input id="prof-nome" placeholder="Nome"><input id="prof-mat" placeholder="Especialidade"><button onclick="salvarCadastro('professores')">Salvar</button></div>`
    };

    container.innerHTML = templates[type] || `${backBtn} <h2>Em desenvolvimento.</h2>`;
}

async function salvarCadastro(tipo) {
    let dados = tipo === 'alunos' ? 
        { nome: document.getElementById('cad-nome').value, serie: document.getElementById('cad-serie').value, turno: document.getElementById('cad-turno').value } :
        { nome: document.getElementById('prof-nome').value, especialidade: document.getElementById('prof-mat').value };

    try {
        const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("✅ Salvo!");
            showSection('home');
        } else {
            alert("❌ Erro ao salvar.");
        }
    } catch (e) {
        alert("🔌 Servidor indisponível.");
    }
}
