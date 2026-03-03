const API_BASE = window.location.origin + "/api";

async function handleLogin() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const btn = document.getElementById('btn-login');

    btn.disabled = true;
    btn.innerText = "AUTENTICANDO...";

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        const data = await res.json();

        if (res.ok) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard-screen').classList.remove('hidden');
            document.getElementById('user-display').innerText = data.user.nome;
        } else {
            alert(data.mensagem);
        }
    } catch (e) {
        alert("Erro de conexão com o servidor Railway.");
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
    const back = `<button class="btn-back" onclick="showSection('home')">← Voltar</button>`;
    if (type === 'professores') {
        container.innerHTML = back + `
            <div class="form-modern">
                <h3>Cadastro de Docente</h3>
                <input id="prof-nome" placeholder="Nome do Professor">
                <input id="prof-materia" placeholder="Disciplina">
                <button onclick="salvarCadastro('professores')">Cadastrar Professor</button>
            </div>`;
    } else if (type === 'alunos') {
        container.innerHTML = back + `
            <div class="form-modern">
                <h3>Matrícula de Aluno</h3>
                <input id="cad-nome" placeholder="Nome">
                <input id="cad-serie" placeholder="Série">
                <button onclick="salvarCadastro('alunos')">Finalizar</button>
            </div>`;
    }
}

async function salvarCadastro(tipo) {
    let dados = tipo === 'alunos' ? 
        { nome: document.getElementById('cad-nome').value, serie: document.getElementById('cad-serie').value } :
        { nome: document.getElementById('prof-nome').value, materia: document.getElementById('prof-materia').value };

    try {
        const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) { alert("Salvo!"); showSection('home'); }
    } catch (e) { alert("Erro de rede."); }
}
