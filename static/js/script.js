const API_BASE = window.location.origin + "/api";

async function handleLogin() {
    const userField = document.getElementById('user');
    const passField = document.getElementById('pass');
    const btn = document.getElementById('btn-login');

    if (!userField.value || !passField.value) {
        alert("⚠️ Preencha usuário e senha.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ACESSANDO...';

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userField.value, pass: passField.value })
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
        document.getElementById('section-title').innerText = "Gestão: " + section.toUpperCase();
        loadModule(section, container);
    }
}

function loadModule(type, container) {
    const backBtn = `<button class="btn-back" onclick="showSection('home')">← Voltar</button>`;
    const forms = {
        'alunos': `${backBtn}<div class="form-modern"><h3>Matrícula</h3><input id="cad-nome" placeholder="Nome"><input id="cad-serie" placeholder="Série"><select id="cad-turno"><option>Manhã</option><option>Tarde</option></select><input id="cad-cel" placeholder="WhatsApp"><button onclick="salvarCadastro('alunos')">Salvar</button></div>`,
        'professores': `${backBtn}<div class="form-modern"><h3>Professor</h3><input id="prof-nome" placeholder="Nome"><input id="prof-materia" placeholder="Disciplina"><input id="prof-email" placeholder="E-mail"><button onclick="salvarCadastro('professores')">Salvar</button></div>`,
        'diario': `${backBtn}<div class="form-modern"><h3>Diário</h3><input id="dia-serie" placeholder="Série"><textarea id="dia-conteudo" placeholder="Conteúdo"></textarea><button onclick="salvarCadastro('diario')">Registrar</button></div>`
    };
    container.innerHTML = forms[type] || `${backBtn} <h3>Em desenvolvimento.</h3>`;
}

async function salvarCadastro(tipo) {
    let dados = {};
    if (tipo === 'alunos') {
        dados = { nome: document.getElementById('cad-nome').value, serie: document.getElementById('cad-serie').value, turno: document.getElementById('cad-turno').value, celular: document.getElementById('cad-cel').value };
    } else if (tipo === 'diario') {
        dados = { serie: document.getElementById('dia-serie').value, turno: "Manhã", conteudo: document.getElementById('dia-conteudo').value };
    } else if (tipo === 'professores') {
        dados = { nome: document.getElementById('prof-nome').value, materia: document.getElementById('prof-materia').value, email: document.getElementById('prof-email').value };
    }

    try {
        const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) { alert("✅ Salvo com sucesso!"); showSection('home'); }
    } catch (e) { alert("🔌 Erro ao salvar."); }
}
