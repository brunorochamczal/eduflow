const API_BASE = window.location.origin + "/api";

async function handleLogin() {
    console.log("Iniciando Login...");
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const btn = document.getElementById('btn-login');

    if (!user || !pass) {
        alert("Preencha todos os campos!");
        return;
    }

    btn.innerText = "CARREGANDO...";
    btn.disabled = true;

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
            alert(data.mensagem);
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    } finally {
        btn.innerText = "ACESSAR SISTEMA";
        btn.disabled = false;
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
        home.classList.remove('hidden'); // Garante que o container pai apareça
        home.classList.add('hidden');
        dynamic.classList.remove('hidden');
        renderForm(section, container);
    }
}

function renderForm(type, container) {
    const backBtn = `<button class="btn-back" onclick="showSection('home')">← Voltar</button>`;
    const forms = {
        'alunos': `<div class="form-modern"><h3>Novo Aluno</h3><input id="cad-nome" placeholder="Nome"><input id="cad-serie" placeholder="Série"><button onclick="salvar('alunos')">Salvar</button></div>`,
        'professores': `<div class="form-modern"><h3>Novo Professor</h3><input id="prof-nome" placeholder="Nome"><input id="prof-materia" placeholder="Matéria"><button onclick="salvar('professores')">Salvar</button></div>`
    };
    container.innerHTML = backBtn + (forms[type] || "<h3>Em breve...</h3>");
}

async function salvar(tipo) {
    const dados = tipo === 'alunos' ? 
        { nome: document.getElementById('cad-nome').value, serie: document.getElementById('cad-serie').value } :
        { nome: document.getElementById('prof-nome').value, materia: document.getElementById('prof-materia').value };

    try {
        const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) { alert("Sucesso!"); showSection('home'); }
    } catch (e) { alert("Erro ao salvar."); }
}
