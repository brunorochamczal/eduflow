/* ═══════════════════════════════════════════════════════
   EDUFLOW · script.js  — Frontend completo
   ═══════════════════════════════════════════════════════ */

const API = window.location.origin + '/api';

// Perfil do usuário logado — preenchido no login
let PERFIL_USUARIO = 'usuario'; // 'admin' | 'usuario'
const isAdmin = () => PERFIL_USUARIO === 'admin';

/* ─────────────────────────────────────────────────────────
   UTILITÁRIOS GLOBAIS
───────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

function showToast(msg, type = 'success') {
    const t = $('toast');
    const iconMap = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' };
    t.className = `toast toast-${type}`;
    t.querySelector('.toast-icon').className = `toast-icon fa-solid ${iconMap[type] || iconMap.success}`;
    t.querySelector('.toast-msg').textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(window._toast);
    window._toast = setTimeout(() => t.classList.add('hidden'), 3600);
}

function openModal(html) {
    $('modal-content').innerHTML = html;
    $('modal-overlay').classList.remove('hidden');
}

function closeModal(e) {
    if (e && e.target !== $('modal-overlay')) return;
    $('modal-overlay').classList.add('hidden');
}

function closeModalDirect() {
    $('modal-overlay').classList.add('hidden');
}

function loading(container) {
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Carregando...</span></div>`;
}

function erroCard(msg) {
    return `<div class="empty-state"><i class="fa-solid fa-circle-xmark"></i><p>${msg || 'Erro ao carregar dados.'}</p></div>`;
}

async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...opts
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensagem || `Erro ${res.status}`);
    return data;
}

function fmtDate(str) {
    if (!str) return '-';
    return new Date(str).toLocaleDateString('pt-BR');
}

// Botões de ação admin (editar + excluir) para tabelas
function btnAdmin(editFn, delFn) {
    if (!isAdmin()) return '';
    return `<div style="display:flex;gap:6px">
      <button class="btn btn-sm btn-ghost" onclick="${editFn}" title="Editar">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="btn btn-sm btn-danger" onclick="${delFn}" title="Excluir">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>`;
}

/* ─────────────────────────────────────────────────────────
   AUTENTICAÇÃO
───────────────────────────────────────────────────────── */
async function handleLogin() {
    const user = $('user').value.trim();
    const pass = $('pass').value;
    const btn  = $('btn-login');

    if (!user || !pass) { showToast('Preencha usuário e senha.', 'warning'); return; }

    btn.disabled = true;
    $('btn-login-text').textContent = 'AUTENTICANDO...';
    $('btn-login-icon').className = 'fa-solid fa-circle-notch fa-spin';

    try {
        const data = await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ user, pass })
        });

        const u = data.user;
        PERFIL_USUARIO = u?.perfil || 'usuario';

        const nome = u?.nome || u?.username || 'Usuário';
        $('user-display').textContent = nome.split(' ')[0];
        $('sidebar-username').textContent = nome;
        $('sidebar-avatar').textContent = nome.charAt(0).toUpperCase();

        // Mostra/oculta itens exclusivos de admin
        document.querySelectorAll('.admin-only').forEach(el => {
            isAdmin() ? el.classList.remove('hidden') : el.classList.add('hidden');
        });

        // Badge de perfil na sidebar
        const perfBadge = $('perfil-badge');
        if (perfBadge) {
            perfBadge.textContent = isAdmin() ? 'Administrador' : 'Usuário';
            perfBadge.style.color = isAdmin() ? 'var(--secondary)' : 'var(--muted)';
        }

        $('login-screen').classList.add('hidden');
        $('dashboard-screen').classList.remove('hidden');

        $('welcome-date').textContent = new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).replace(/^./, c => c.toUpperCase());

        carregarStats();

    } catch (err) {
        showToast(err.message || 'Credenciais inválidas.', 'error');
    } finally {
        btn.disabled = false;
        $('btn-login-text').textContent = 'ACESSAR SISTEMA';
        $('btn-login-icon').className = 'fa-solid fa-arrow-right';
    }
}

function handleLogout() {
    $('user').value = '';
    $('pass').value = '';
    PERFIL_USUARIO = 'usuario';
    $('dashboard-screen').classList.add('hidden');
    $('login-screen').classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-section="home"]').classList.add('active');
}

function toggleSidebar() { $('sidebar').classList.toggle('open'); }

/* ─────────────────────────────────────────────────────────
   STATS
───────────────────────────────────────────────────────── */
async function carregarStats() {
    try {
        const [stats, radar] = await Promise.all([apiFetch('/stats'), apiFetch('/radar')]);
        const total  = Number(stats.total)  || 0;
        const pagos  = Number(stats.pagos)  || 0;
        $('stat-total').textContent   = total;
        $('stat-pagos').textContent   = pagos;
        $('stat-inadim').textContent  = total - pagos;
        $('stat-alertas').textContent = Array.isArray(radar) ? radar.length : 0;
        if (radar.length > 0) $('notif-dot').classList.remove('hidden');
    } catch (_) {}
}

/* ─────────────────────────────────────────────────────────
   NAVEGAÇÃO
───────────────────────────────────────────────────────── */
function showSection(section) {
    // Bloqueia módulos admin para não-admins
    if (section === 'usuarios' && !isAdmin()) {
        showToast('Acesso restrito ao administrador.', 'warning'); return;
    }

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-section="${section}"]`);
    if (btn) btn.classList.add('active');

    if (section === 'home') {
        $('home-section').classList.remove('hidden');
        $('dynamic-content').classList.add('hidden');
        carregarStats();
    } else {
        $('home-section').classList.add('hidden');
        $('dynamic-content').classList.remove('hidden');
        const c = $('module-container');
        MODULOS[section] ? MODULOS[section](c) : semModulo(c, section);
    }
    $('sidebar').classList.remove('open');
}

function shell(titulo, conteudo, acoes = '') {
    return `
      <div class="module-header">
        <h2>${titulo}</h2>
        <div class="module-actions">
          ${acoes}
          <button class="btn-back" onclick="showSection('home')"><i class="fa-solid fa-arrow-left"></i> Voltar</button>
        </div>
      </div>
      ${conteudo}`;
}

function semModulo(c, s) {
    c.innerHTML = shell(s, `<div class="empty-state"><i class="fa-solid fa-hammer"></i><p>Módulo em construção.</p></div>`);
}

/* ═══════════════════════════════════════════════════════
   MAPA DE MÓDULOS
═══════════════════════════════════════════════════════ */
const MODULOS = {
    alunos:      carregarAlunos,
    professores: carregarProfessores,
    turmas:      carregarTurmas,
    disciplinas: carregarDisciplinas,
    frequencia:  carregarFrequencia,
    notas:       carregarNotas,
    diario:      carregarDiario,
    financeiro:  carregarFinanceiro,
    comunicados: carregarComunicados,
    radar:       carregarRadar,
    usuarios:    carregarUsuarios,
};

/* ════════════════════════════════════════════════════════
   ALUNOS
════════════════════════════════════════════════════════ */
async function carregarAlunos(c) {
    loading(c);
    try {
        const alunos = await apiFetch('/alunos');
        const rows = alunos.map(a => `
          <tr>
            <td><strong>${a.nome}</strong></td>
            <td>${a.serie}</td><td>${a.turno}</td>
            <td>${a.responsavel_celular || '-'}</td>
            <td>${fmtDate(a.data_matricula)}</td>
            <td><span class="badge ${a.pago ? 'badge-ok' : 'badge-err'}">${a.pago ? 'Pago' : 'Pendente'}</span></td>
            ${isAdmin() ? `<td>${btnAdmin(`editarAluno(${a.id},'${esc(a.nome)}','${a.serie}','${a.turno}','${a.responsavel_celular||''}')`, `excluir('alunos',${a.id},carregarAlunos)`)}</td>` : ''}
          </tr>`).join('');

        c.innerHTML = shell('Alunos',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-user-graduate"></i> Alunos Matriculados (${alunos.length})</h3></div>
               <div class="card-body">
                 ${alunos.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-user-graduate"></i><p>Nenhum aluno cadastrado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Nome</th><th>Série</th><th>Turno</th><th>WhatsApp</th><th>Matrícula</th><th>Mensalidade</th>${isAdmin() ? '<th>Ações</th>' : ''}</tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovoAluno()"><i class="fa-solid fa-plus"></i> Novo Aluno</button>`
        );
    } catch (e) { c.innerHTML = shell('Alunos', erroCard(e.message)); }
}

function modalNovoAluno() {
    openModal(`
      <p class="modal-title">Matricular Novo Aluno</p>
      <div class="form-group"><label>Nome Completo *</label>
        <input type="text" id="a-nome" placeholder="Ex: João da Silva">
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Série *</label>
          <select id="a-serie">
            <option value="">Selecione</option>
            <option value="1º Ano">1º Ano</option><option value="2º Ano">2º Ano</option>
            <option value="3º Ano">3º Ano</option><option value="4º Ano">4º Ano</option>
            <option value="5º Ano">5º Ano</option>
          </select>
        </div>
        <div class="form-group"><label>Turno *</label>
          <select id="a-turno">
            <option value="">Selecione</option>
            <option value="Manhã">Manhã</option><option value="Tarde">Tarde</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>WhatsApp do Responsável</label>
        <input type="text" id="a-cel" placeholder="(xx) xxxxx-xxxx">
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarAluno()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

function editarAluno(id, nome, serie, turno, cel) {
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Aluno</p>
      <div class="form-group"><label>Nome Completo *</label>
        <input type="text" id="a-nome" value="${nome}">
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Série *</label>
          <select id="a-serie">
            ${['1º Ano','2º Ano','3º Ano','4º Ano','5º Ano'].map(s=>`<option value="${s}" ${s===serie?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Turno *</label>
          <select id="a-turno">
            <option value="Manhã" ${turno==='Manhã'?'selected':''}>Manhã</option>
            <option value="Tarde" ${turno==='Tarde'?'selected':''}>Tarde</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>WhatsApp do Responsável</label>
        <input type="text" id="a-cel" value="${cel}">
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarAluno(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function salvarAluno() {
    const nome = $('a-nome').value.trim(), serie = $('a-serie').value, turno = $('a-turno').value, celular = $('a-cel').value.trim();
    if (!nome || !serie || !turno) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }
    try {
        await apiFetch('/alunos', { method: 'POST', body: JSON.stringify({ nome, serie, turno, celular }) });
        closeModalDirect(); showToast('Aluno matriculado!');
        carregarAlunos($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function atualizarAluno(id) {
    const nome = $('a-nome').value.trim(), serie = $('a-serie').value, turno = $('a-turno').value, celular = $('a-cel').value.trim();
    if (!nome || !serie || !turno) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }
    try {
        await apiFetch(`/alunos/${id}`, { method: 'PUT', body: JSON.stringify({ nome, serie, turno, celular }) });
        closeModalDirect(); showToast('Aluno atualizado!');
        carregarAlunos($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   PROFESSORES
════════════════════════════════════════════════════════ */
async function carregarProfessores(c) {
    loading(c);
    try {
        const profs = await apiFetch('/professores');
        const rows = profs.map(p => `
          <tr>
            <td><strong>${p.nome}</strong></td>
            <td>${p.especialidade || '-'}</td>
            <td>${p.email || '-'}</td>
            ${isAdmin() ? `<td>${btnAdmin(`editarProfessor(${p.id},'${esc(p.nome)}','${esc(p.especialidade||'')}','${esc(p.email||'')}')`, `excluir('professores',${p.id},carregarProfessores)`)}</td>` : ''}
          </tr>`).join('');

        c.innerHTML = shell('Professores',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-chalkboard-user"></i> Corpo Docente (${profs.length})</h3></div>
               <div class="card-body">
                 ${profs.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-chalkboard-user"></i><p>Nenhum professor cadastrado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Nome</th><th>Especialidade</th><th>E-mail</th>${isAdmin()?'<th>Ações</th>':''}</tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovoProfessor()"><i class="fa-solid fa-plus"></i> Novo Professor</button>`
        );
    } catch (e) { c.innerHTML = shell('Professores', erroCard(e.message)); }
}

async function _optsDisc(valorAtual = '') {
    let html = '<option value="">Selecione a disciplina</option>';
    try {
        const discs = await apiFetch('/disciplinas');
        html += discs.map(d => `<option value="${d.nome}" ${d.nome===valorAtual?'selected':''}>${d.nome}</option>`).join('');
    } catch (_) {}
    return html;
}

async function modalNovoProfessor() {
    const opts = await _optsDisc();
    openModal(`
      <p class="modal-title">Cadastrar Professor</p>
      <div class="form-group"><label>Nome Completo *</label>
        <input type="text" id="p-nome" placeholder="Ex: Prof. Maria Santos">
      </div>
      <div class="form-group"><label>Especialidade / Disciplina *</label>
        <select id="p-esp">${opts}</select>
      </div>
      <div class="form-group"><label>E-mail</label>
        <input type="email" id="p-email" placeholder="professor@escola.com.br">
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarProfessor()"><i class="fa-solid fa-floppy-disk"></i> Cadastrar</button>
      </div>
    `);
}

async function editarProfessor(id, nome, esp, email) {
    const opts = await _optsDisc(esp);
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Professor</p>
      <div class="form-group"><label>Nome Completo *</label>
        <input type="text" id="p-nome" value="${nome}">
      </div>
      <div class="form-group"><label>Especialidade / Disciplina *</label>
        <select id="p-esp">${opts}</select>
      </div>
      <div class="form-group"><label>E-mail</label>
        <input type="email" id="p-email" value="${email}">
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarProfessor(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function salvarProfessor() {
    const nome = $('p-nome').value.trim(), materia = $('p-esp').value, email = $('p-email').value.trim();
    if (!nome || !materia) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }
    try {
        await apiFetch('/professores', { method: 'POST', body: JSON.stringify({ nome, materia, email }) });
        closeModalDirect(); showToast('Professor cadastrado!');
        carregarProfessores($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function atualizarProfessor(id) {
    const nome = $('p-nome').value.trim(), materia = $('p-esp').value, email = $('p-email').value.trim();
    if (!nome || !materia) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }
    try {
        await apiFetch(`/professores/${id}`, { method: 'PUT', body: JSON.stringify({ nome, materia, email }) });
        closeModalDirect(); showToast('Professor atualizado!');
        carregarProfessores($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   TURMAS
════════════════════════════════════════════════════════ */
async function carregarTurmas(c) {
    loading(c);
    try {
        const [turmas, profs] = await Promise.all([apiFetch('/turmas'), apiFetch('/professores')]);
        window._profs = profs;
        const rows = turmas.map(t => `
          <tr>
            <td><strong>${t.nome}</strong></td>
            <td>${t.professor_nome || '<span class="badge badge-warn">Sem professor</span>'}</td>
            ${isAdmin() ? `<td>${btnAdmin(`editarTurma(${t.id},'${esc(t.nome)}',${t.professor_id||'null'})`, `excluir('turmas',${t.id},carregarTurmas)`)}</td>` : ''}
          </tr>`).join('');

        c.innerHTML = shell('Turmas',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-school"></i> Turmas (${turmas.length})</h3></div>
               <div class="card-body">
                 ${turmas.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-school"></i><p>Nenhuma turma.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Turma</th><th>Professor</th>${isAdmin()?'<th>Ações</th>':''}</tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovaTurma()"><i class="fa-solid fa-plus"></i> Nova Turma</button>`
        );
    } catch (e) { c.innerHTML = shell('Turmas', erroCard(e.message)); }
}

function _optsProfessores(selecionado = null) {
    const profs = window._profs || [];
    return `<option value="">Sem professor</option>` +
        profs.map(p => `<option value="${p.id}" ${p.id == selecionado ? 'selected' : ''}>${p.nome}</option>`).join('');
}

function modalNovaTurma() {
    openModal(`
      <p class="modal-title">Criar Nova Turma</p>
      <div class="form-group"><label>Nome da Turma *</label>
        <input type="text" id="t-nome" placeholder="Ex: 3º Ano A - Manhã">
      </div>
      <div class="form-group"><label>Professor Responsável</label>
        <select id="t-prof">${_optsProfessores()}</select>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarTurma()"><i class="fa-solid fa-floppy-disk"></i> Criar</button>
      </div>
    `);
}

function editarTurma(id, nome, profId) {
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Turma</p>
      <div class="form-group"><label>Nome da Turma *</label>
        <input type="text" id="t-nome" value="${nome}">
      </div>
      <div class="form-group"><label>Professor Responsável</label>
        <select id="t-prof">${_optsProfessores(profId)}</select>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarTurma(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function salvarTurma() {
    const nome = $('t-nome').value.trim(), professor_id = $('t-prof').value || null;
    if (!nome) { showToast('Informe o nome da turma.', 'warning'); return; }
    try {
        await apiFetch('/turmas', { method: 'POST', body: JSON.stringify({ nome, professor_id }) });
        closeModalDirect(); showToast('Turma criada!');
        carregarTurmas($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function atualizarTurma(id) {
    const nome = $('t-nome').value.trim(), professor_id = $('t-prof').value || null;
    if (!nome) { showToast('Informe o nome da turma.', 'warning'); return; }
    try {
        await apiFetch(`/turmas/${id}`, { method: 'PUT', body: JSON.stringify({ nome, professor_id }) });
        closeModalDirect(); showToast('Turma atualizada!');
        carregarTurmas($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   DISCIPLINAS
════════════════════════════════════════════════════════ */
async function carregarDisciplinas(c) {
    loading(c);
    try {
        const discs = await apiFetch('/disciplinas');
        const rows = discs.map(d => `
          <tr>
            <td><strong>${d.nome}</strong></td>
            <td>${d.carga_horaria ? d.carga_horaria + 'h/semana' : '-'}</td>
            ${isAdmin() ? `<td>${btnAdmin(`editarDisciplina(${d.id},'${esc(d.nome)}',${d.carga_horaria||0})`, `excluir('disciplinas',${d.id},carregarDisciplinas)`)}</td>` : ''}
          </tr>`).join('');

        c.innerHTML = shell('Disciplinas',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-book-open"></i> Disciplinas (${discs.length})</h3></div>
               <div class="card-body">
                 ${discs.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-book-open"></i><p>Nenhuma disciplina.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Disciplina</th><th>Carga Horária</th>${isAdmin()?'<th>Ações</th>':''}</tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovaDisciplina()"><i class="fa-solid fa-plus"></i> Nova Disciplina</button>`
        );
    } catch (e) { c.innerHTML = shell('Disciplinas', erroCard(e.message)); }
}

function modalNovaDisciplina() {
    openModal(`
      <p class="modal-title">Cadastrar Disciplina</p>
      <div class="form-group"><label>Nome *</label>
        <input type="text" id="d-nome" placeholder="Ex: Matemática">
      </div>
      <div class="form-group"><label>Carga Horária (h/semana)</label>
        <input type="number" id="d-ch" placeholder="Ex: 4" min="1" max="40">
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarDisciplina()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

function editarDisciplina(id, nome, ch) {
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Disciplina</p>
      <div class="form-group"><label>Nome *</label>
        <input type="text" id="d-nome" value="${nome}">
      </div>
      <div class="form-group"><label>Carga Horária (h/semana)</label>
        <input type="number" id="d-ch" value="${ch||''}" min="1" max="40">
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarDisciplina(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function salvarDisciplina() {
    const nome = $('d-nome').value.trim(), carga_horaria = $('d-ch').value || null;
    if (!nome) { showToast('Informe o nome.', 'warning'); return; }
    try {
        await apiFetch('/disciplinas', { method: 'POST', body: JSON.stringify({ nome, carga_horaria }) });
        closeModalDirect(); showToast('Disciplina cadastrada!');
        carregarDisciplinas($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function atualizarDisciplina(id) {
    const nome = $('d-nome').value.trim(), carga_horaria = $('d-ch').value || null;
    if (!nome) { showToast('Informe o nome.', 'warning'); return; }
    try {
        await apiFetch(`/disciplinas/${id}`, { method: 'PUT', body: JSON.stringify({ nome, carga_horaria }) });
        closeModalDirect(); showToast('Disciplina atualizada!');
        carregarDisciplinas($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   FREQUÊNCIA
════════════════════════════════════════════════════════ */
async function carregarFrequencia(c) {
    loading(c);
    try {
        const alunos = await apiFetch('/alunos');
        const items = alunos.map(a => `
          <div class="freq-item">
            <div>
              <span>${a.nome}</span>
              <div style="font-size:12px;color:var(--muted)">${a.serie} · ${a.turno}</div>
            </div>
            <div class="freq-toggle">
              <label>
                <input type="checkbox" id="freq-${a.id}" checked> Presente
              </label>
            </div>
          </div>`).join('');

        c.innerHTML = shell('Frequência',
            `<div class="content-card">
               <div class="card-head">
                 <h3><i class="fa-solid fa-calendar-check"></i> Registrar Presença — ${new Date().toLocaleDateString('pt-BR')}</h3>
                 <div style="display:flex;gap:8px">
                   <button class="btn btn-sm btn-ghost" onclick="marcarTodos(true)">Todos Presentes</button>
                   <button class="btn btn-sm btn-ghost" onclick="marcarTodos(false)">Todos Faltosos</button>
                 </div>
               </div>
               <div class="card-body">
                 ${alunos.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-users"></i><p>Nenhum aluno.</p></div>`
                   : `<div class="freq-list" id="freq-list">${items}</div>
                      <div class="form-actions">
                        <button class="btn btn-primary" onclick="salvarFrequencia([${alunos.map(a=>a.id).join(',')}])">
                          <i class="fa-solid fa-floppy-disk"></i> Salvar Frequência
                        </button>
                      </div>`}
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Frequência', erroCard(e.message)); }
}

function marcarTodos(p) { document.querySelectorAll('#freq-list input[type="checkbox"]').forEach(cb => cb.checked = p); }

async function salvarFrequencia(ids) {
    const registros = ids.map(id => ({ aluno_id: id, presente: document.getElementById(`freq-${id}`)?.checked ?? true }));
    try {
        await apiFetch('/frequencia', { method: 'POST', body: JSON.stringify(registros) });
        showToast('Frequência registrada!');
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   NOTAS
════════════════════════════════════════════════════════ */
async function carregarNotas(c) {
    loading(c);
    try {
        const [alunos, discs] = await Promise.all([apiFetch('/alunos'), apiFetch('/disciplinas')]);
        const optsAluno = alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
        const optsDisc  = discs.map(d => `<option value="${d.nome}">${d.nome}</option>`).join('');

        c.innerHTML = shell('Lançamento de Notas',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-star-half-stroke"></i> Lançar Nota</h3></div>
               <div class="card-body">
                 <div class="form-row cols-2">
                   <div class="form-group"><label>Aluno *</label>
                     <select id="n-aluno" onchange="buscarNotasAluno(this.value)">
                       <option value="">Selecione o aluno</option>${optsAluno}
                     </select>
                   </div>
                   <div class="form-group"><label>Bimestre *</label>
                     <select id="n-bim">
                       <option value="">Selecione</option>
                       <option value="1">1º Bimestre</option><option value="2">2º Bimestre</option>
                       <option value="3">3º Bimestre</option><option value="4">4º Bimestre</option>
                     </select>
                   </div>
                 </div>
                 <div class="form-row cols-2">
                   <div class="form-group"><label>Disciplina *</label>
                     <select id="n-disc">
                       <option value="">Selecione a disciplina</option>${optsDisc}
                     </select>
                   </div>
                   <div class="form-group"><label>Nota (0 – 10) *</label>
                     <input type="number" id="n-val" placeholder="Ex: 8.5" min="0" max="10" step="0.1">
                   </div>
                 </div>
                 <div class="form-actions">
                   <button class="btn btn-primary" onclick="salvarNota()">
                     <i class="fa-solid fa-floppy-disk"></i> Lançar Nota
                   </button>
                 </div>
               </div>
             </div>
             <div class="content-card" id="notas-historico">
               <div class="card-head"><h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico do Aluno</h3></div>
               <div class="card-body">
                 <div class="empty-state"><i class="fa-solid fa-user-graduate"></i><p>Selecione um aluno para ver suas notas.</p></div>
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Notas', erroCard(e.message)); }
}

async function buscarNotasAluno(id) {
    const box = $('notas-historico'); if (!id) return;
    const body = box.querySelector('.card-body');
    body.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
    try {
        const notas = await apiFetch(`/notas?aluno_id=${id}`);
        if (notas.length === 0) { body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-star"></i><p>Nenhuma nota lançada.</p></div>`; return; }
        const rows = notas.map(n => `
          <tr>
            <td>${n.bimestre}º Bimestre</td>
            <td>${n.materia}</td>
            <td><strong style="font-family:'JetBrains Mono',monospace">${Number(n.valor).toFixed(1)}</strong></td>
            <td><span class="badge ${Number(n.valor)>=6?'badge-ok':'badge-err'}">${Number(n.valor)>=6?'Aprovado':'Reprovado'}</span></td>
            ${isAdmin() ? `<td>${btnAdmin(`editarNota(${n.id},${n.bimestre},'${esc(n.materia)}',${n.valor})`, `excluirNota(${n.id},${id})`)}</td>` : ''}
          </tr>`).join('');
        body.innerHTML = `<div class="table-wrap"><table>
          <thead><tr><th>Bimestre</th><th>Disciplina</th><th>Nota</th><th>Situação</th>${isAdmin()?'<th>Ações</th>':''}</tr></thead>
          <tbody>${rows}</tbody></table></div>`;
    } catch (e) { body.innerHTML = erroCard(e.message); }
}

async function editarNota(id, bimestre, materia, valor) {
    const discs = await apiFetch('/disciplinas');
    const optsDisc = discs.map(d => `<option value="${d.nome}" ${d.nome===materia?'selected':''}>${d.nome}</option>`).join('');
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Nota</p>
      <div class="form-row cols-2">
        <div class="form-group"><label>Bimestre *</label>
          <select id="en-bim">
            ${[1,2,3,4].map(b=>`<option value="${b}" ${b==bimestre?'selected':''}>${b}º Bimestre</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Nota (0–10) *</label>
          <input type="number" id="en-val" value="${valor}" min="0" max="10" step="0.1">
        </div>
      </div>
      <div class="form-group"><label>Disciplina *</label>
        <select id="en-disc">${optsDisc}</select>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarNota(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function atualizarNota(id) {
    const bimestre = $('en-bim').value, materia = $('en-disc').value, valor = parseFloat($('en-val').value);
    if (!bimestre || !materia || isNaN(valor)) { showToast('Preencha todos os campos.', 'warning'); return; }
    try {
        await apiFetch(`/notas/${id}`, { method: 'PUT', body: JSON.stringify({ bimestre, materia, valor }) });
        closeModalDirect(); showToast('Nota atualizada!');
        const alunoId = $('n-aluno')?.value;
        if (alunoId) buscarNotasAluno(alunoId);
    } catch (e) { showToast(e.message, 'error'); }
}

async function excluirNota(id, alunoId) {
    if (!confirm('Excluir esta nota?')) return;
    try {
        await apiFetch(`/notas/${id}`, { method: 'DELETE' });
        showToast('Nota excluída.'); buscarNotasAluno(alunoId);
    } catch (e) { showToast(e.message, 'error'); }
}

async function salvarNota() {
    const aluno_id = $('n-aluno').value, bimestre = $('n-bim').value,
          materia  = $('n-disc').value, valor = parseFloat($('n-val').value);
    if (!aluno_id || !bimestre || !materia || isNaN(valor)) { showToast('Preencha todos os campos.', 'warning'); return; }
    if (valor < 0 || valor > 10) { showToast('Nota entre 0 e 10.', 'warning'); return; }
    try {
        await apiFetch('/notas', { method: 'POST', body: JSON.stringify({ aluno_id, bimestre, materia, valor }) });
        showToast('Nota lançada!');
        $('n-bim').value = ''; $('n-disc').value = ''; $('n-val').value = '';
        buscarNotasAluno(aluno_id);
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   DIÁRIO
════════════════════════════════════════════════════════ */
async function carregarDiario(c) {
    loading(c);
    try {
        const registros = await apiFetch('/diario');
        const rows = registros.map(r => `
          <tr>
            <td>${r.serie}</td><td>${r.turno}</td>
            <td style="max-width:280px">${r.conteudo?.substring(0,80)}${r.conteudo?.length>80?'…':''}</td>
            <td>${fmtDate(r.data_registro)}</td>
            ${isAdmin() ? `<td>${btnAdmin(`editarDiario(${r.id},'${esc(r.serie)}','${r.turno}',\`${esc(r.conteudo)}\`,\`${esc(r.observacoes||'')}\`)`, `excluir('diario',${r.id},carregarDiario)`)}</td>` : ''}
          </tr>`).join('');

        c.innerHTML = shell('Diário de Aula',
            `<div class="content-card" style="margin-bottom:20px">
               <div class="card-head"><h3><i class="fa-solid fa-pen-to-square"></i> Novo Registro</h3></div>
               <div class="card-body">
                 <div class="form-row cols-2">
                   <div class="form-group"><label>Série *</label>
                     <select id="di-serie">
                       <option value="">Selecione</option>
                       ${['1º Ano','2º Ano','3º Ano','4º Ano','5º Ano'].map(s=>`<option value="${s}">${s}</option>`).join('')}
                     </select>
                   </div>
                   <div class="form-group"><label>Turno *</label>
                     <select id="di-turno">
                       <option value="">Selecione</option>
                       <option value="Manhã">Manhã</option><option value="Tarde">Tarde</option>
                     </select>
                   </div>
                 </div>
                 <div class="form-group"><label>Conteúdo Ministrado *</label>
                   <textarea id="di-cont" placeholder="Descreva os temas abordados..."></textarea>
                 </div>
                 <div class="form-group"><label>Observações</label>
                   <textarea id="di-obs" placeholder="Comportamento, dificuldades..."></textarea>
                 </div>
                 <div class="form-actions">
                   <button class="btn btn-primary" onclick="salvarDiario()">
                     <i class="fa-solid fa-floppy-disk"></i> Registrar Aula
                   </button>
                 </div>
               </div>
             </div>
             <div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico</h3></div>
               <div class="card-body">
                 ${registros.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-book-bookmark"></i><p>Nenhum registro.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Série</th><th>Turno</th><th>Conteúdo</th><th>Data</th>${isAdmin()?'<th>Ações</th>':''}</tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Diário', erroCard(e.message)); }
}

function editarDiario(id, serie, turno, conteudo, obs) {
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Registro do Diário</p>
      <div class="form-row cols-2">
        <div class="form-group"><label>Série *</label>
          <select id="di-serie">
            ${['1º Ano','2º Ano','3º Ano','4º Ano','5º Ano'].map(s=>`<option value="${s}" ${s===serie?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Turno *</label>
          <select id="di-turno">
            <option value="Manhã" ${turno==='Manhã'?'selected':''}>Manhã</option>
            <option value="Tarde" ${turno==='Tarde'?'selected':''}>Tarde</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Conteúdo *</label>
        <textarea id="di-cont">${conteudo}</textarea>
      </div>
      <div class="form-group"><label>Observações</label>
        <textarea id="di-obs">${obs}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarDiario(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function salvarDiario() {
    const serie = $('di-serie').value, turno = $('di-turno').value,
          conteudo = $('di-cont').value.trim(), observacoes = $('di-obs').value.trim();
    if (!serie || !turno || !conteudo) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }
    try {
        await apiFetch('/diario', { method: 'POST', body: JSON.stringify({ serie, turno, conteudo, observacoes }) });
        showToast('Aula registrada!'); carregarDiario($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function atualizarDiario(id) {
    const serie = $('di-serie').value, turno = $('di-turno').value,
          conteudo = $('di-cont').value.trim(), observacoes = $('di-obs').value.trim();
    if (!serie || !turno || !conteudo) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }
    try {
        await apiFetch(`/diario/${id}`, { method: 'PUT', body: JSON.stringify({ serie, turno, conteudo, observacoes }) });
        closeModalDirect(); showToast('Registro atualizado!'); carregarDiario($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   FINANCEIRO
════════════════════════════════════════════════════════ */
async function carregarFinanceiro(c) {
    loading(c);
    try {
        const lista = await apiFetch('/financeiro');
        const inadim = lista.filter(a => !a.pago).length;
        const rows = lista.map(a => `
          <tr>
            <td><strong>${a.nome}</strong></td>
            <td>${a.serie||'-'}</td><td>${a.turno||'-'}</td>
            <td><span class="badge ${a.pago?'badge-ok':'badge-err'}">${a.pago?'Pago':'Pendente'}</span></td>
            <td>${a.valor_pago ? 'R$ '+Number(a.valor_pago).toFixed(2) : '-'}</td>
            <td>${fmtDate(a.data_pagamento)}</td>
            <td>
              ${!a.pago
                ? `<button class="btn btn-sm btn-success" onclick="modalPagamento(${a.id},'${esc(a.nome)}')">
                     <i class="fa-solid fa-circle-dollar-to-slot"></i> Registrar
                   </button>`
                : isAdmin()
                  ? `<button class="btn btn-sm btn-ghost" onclick="estornarPagamento(${a.id})" title="Estornar">
                       <i class="fa-solid fa-rotate-left"></i> Estornar
                     </button>`
                  : `<span style="color:var(--muted);font-size:12px">✓ Quitado</span>`}
            </td>
          </tr>`).join('');

        c.innerHTML = shell('Financeiro',
            `${inadim > 0
              ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;gap:10px;color:#b91c1c;font-size:14px">
                   <i class="fa-solid fa-triangle-exclamation"></i>
                   <strong>${inadim} aluno(s) com mensalidade em aberto</strong>
                 </div>` : ''}
             <div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-wallet"></i> Situação Financeira</h3></div>
               <div class="card-body">
                 ${lista.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-wallet"></i><p>Nenhum aluno.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Aluno</th><th>Série</th><th>Turno</th><th>Status</th><th>Valor</th><th>Data</th><th>Ação</th></tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Financeiro', erroCard(e.message)); }
}

function modalPagamento(aluno_id, nome) {
    openModal(`
      <p class="modal-title">Registrar Pagamento</p>
      <p style="color:var(--muted);font-size:14px;margin-bottom:20px">Aluno: <strong style="color:var(--text)">${nome}</strong></p>
      <div class="form-group"><label>Valor Pago (R$) *</label>
        <input type="number" id="fin-val" placeholder="Ex: 350.00" min="0" step="0.01">
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-success" onclick="salvarPagamento(${aluno_id})">
          <i class="fa-solid fa-circle-check"></i> Confirmar
        </button>
      </div>
    `);
}

async function salvarPagamento(aluno_id) {
    const valor = parseFloat($('fin-val').value);
    if (isNaN(valor) || valor <= 0) { showToast('Informe um valor válido.', 'warning'); return; }
    try {
        await apiFetch('/pagamentos', { method: 'POST', body: JSON.stringify({ aluno_id, valor }) });
        closeModalDirect(); showToast('Pagamento registrado!');
        carregarFinanceiro($('module-container')); carregarStats();
    } catch (e) { showToast(e.message, 'error'); }
}

async function estornarPagamento(aluno_id) {
    if (!confirm('Estornar pagamento e marcar como Pendente?')) return;
    try {
        await apiFetch(`/pagamentos/estornar/${aluno_id}`, { method: 'POST' });
        showToast('Pagamento estornado.'); carregarFinanceiro($('module-container')); carregarStats();
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   COMUNICADOS
════════════════════════════════════════════════════════ */
async function carregarComunicados(c) {
    loading(c);
    try {
        const comuns = await apiFetch('/comunicados');
        const rows = comuns.map(cm => `
          <tr>
            <td><strong>${cm.titulo}</strong></td>
            <td style="max-width:280px">${cm.mensagem?.substring(0,80)}${cm.mensagem?.length>80?'…':''}</td>
            <td><span class="badge badge-info">${cm.destinatario_tipo||'todos'}</span></td>
            <td>${fmtDate(cm.data_envio)}</td>
            ${isAdmin() ? `<td>${btnAdmin(`editarComunicado(${cm.id},'${esc(cm.titulo)}',\`${esc(cm.mensagem)}\`,'${cm.destinatario_tipo||'todos'}')`, `excluir('comunicados',${cm.id},carregarComunicados)`)}</td>` : ''}
          </tr>`).join('');

        c.innerHTML = shell('Comunicados',
            `<div class="content-card" style="margin-bottom:20px">
               <div class="card-head"><h3><i class="fa-solid fa-pen-nib"></i> Novo Comunicado</h3></div>
               <div class="card-body">
                 <div class="form-group"><label>Título *</label>
                   <input type="text" id="cm-titulo" placeholder="Ex: Reunião de Pais">
                 </div>
                 <div class="form-group"><label>Mensagem *</label>
                   <textarea id="cm-msg" placeholder="Escreva o comunicado..."></textarea>
                 </div>
                 <div class="form-group"><label>Destinatário</label>
                   <select id="cm-dest">
                     <option value="todos">Todos</option>
                     <option value="responsaveis">Responsáveis</option>
                     <option value="professores">Professores</option>
                     <option value="administrativo">Administrativo</option>
                   </select>
                 </div>
                 <div class="form-actions">
                   <button class="btn btn-primary" onclick="salvarComunicado()">
                     <i class="fa-solid fa-paper-plane"></i> Enviar
                   </button>
                 </div>
               </div>
             </div>
             <div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico</h3></div>
               <div class="card-body">
                 ${comuns.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-bullhorn"></i><p>Nenhum comunicado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Título</th><th>Mensagem</th><th>Destinatário</th><th>Data</th>${isAdmin()?'<th>Ações</th>':''}</tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Comunicados', erroCard(e.message)); }
}

function editarComunicado(id, titulo, mensagem, dest) {
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Comunicado</p>
      <div class="form-group"><label>Título *</label>
        <input type="text" id="cm-titulo" value="${titulo}">
      </div>
      <div class="form-group"><label>Mensagem *</label>
        <textarea id="cm-msg">${mensagem}</textarea>
      </div>
      <div class="form-group"><label>Destinatário</label>
        <select id="cm-dest">
          ${['todos','responsaveis','professores','administrativo'].map(d=>`<option value="${d}" ${d===dest?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarComunicado(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function salvarComunicado() {
    const titulo = $('cm-titulo').value.trim(), mensagem = $('cm-msg').value.trim(), destinatario_tipo = $('cm-dest').value;
    if (!titulo || !mensagem) { showToast('Preencha título e mensagem.', 'warning'); return; }
    try {
        await apiFetch('/comunicados', { method: 'POST', body: JSON.stringify({ titulo, mensagem, destinatario_tipo }) });
        showToast('Comunicado enviado!'); carregarComunicados($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function atualizarComunicado(id) {
    const titulo = $('cm-titulo').value.trim(), mensagem = $('cm-msg').value.trim(), destinatario_tipo = $('cm-dest').value;
    if (!titulo || !mensagem) { showToast('Preencha título e mensagem.', 'warning'); return; }
    try {
        await apiFetch(`/comunicados/${id}`, { method: 'PUT', body: JSON.stringify({ titulo, mensagem, destinatario_tipo }) });
        closeModalDirect(); showToast('Comunicado atualizado!'); carregarComunicados($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   RADAR
════════════════════════════════════════════════════════ */
async function carregarRadar(c) {
    loading(c);
    try {
        const alertas = await apiFetch('/radar');
        const items = alertas.map(a => `
          <div class="radar-item">
            <div>
              <div class="ra-name"><i class="fa-solid fa-circle-exclamation" style="color:var(--danger);margin-right:6px"></i>${a.nome}</div>
              <div class="ra-sub">${a.total_faltas} falta(s) registrada(s)</div>
            </div>
            <span class="badge badge-err"><i class="fa-solid fa-triangle-exclamation"></i> Risco ${a.total_faltas>=6?'Alto':'Médio'}</span>
          </div>`).join('');

        c.innerHTML = shell('Radar Pedagógico',
            `${alertas.length > 0
              ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;gap:10px;color:#b91c1c;font-size:14px">
                   <i class="fa-solid fa-satellite-dish"></i>
                   <strong>${alertas.length} aluno(s) com risco de evasão (≥ 3 faltas)</strong>
                 </div>` : ''}
             <div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-satellite-dish"></i> Alunos em Alerta</h3></div>
               <div class="card-body">
                 ${alertas.length === 0
                   ? `<div class="empty-state" style="color:var(--success)">
                        <i class="fa-solid fa-circle-check" style="opacity:.6"></i>
                        <p>Nenhum aluno com risco de evasão. 🎉</p>
                      </div>`
                   : `<div class="radar-list">${items}</div>`}
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Radar', erroCard(e.message)); }
}

/* ════════════════════════════════════════════════════════
   USUÁRIOS  ← SOMENTE ADMIN
════════════════════════════════════════════════════════ */
async function carregarUsuarios(c) {
    if (!isAdmin()) { c.innerHTML = shell('Usuários', erroCard('Acesso restrito ao administrador.')); return; }
    loading(c);
    try {
        const users = await apiFetch('/usuarios');
        const rows = users.map(u => `
          <tr>
            <td><strong>${u.nome}</strong></td>
            <td><code style="font-family:'JetBrains Mono',monospace;font-size:13px">${u.username}</code></td>
            <td>
              <span class="badge ${u.perfil==='admin'?'badge-info':'badge-ok'}">
                <i class="fa-solid ${u.perfil==='admin'?'fa-shield-halved':'fa-user'}"></i>
                ${u.perfil==='admin'?'Administrador':'Usuário'}
              </span>
            </td>
            <td>${btnAdmin(`editarUsuario(${u.id},'${esc(u.nome)}','${esc(u.username)}','${u.perfil}')`, `excluirUsuario(${u.id})`)}</td>
          </tr>`).join('');

        c.innerHTML = shell('Gerenciar Usuários',
            `<div class="content-card">
               <div class="card-head">
                 <h3><i class="fa-solid fa-users-gear"></i> Usuários do Sistema (${users.length})</h3>
               </div>
               <div class="card-body">
                 ${users.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-users"></i><p>Nenhum usuário cadastrado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Nome</th><th>Login</th><th>Perfil</th><th>Ações</th></tr></thead>
                       <tbody>${rows}</tbody></table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovoUsuario()"><i class="fa-solid fa-plus"></i> Novo Usuário</button>`
        );
    } catch (e) { c.innerHTML = shell('Usuários', erroCard(e.message)); }
}

function modalNovoUsuario() {
    openModal(`
      <p class="modal-title">Criar Novo Usuário</p>
      <div class="form-row cols-2">
        <div class="form-group"><label>Nome Completo *</label>
          <input type="text" id="u-nome" placeholder="Ex: Maria Souza">
        </div>
        <div class="form-group"><label>Login (username) *</label>
          <input type="text" id="u-user" placeholder="Ex: maria.souza">
        </div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Senha *</label>
          <input type="password" id="u-pass" placeholder="Senha de acesso">
        </div>
        <div class="form-group"><label>Perfil *</label>
          <select id="u-perfil">
            <option value="usuario">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarUsuario()"><i class="fa-solid fa-floppy-disk"></i> Criar</button>
      </div>
    `);
}

function editarUsuario(id, nome, username, perfil) {
    openModal(`
      <p class="modal-title"><i class="fa-solid fa-pen" style="color:var(--secondary)"></i> Editar Usuário</p>
      <div class="form-row cols-2">
        <div class="form-group"><label>Nome Completo *</label>
          <input type="text" id="u-nome" value="${nome}">
        </div>
        <div class="form-group"><label>Login (username) *</label>
          <input type="text" id="u-user" value="${username}">
        </div>
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Nova Senha <span style="color:var(--muted);font-size:11px">(deixe em branco para manter)</span></label>
          <input type="password" id="u-pass" placeholder="Nova senha (opcional)">
        </div>
        <div class="form-group"><label>Perfil *</label>
          <select id="u-perfil">
            <option value="usuario" ${perfil==='usuario'?'selected':''}>Usuário</option>
            <option value="admin" ${perfil==='admin'?'selected':''}>Administrador</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="atualizarUsuario(${id})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      </div>
    `);
}

async function salvarUsuario() {
    const nome = $('u-nome').value.trim(), username = $('u-user').value.trim(),
          password = $('u-pass').value, perfil = $('u-perfil').value;
    if (!nome || !username || !password) { showToast('Preencha todos os campos.', 'warning'); return; }
    try {
        await apiFetch('/usuarios', { method: 'POST', body: JSON.stringify({ nome, username, password, perfil }) });
        closeModalDirect(); showToast('Usuário criado!'); carregarUsuarios($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function atualizarUsuario(id) {
    const nome = $('u-nome').value.trim(), username = $('u-user').value.trim(),
          password = $('u-pass').value, perfil = $('u-perfil').value;
    if (!nome || !username) { showToast('Preencha nome e login.', 'warning'); return; }
    try {
        await apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify({ nome, username, password, perfil }) });
        closeModalDirect(); showToast('Usuário atualizado!'); carregarUsuarios($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

async function excluirUsuario(id) {
    if (!confirm('Excluir este usuário? Esta ação não pode ser desfeita.')) return;
    try {
        await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
        showToast('Usuário excluído.'); carregarUsuarios($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ════════════════════════════════════════════════════════
   UTILITÁRIO GENÉRICO DE EXCLUSÃO
════════════════════════════════════════════════════════ */
async function excluir(endpoint, id, recarregarFn) {
    if (!confirm('Confirma a exclusão deste registro?')) return;
    try {
        await apiFetch(`/${endpoint}/${id}`, { method: 'DELETE' });
        showToast('Registro excluído.');
        recarregarFn($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

// Escapa aspas simples para uso em atributos HTML onclick
function esc(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/`/g, '\\`');
}
