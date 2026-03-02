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
        alert("🔌 Erro de conexão com o servidor Railway."); // Erro exibido na sua captura
    } finally {
        btn.disabled = false;
        btn.innerText = "ACESSAR SISTEMA";
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
    } else {
        home.classList.add('hidden');
        dynamic.classList.remove('hidden');
        title.innerText = "Gestão de " + section.charAt(0).toUpperCase() + section.slice(1);
        loadModule(section, container);
    }
}

// --- 3. CARREGAMENTO DINÂMICO DE MÓDULOS (FRONT-END REAL) ---

function loadModule(type, container) {
    container.innerHTML = `<div class="loader">Carregando formulários...</div>`;
    
    const templates = {
        'alunos': `
            <div class="form-modern">
                <input type="text" id="cad-nome" placeholder="Nome do Aluno">
                <select id="cad-serie">
                    <option value="1º Ano">1º Ano</option>
                    <option value="2º Ano">2º Ano</option>
                    <option value="3º Ano">3º Ano</option>
                </select>
                <input type="text" id="cad-cel" placeholder="WhatsApp do Responsável">
                <button onclick="salvarCadastro('alunos')">Finalizar Matrícula</button>
            </div>
        `,
        'professores': `
            <div class="form-modern">
                <input type="text" id="prof-nome" placeholder="Nome do Professor">
                <input type="text" id="prof-materia" placeholder="Disciplina/Matéria">
                <button onclick="salvarCadastro('professores')">Cadastrar Professor</button>
            </div>
        `,
        'turmas': `
            <div class="form-modern">
                <input type="text" id="turma-nome" placeholder="Nome da Turma (Ex: 9º A)">
                <input type="text" id="turma-sala" placeholder="Sala/Prédio">
                <button onclick="salvarCadastro('turmas')">Criar Turma</button>
            </div>
        `,
        'disciplinas': `
            <div class="form-modern">
                <input type="text" id="disc-nome" placeholder="Nome da Disciplina">
                <input type="number" id="disc-carga" placeholder="Carga Horária (horas)">
                <button onclick="salvarCadastro('disciplinas')">Adicionar Disciplina</button>
            </div>
        `,
        'financeiro': `
            <div class="fin-panel">
                <h3>💰 Controle de Mensalidades</h3>
                <button class="btn-wa" onclick="enviarCobrancaBulk()">Enviar Lembretes via WhatsApp</button>
                <div class="stats-mini">Total Pendente: R$ 1.250,00</div>
            </div>
        `,
        'radar': `
            <div class="radar-box">
                <h3>🚨 Alunos com Risco de Evasão</h3>
                <div id="radar-list">Analisando faltas...</div>
            </div>
        `
    };

    container.innerHTML = templates[type] || `<h2>Módulo em construção.</h2>`;
}

// --- 4. AÇÕES DE BANCO DE DADOS ---

async function salvarCadastro(tipo) {
    let dados = {};
    
    // Captura dinâmica baseada no tipo
    if (tipo === 'alunos') {
        dados = { 
            nome: document.getElementById('cad-nome').value, 
            serie: document.getElementById('cad-serie').value,
            celular: document.getElementById('cad-cel').value 
        };
    } else if (tipo === 'professores') {
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
            alert("✅ Registro salvo com sucesso!");
            showSection('home');
        } else {
            alert("❌ Erro ao salvar registro.");
        }
    } catch (e) {
        alert("🔌 Servidor indisponível no momento.");
    }
}

// Funções de BI/Radar (Placeholders para integração)
async function loadDashboardStats() { console.log("Stats carregadas."); }
async function checkPedagogicRadar() { console.log("Radar ativo."); }
function enviarCobrancaBulk() { window.open("https://wa.me/5511999999999?text=Olá, identificamos pendências."); }
