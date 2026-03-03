const API_BASE = window.location.origin + "/api";

async function handleLogin() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const btn = document.getElementById('btn-login');

    btn.disabled = true;
    btn.innerHTML = 'AUTENTICANDO...';

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
            document.getElementById('user-display').innerText = data.user.nome;
        } else {
            alert("❌ " + data.mensagem);
        }
    } catch (error) {
        alert("🔌 Erro de rede.");
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
        document.getElementById('section-title').innerText = "Módulo " + section;
        loadModule(section, container);
    }
}

function loadModule(type, container) {
    const backBtn = `<button class="btn-back" onclick="showSection('home')">← Voltar</button>`;
    if (type === 'professores') {
        container.innerHTML = backBtn + `
            <div class="form-modern">
                <input type="text" id="prof-nome" placeholder="Nome">
                <input type="text" id="prof-materia" placeholder="Especialidade">
                <button onclick="salvarCadastro('professores')">Salvar Professor</button>
            </div>`;
    } else if (type === 'alunos') {
        container.innerHTML = backBtn + `
            <div class="form-modern">
                <input type="text" id="cad-nome" placeholder="Nome">
                <input type="text" id="cad-serie" placeholder="Série">
                <select id="cad-turno"><option>Manhã</option><option>Tarde</option></select>
                <button onclick="salvarCadastro('alunos')">Salvar Matrícula</button>
            </div>`;
    }
}

async function salvarCadastro(tipo) {
    const dados = tipo === 'alunos' ? 
        { nome: document.getElementById('cad-nome').value, serie: document.getElementById('cad-serie').value, turno: document.getElementById('cad-turno').value } :
        { nome: document.getElementById('prof-nome').value, especialidade: document.getElementById('prof-materia').value };

    try {
        const res = await fetch(`${API_BASE}/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) { alert("✅ Salvo!"); showSection('home'); }
    } catch (e) { alert("🔌 Erro."); }
}
