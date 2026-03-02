/**
 * EDUNEX - Sistema de Gestão Escolar Profissional
 * script.js - Lógica de Front-end e Integração com API
 */

const API_BASE = window.location.origin + "/api";

// --- 1. GESTÃO DE AUTENTICAÇÃO ---

async function handleLogin() {
    const userField = document.getElementById('user');
    const passField = document.getElementById('pass');
    const btn = document.getElementById('btn-login');

    if (!userField.value || !passField.value) {
        alert("⚠️ Por favor, preencha todos os campos.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AUTENTICANDO...';

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user: userField.value, 
                pass: passField.value 
            })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
            document.getElementById('user-display').innerText = data.user.nome;
            
            loadDashboardStats();
            checkPedagogicRadar();
        } else {
            alert("❌ " + (data.mensagem || "Credenciais inválidas."));
        }
    } catch (error) {
        console.error("Erro no login:", error);
        alert("🔌 Erro de conexão com o servidor.");
    } finally {
        btn.disabled = false;
        btn.innerText = "ACESSAR SISTEMA";
    }
}

function handleLogout() {
    if(confirm("Deseja realmente sair do sistema?")) {
        location.reload();
    }
}

// --- 2. NAVEGAÇÃO ENTRE MÓDULOS ---

function showSection(section) {
    const home = document.getElementById('home-section');
    const dynamic = document.getElementById('dynamic-content');
    const container = document.getElementById('module-container');
    const title = document.getElementById('section-title');

    if (section === 'home') {
        home.classList.remove('hidden');
        dynamic.classList.add('hidden');
        title.innerText = "Dashboard Principal";
        loadDashboardStats();
    } else {
        home.classList.add('hidden');
        dynamic.classList.remove('hidden');
        title.innerText = "Gestão de " + section.charAt(0).toUpperCase() + section.slice(1);
        loadModule(section, container);
    }
}

// --- 3. CARREGAMENTO DINÂMICO DE FORMULÁRIOS (FRONT-END DAS FUNÇÕES) ---

function loadModule(type, container) {
    container.innerHTML = `<div class="loader">Carregando...</div>`;
    
    const templates = {
        'alunos': `
            <div class="form-modern">
                <h3>Novo Cadastro de Aluno</h3>
                <input type="text" id="cad-nome" placeholder="Nome Completo do Aluno">
                <select id="cad-serie">
                    <option value="1º Ano">1º Ano</option>
                    <option value="2º Ano">2º Ano</option>
                    <option value="3º Ano">3º Ano</option>
                </select>
                <input type="text" id="cad-cel" placeholder="WhatsApp do Responsável (Ex: 11999999999)">
                <button onclick="salvar('alunos')">Finalizar Matrícula</button>
            </div>
        `,
        'professores': `
            <div class="form-modern">
                <h3>Cadastrar Novo Professor</h3>
                <input type="text" id="prof-nome" placeholder="Nome do Professor">
                <input type="text" id="prof-espec" placeholder="Especialidade/Matéria">
                <button onclick="salvar('professores')">Salvar Professor</button>
            </div>
        `,
        'turmas': `
            <div class="form-modern">
                <h3>Criar Nova Turma</h3>
                <input type="text" id="turma-nome" placeholder="Nome da Turma (Ex: 9º A)">
                <input type="text" id="turma-turno" placeholder="Turno (Manhã/Tarde)">
                <button onclick="salvar('turmas')">Criar Turma</button>
            </div>
        `,
        'disciplinas': `
            <div class="form-modern">
                <h3>Adicionar Disciplina</h3>
                <input type="text" id="disc-nome" placeholder="Nome da Disciplina">
                <input type="number" id="disc-carga" placeholder="Carga Horária">
                <button onclick="salvar('disciplinas')">Adicionar à Grade</button>
            </div>
        `,
        'financeiro': `
            <div class="fin-panel">
                <h3>💰 Controle Financeiro</h3>
                <button class="btn-wa" onclick="enviarCobrancaBulk()">Enviar Lembretes via WhatsApp</button>
                <hr>
                <input type="number" id="aluno-id-fin" placeholder="ID do Aluno">
                <input type="number" id="valor-pag" placeholder="Valor do Pagamento">
                <button onclick="salvar('financeiro')">Registrar Recebimento</button>
            </div>
        `,
        'radar': `
            <div class="radar-box">
                <h3>🚨 Radar Pedagógico (IA)</h3>
                <div id="radar-results">Analisando dados de frequência no banco Neon...</div>
            </div>
        `
    };

    container.innerHTML = templates[type] || `<h2>Módulo ${type} em breve.</h2>`;
    if(type === 'radar') loadRadarData();
}

// --- 4. AÇÕES DE SALVAMENTO (INTEGRAÇÃO COM BACKEND) ---

async function salvar(tipo) {
    let payload = {};
    
    // Captura os dados de acordo com o formulário aberto
    if (tipo === 'alunos') {
        payload = {
            nome: document.getElementById('cad-nome').value,
            serie: document.getElementById('cad-serie').value,
            celular: document.getElementById('cad-cel').value
        };
    } else if (tipo === 'professores') {
        payload = {
            nome: document.getElementById('prof-nome').value,
            especialidade: document.getElementById('prof-espec').value
        };
    } else if (tipo === 'turmas') {
        payload = {
            nome: document.getElementById('turma-nome').value,
            turno: document.getElementById('turma-turno').value
        };
    } else if (tipo === 'disciplinas') {
        payload = {
            nome: document.getElementById('disc-nome').value,
            carga: document.getElementById('disc-carga').value
        };
    }

    try {
        const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(`✅ ${tipo.toUpperCase()} cadastrado com sucesso!`);
            showSection('home');
        } else {
            alert("❌ Erro ao salvar dados no servidor.");
        }
    } catch (e) {
        alert("🔌 Falha de comunicação com a API.");
    }
}

// --- 5. FUNÇÕES DE INTELIGÊNCIA ---

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const stats = await res.json();
        console.log("📊 BI Atualizado:", stats);
    } catch (e) {
        console.warn("Estatísticas indisponíveis.");
    }
}

async function loadRadarData() {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();
    const container = document.getElementById('radar-results');
    if(data.length > 0) {
        container.innerHTML = data.map(a => `<p>⚠️ <b>${a.nome}</b> está com ${a.total_faltas} faltas.</p>`).join('');
    } else {
        container.innerHTML = "✅ Nenhum aluno em risco crítico detectado.";
    }
}

function enviarCobrancaBulk() {
    const msg = encodeURIComponent("Olá! Identificamos uma pendência no Edunex. Como podemos ajudar?");
    window.open(`https://wa.me/5511999999999?text=${msg}`); // O número seria dinâmico do banco
}
