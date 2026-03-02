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

    // Feedback visual no botão moderno
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
            // Sucesso: Transição para Dashboard
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
            document.getElementById('user-display').innerText = data.user.nome;
            
            // Inicializa as funções de Inteligência de Dados
            loadDashboardStats();
            checkPedagogicRadar();
        } else {
            alert("❌ " + (data.mensagem || "Credenciais inválidas."));
        }
    } catch (error) {
        console.error("Erro no login:", error);
        alert("🔌 Erro de conexão com o servidor Railway.");
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
        loadDashboardStats(); // Atualiza os números sempre que volta
    } else {
        home.classList.add('hidden');
        dynamic.classList.remove('hidden');
        title.innerText = "Gestão de " + section.charAt(0).toUpperCase() + section.slice(1);
        loadModule(section, container);
    }
}

// --- 3. FUNCIONALIDADES MODERNAS (BI & RADAR) ---

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const stats = await res.json();
        
        // Se você tiver elementos de mini-cards para o BI, atualize aqui
        console.log("📊 Business Intelligence:", stats);
        // Exemplo: document.getElementById('total-alunos').innerText = stats.total;
    } catch (e) {
        console.warn("Não foi possível carregar estatísticas de BI.");
    }
}

async function checkPedagogicRadar() {
    try {
        const res = await fetch(`${API_BASE}/radar`);
        const alertas = await res.json();
        
        if (alertas.length > 0) {
            console.log("🚨 RADAR PEDAGÓGICO: Alunos com risco de evasão detectados!");
            // Notificação visual discreta no dashboard pode ser adicionada aqui
        }
    } catch (e) {
        console.error("Erro ao processar Radar Pedagógico.");
    }
}

// --- 4. CARREGAMENTO DINÂMICO DE MÓDULOS ---

function loadModule(type, container) {
    container.innerHTML = `<div class="loader">Carregando formulários de ${type}...</div>`;
    
    // Mapeamento de formulários modernos
    const templates = {
        'alunos': `
            <div class="form-modern">
                <input type="text" id="cad-nome" placeholder="Nome do Aluno">
                <select id="cad-serie">
                    <option>1º Ano</option><option>2º Ano</option><option>3º Ano</option>
                </select>
                <input type="text" id="cad-cel" placeholder="WhatsApp do Responsável (Ex: 11999999999)">
                <button onclick="salvarCadastro('alunos')">Finalizar Matrícula</button>
            </div>
        `,
        'financeiro': `
            <div class="fin-panel">
                <h3>💰 Fluxo de Caixa e Cobrança</h3>
                <button class="btn-wa" onclick="enviarCobrancaBulk()">Enviar Lembretes via WhatsApp</button>
                <div id="lista-pagamentos">Puxando dados do Neon...</div>
            </div>
        `,
        'comunicados': `
            <div class="form-modern">
                <h3>📢 Comunicado Geral (Push)</h3>
                <input type="text" id="msg-titulo" placeholder="Título do Aviso">
                <textarea id="msg-corpo" placeholder="Mensagem para os pais..."></textarea>
                <button onclick="enviarComunicado()">Disparar para todos</button>
            </div>
        `
    };

    container.innerHTML = templates[type] || `<h2>Módulo ${type} em desenvolvimento.</h2>`;
}

// --- 5. AÇÕES DE BANCO DE DATA (POSTS) ---

async function salvarCadastro(tipo) {
    const dados = {
        nome: document.getElementById('cad-nome').value,
        serie: document.getElementById('cad-serie').value,
        celular: document.getElementById('cad-cel').value
    };

    const res = await fetch(`${API_BASE}/cadastrar/${tipo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        alert("✅ Cadastro realizado com sucesso!");
        showSection('home');
    }
}

function enviarCobrancaBulk() {
    // Exemplo de integração moderna com WhatsApp
    const fone = "5511999999999"; // Pegaria do banco dinamicamente
    const msg = encodeURIComponent("Olá! Notamos uma pendência no Edunex. Podemos ajudar?");
    window.open(`https://wa.me/${fone}?text=${msg}`);
}
