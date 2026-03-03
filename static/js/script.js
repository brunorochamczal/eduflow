const API_BASE = window.location.origin + "/api";

// --- NAVEGAÇÃO ---
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
        document.getElementById('section-title').innerText = "Módulo: " + section.toUpperCase();
        loadModule(section, container);
    }
}

// --- CARREGAMENTO DE TODOS OS MÓDULOS ---
function loadModule(type, container) {
    const backBtn = `<button class="btn-back" onclick="showSection('home')">← Voltar</button>`;
    
    const templates = {
        'alunos': `
            ${backBtn}
            <div class="form-modern">
                <h3>Matrícula de Aluno</h3>
                <input type="text" id="cad-nome" placeholder="Nome Completo">
                <input type="text" id="cad-serie" placeholder="Série/Ano">
                <select id="cad-turno"><option>Manhã</option><option>Tarde</option><option>Noite</option></select>
                <input type="text" id="cad-cel" placeholder="WhatsApp Responsável">
                <button onclick="salvarCadastro('alunos')">Salvar Aluno</button>
            </div>`,
        'diario': `
            ${backBtn}
            <div class="form-modern">
                <h3>Registro Diário de Classe</h3>
                <input type="text" id="dia-serie" placeholder="Série">
                <input type="text" id="dia-turno" placeholder="Turno">
                <textarea id="dia-conteudo" placeholder="Conteúdo ministrado hoje..."></textarea>
                <textarea id="dia-obs" placeholder="Observações da turma..."></textarea>
                <button onclick="salvarCadastro('diario')">Registrar Aula</button>
            </div>`,
        'professores': `
            ${backBtn}
            <div class="form-modern">
                <h3>Cadastro de Professor</h3>
                <input type="text" id="prof-nome" placeholder="Nome">
                <input type="text" id="prof-materia" placeholder="Especialidade">
                <input type="email" id="prof-email" placeholder="E-mail">
                <button onclick="salvarCadastro('professores')">Cadastrar</button>
            </div>`
    };

    container.innerHTML = templates[type] || `${backBtn} <h3>Módulo em desenvolvimento...</h3>`;
}

// --- SALVAMENTO UNIFICADO ---
async function salvarCadastro(tipo) {
    let dados = {};
    if(tipo === 'alunos') {
        dados = { 
            nome: document.getElementById('cad-nome').value, 
            serie: document.getElementById('cad-serie').value,
            turno: document.getElementById('cad-turno').value,
            celular: document.getElementById('cad-cel').value 
        };
    } else if(tipo === 'diario') {
        dados = {
            serie: document.getElementById('dia-serie').value,
            turno: document.getElementById('dia-turno').value,
            conteudo: document.getElementById('dia-conteudo').value,
            observacoes: document.getElementById('dia-obs').value
        };
    } else if(tipo === 'professores') {
        dados = {
            nome: document.getElementById('prof-nome').value,
            materia: document.getElementById('prof-materia').value,
            email: document.getElementById('prof-email').value
        };
    }

    try {
        const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (res.ok) {
            alert("✅ Dados enviados com sucesso!");
            showSection('home');
        }
    } catch (e) { alert("🔌 Erro na conexão."); }
}
