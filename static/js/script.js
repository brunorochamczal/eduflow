const API_BASE = window.location.origin + "/api";

async function handleLogin() {
    const userField = document.getElementById('user');
    const passField = document.getElementById('pass');
    const btn = document.getElementById('btn-login');

    if (!userField.value || !passField.value) {
        alert("⚠️ Preencha os campos.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AUTENTICANDO...';

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
            alert("❌ " + (data.mensagem || "Erro no login"));
        }
    } catch (error) {
        alert("🔌 Erro de conexão com o servidor Railway."); // Erro do print 5
    } finally {
        btn.disabled = false;
        btn.innerText = "ACESSAR SISTEMA";
    }
}

function showSection(section) {
    const home = document.getElementById('home-section');
    const dynamic = document.getElementById('dynamic-content');
    const container = document.getElementById('module-container');
    const title = document.getElementById('section-title');

    if (section === 'home') {
        home.classList.remove('hidden');
        dynamic.classList.add('hidden');
    } else {
        home.classList.add('hidden');
        dynamic.classList.remove('hidden');
        title.innerText = "Gestão de " + section.charAt(0).toUpperCase() + section.slice(1);
        loadModule(section, container);
    }
}

function loadModule(type, container) {
    const backBtn = `<button class="btn-back" onclick="showSection('home')">← Voltar ao Menu</button>`;
    
    const templates = {
        'alunos': `
            ${backBtn}
            <div class="form-modern">
                <h3>Cadastro de Aluno</h3>
                <input type="text" id="cad-nome" placeholder="Nome Completo">
                <select id="cad-serie">
                    <option value="1º Ano">1º Ano</option>
                    <option value="2º Ano">2º Ano</option>
                </select>
                <input type="text" id="cad-cel" placeholder="WhatsApp">
                <button onclick="salvarCadastro('alunos')">Salvar Matrícula</button>
            </div>
        `,
        'professores': `
            ${backBtn}
            <div class="form-modern">
                <h3>Cadastro de Professor</h3>
                <input type="text" id="prof-nome" placeholder="Nome do Docente">
                <input type="text" id="prof-materia" placeholder="Disciplina">
                <button onclick="salvarCadastro('professores')">Cadastrar Professor</button>
            </div>
        `
    };

    container.innerHTML = templates[type] || `${backBtn} <h2>Em desenvolvimento.</h2>`;
}

async function salvarCadastro(tipo) {
    let dados = {};
    if(tipo === 'alunos') {
        dados = { 
            nome: document.getElementById('cad-nome').value, 
            serie: document.getElementById('cad-serie').value,
            celular: document.getElementById('cad-cel').value 
        };
    } else if(tipo === 'professores') {
        dados = {
            nome: document.getElementById('prof-nome').value,
            materia: document.getElementById('prof-materia').value
        };
    }

    try {
        const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            alert("✅ Salvo com sucesso!");
            showSection('home');
        } else {
            alert("❌ Erro ao salvar.");
        }
    } catch (e) {
        alert("🔌 Servidor indisponível ou erro de rede."); // Erro do print 7
    }
}
