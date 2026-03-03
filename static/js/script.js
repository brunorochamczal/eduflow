/* ═══════════════════════════════════════════════════════
   EDUNEX · script.js  — Frontend completo
   ═══════════════════════════════════════════════════════ */

const API = window.location.origin + '/api';

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

        const nome = data.user?.nome || data.user?.username || 'Usuário';
        $('user-display').textContent = nome.split(' ')[0];
        $('sidebar-username').textContent = nome;
        $('sidebar-avatar').textContent = nome.charAt(0).toUpperCase();

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
    $('dashboard-screen').classList.add('hidden');
    $('login-screen').classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-section="home"]').classList.add('active');
}

function toggleSidebar() {
    $('sidebar').classList.toggle('open');
}

/* ─────────────────────────────────────────────────────────
   STATS DO DASHBOARD
───────────────────────────────────────────────────────── */
async function carregarStats() {
    try {
        const [stats, radar] = await Promise.all([
            apiFetch('/stats'),
            apiFetch('/radar')
        ]);
        const total  = Number(stats.total)  || 0;
        const pagos  = Number(stats.pagos)  || 0;
        const inadim = total - pagos;
        const alerts = Array.isArray(radar) ? radar.length : 0;

        $('stat-total').textContent   = total;
        $('stat-pagos').textContent   = pagos;
        $('stat-inadim').textContent  = inadim;
        $('stat-alertas').textContent = alerts;

        if (alerts > 0) $('notif-dot').classList.remove('hidden');
    } catch (_) { /* falha silenciosa */ }
}

/* ─────────────────────────────────────────────────────────
   NAVEGAÇÃO
───────────────────────────────────────────────────────── */
function showSection(section) {
    const home    = $('home-section');
    const dynamic = $('dynamic-content');
    const container = $('module-container');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-section="${section}"]`);
    if (btn) btn.classList.add('active');

    if (section === 'home') {
        home.classList.remove('hidden');
        dynamic.classList.add('hidden');
        carregarStats();
    } else {
        home.classList.add('hidden');
        dynamic.classList.remove('hidden');
        MODULOS[section] ? MODULOS[section](container) : semModulo(container, section);
    }

    $('sidebar').classList.remove('open');
}

/* ─────────────────────────────────────────────────────────
   SHELL DE MÓDULO
───────────────────────────────────────────────────────── */
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
   MÓDULOS
═══════════════════════════════════════════════════════ */
const MODULOS = {
    alunos:       carregarAlunos,
    professores:  carregarProfessores,
    turmas:       carregarTurmas,
    disciplinas:  carregarDisciplinas,
    frequencia:   carregarFrequencia,
    notas:        carregarNotas,
    diario:       carregarDiario,
    financeiro:   carregarFinanceiro,
    comunicados:  carregarComunicados,
    radar:        carregarRadar,
};

/* ────────────────────────────────
   ALUNOS
──────────────────────────────── */
async function carregarAlunos(c) {
    loading(c);
    try {
        const alunos = await apiFetch('/alunos');
        const rows = alunos.map(a => `
          <tr>
            <td><strong>${a.nome}</strong></td>
            <td>${a.serie}</td>
            <td>${a.turno}</td>
            <td>${a.responsavel_celular || a.celular || '-'}</td>
            <td>${fmtDate(a.data_matricula)}</td>
            <td><span class="badge ${a.pago ? 'badge-ok' : 'badge-err'}">${a.pago ? 'Pago' : 'Pendente'}</span></td>
          </tr>`).join('');

        c.innerHTML = shell('Alunos',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-user-graduate"></i> Alunos Matriculados (${alunos.length})</h3></div>
               <div class="card-body">
                 ${alunos.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-user-graduate"></i><p>Nenhum aluno cadastrado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Nome</th><th>Série</th><th>Turno</th><th>WhatsApp</th><th>Matrícula</th><th>Mensalidade</th></tr></thead>
                       <tbody>${rows}</tbody>
                      </table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovoAluno()"><i class="fa-solid fa-plus"></i> Novo Aluno</button>`
        );
    } catch (e) { c.innerHTML = shell('Alunos', erroCard(e.message)); }
}

function modalNovoAluno() {
    // Valores EXATOS aceitos pelo CHECK CONSTRAINT do banco:
    // alunos_serie_check: '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'
    // alunos_turno_check: 'Manhã', 'Tarde'
    openModal(`
      <p class="modal-title">Matricular Novo Aluno</p>
      <div class="form-group"><label>Nome Completo *</label>
        <input type="text" id="a-nome" placeholder="Ex: João da Silva">
      </div>
      <div class="form-row cols-2">
        <div class="form-group"><label>Série *</label>
          <select id="a-serie">
            <option value="">Selecione</option>
            <option value="1º Ano">1º Ano</option>
            <option value="2º Ano">2º Ano</option>
            <option value="3º Ano">3º Ano</option>
            <option value="4º Ano">4º Ano</option>
            <option value="5º Ano">5º Ano</option>
          </select>
        </div>
        <div class="form-group"><label>Turno *</label>
          <select id="a-turno">
            <option value="">Selecione</option>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
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

async function salvarAluno() {
    const nome   = $('a-nome').value.trim();
    const serie  = $('a-serie').value;
    const turno  = $('a-turno').value;
    const celular = $('a-cel').value.trim();

    if (!nome || !serie || !turno) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }

    try {
        await apiFetch('/alunos', { method: 'POST', body: JSON.stringify({ nome, serie, turno, celular }) });
        closeModalDirect();
        showToast('Aluno matriculado com sucesso!');
        carregarAlunos($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   PROFESSORES
──────────────────────────────── */
async function carregarProfessores(c) {
    loading(c);
    try {
        const profs = await apiFetch('/professores');
        const rows = profs.map(p => `
          <tr>
            <td><strong>${p.nome}</strong></td>
            <td>${p.especialidade || '-'}</td>
            <td>${p.email || '-'}</td>
          </tr>`).join('');

        c.innerHTML = shell('Professores',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-chalkboard-user"></i> Corpo Docente (${profs.length})</h3></div>
               <div class="card-body">
                 ${profs.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-chalkboard-user"></i><p>Nenhum professor cadastrado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Nome</th><th>Especialidade</th><th>E-mail</th></tr></thead>
                       <tbody>${rows}</tbody>
                      </table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovoProfessor()"><i class="fa-solid fa-plus"></i> Novo Professor</button>`
        );
    } catch (e) { c.innerHTML = shell('Professores', erroCard(e.message)); }
}

async function modalNovoProfessor() {
    // Busca disciplinas cadastradas no banco
    let optsDisc = '<option value="">Selecione a disciplina</option>';
    try {
        const discs = await apiFetch('/disciplinas');
        if (discs.length === 0) {
            optsDisc = '<option value="">Nenhuma disciplina cadastrada ainda</option>';
        } else {
            optsDisc += discs.map(d => `<option value="${d.nome}">${d.nome}</option>`).join('');
        }
    } catch (_) {
        optsDisc = '<option value="">Erro ao carregar disciplinas</option>';
    }

    openModal(`
      <p class="modal-title">Cadastrar Professor</p>
      <div class="form-group"><label>Nome Completo *</label>
        <input type="text" id="p-nome" placeholder="Ex: Prof. Maria Santos">
      </div>
      <div class="form-group"><label>Especialidade / Disciplina *</label>
        <select id="p-esp">${optsDisc}</select>
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

async function salvarProfessor() {
    const nome   = $('p-nome').value.trim();
    const materia = $('p-esp').value;
    const email  = $('p-email').value.trim();

    if (!nome || !materia) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }

    try {
        await apiFetch('/professores', { method: 'POST', body: JSON.stringify({ nome, materia, email }) });
        closeModalDirect();
        showToast('Professor cadastrado!');
        carregarProfessores($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   TURMAS
──────────────────────────────── */
async function carregarTurmas(c) {
    loading(c);
    try {
        const [turmas, profs] = await Promise.all([apiFetch('/turmas'), apiFetch('/professores')]);
        const rows = turmas.map(t => `
          <tr>
            <td><strong>${t.nome}</strong></td>
            <td>${t.professor_nome || '<span class="badge badge-warn">Sem professor</span>'}</td>
          </tr>`).join('');

        // Serializa profs para passar para a função
        window._profs = profs;

        c.innerHTML = shell('Turmas',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-school"></i> Turmas (${turmas.length})</h3></div>
               <div class="card-body">
                 ${turmas.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-school"></i><p>Nenhuma turma cadastrada.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Turma</th><th>Professor Responsável</th></tr></thead>
                       <tbody>${rows}</tbody>
                      </table></div>`}
               </div>
             </div>`,
            `<button class="btn btn-primary" onclick="modalNovaTurma()"><i class="fa-solid fa-plus"></i> Nova Turma</button>`
        );
    } catch (e) { c.innerHTML = shell('Turmas', erroCard(e.message)); }
}

function modalNovaTurma() {
    const profs = window._profs || [];
    const opts = profs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    openModal(`
      <p class="modal-title">Criar Nova Turma</p>
      <div class="form-group"><label>Nome da Turma *</label>
        <input type="text" id="t-nome" placeholder="Ex: 7º Ano A - Manhã">
      </div>
      <div class="form-group"><label>Professor Responsável</label>
        <select id="t-prof">
          <option value="">Sem professor</option>${opts}
        </select>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="closeModalDirect()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarTurma()"><i class="fa-solid fa-floppy-disk"></i> Criar</button>
      </div>
    `);
}

async function salvarTurma() {
    const nome = $('t-nome').value.trim();
    const professor_id = $('t-prof').value || null;
    if (!nome) { showToast('Informe o nome da turma.', 'warning'); return; }
    try {
        await apiFetch('/turmas', { method: 'POST', body: JSON.stringify({ nome, professor_id }) });
        closeModalDirect();
        showToast('Turma criada!');
        carregarTurmas($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   DISCIPLINAS
──────────────────────────────── */
async function carregarDisciplinas(c) {
    loading(c);
    try {
        const discs = await apiFetch('/disciplinas');
        const rows = discs.map(d => `
          <tr>
            <td><strong>${d.nome}</strong></td>
            <td>${d.carga_horaria ? d.carga_horaria + 'h/semana' : '-'}</td>
          </tr>`).join('');

        c.innerHTML = shell('Disciplinas',
            `<div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-book-open"></i> Disciplinas (${discs.length})</h3></div>
               <div class="card-body">
                 ${discs.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-book-open"></i><p>Nenhuma disciplina cadastrada.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Disciplina</th><th>Carga Horária</th></tr></thead>
                       <tbody>${rows}</tbody>
                      </table></div>`}
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

async function salvarDisciplina() {
    const nome = $('d-nome').value.trim();
    const carga_horaria = $('d-ch').value || null;
    if (!nome) { showToast('Informe o nome da disciplina.', 'warning'); return; }
    try {
        await apiFetch('/disciplinas', { method: 'POST', body: JSON.stringify({ nome, carga_horaria }) });
        closeModalDirect();
        showToast('Disciplina cadastrada!');
        carregarDisciplinas($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   FREQUÊNCIA
──────────────────────────────── */
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
                <input type="checkbox" id="freq-${a.id}" checked>
                Presente
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
                   ? `<div class="empty-state"><i class="fa-solid fa-users"></i><p>Nenhum aluno cadastrado.</p></div>`
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

function marcarTodos(presente) {
    document.querySelectorAll('#freq-list input[type="checkbox"]').forEach(cb => cb.checked = presente);
}

async function salvarFrequencia(ids) {
    const registros = ids.map(id => ({
        aluno_id: id,
        presente: document.getElementById(`freq-${id}`)?.checked ?? true
    }));
    try {
        await apiFetch('/frequencia', { method: 'POST', body: JSON.stringify(registros) });
        showToast('Frequência registrada com sucesso!');
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   NOTAS
──────────────────────────────── */
async function carregarNotas(c) {
    loading(c);
    try {
        // Busca alunos E disciplinas em paralelo
        const [alunos, discs] = await Promise.all([
            apiFetch('/alunos'),
            apiFetch('/disciplinas')
        ]);

        const optsAluno = alunos.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
        const optsDisc  = discs.length > 0
            ? discs.map(d => `<option value="${d.nome}">${d.nome}</option>`).join('')
            : '<option value="">Nenhuma disciplina cadastrada</option>';

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
                       <option value="1">1º Bimestre</option>
                       <option value="2">2º Bimestre</option>
                       <option value="3">3º Bimestre</option>
                       <option value="4">4º Bimestre</option>
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
                 <div class="empty-state"><i class="fa-solid fa-user-graduate"></i><p>Selecione um aluno acima para ver suas notas.</p></div>
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Notas', erroCard(e.message)); }
}

async function buscarNotasAluno(id) {
    const box = $('notas-historico');
    if (!id) return;
    const body = box.querySelector('.card-body');
    body.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Carregando...</span></div>`;
    try {
        const notas = await apiFetch(`/notas?aluno_id=${id}`);
        if (notas.length === 0) {
            body.innerHTML = `<div class="empty-state"><i class="fa-solid fa-star"></i><p>Nenhuma nota lançada para este aluno.</p></div>`;
            return;
        }
        const rows = notas.map(n => `
          <tr>
            <td>${n.bimestre}º Bimestre</td>
            <td>${n.materia}</td>
            <td><strong style="font-family:'JetBrains Mono',monospace;font-size:15px">${Number(n.valor).toFixed(1)}</strong></td>
            <td><span class="badge ${Number(n.valor) >= 6 ? 'badge-ok' : 'badge-err'}">${Number(n.valor) >= 6 ? 'Aprovado' : 'Reprovado'}</span></td>
          </tr>`).join('');
        body.innerHTML = `<div class="table-wrap"><table>
          <thead><tr><th>Bimestre</th><th>Disciplina</th><th>Nota</th><th>Situação</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`;
    } catch (e) { body.innerHTML = erroCard(e.message); }
}

async function salvarNota() {
    const aluno_id = $('n-aluno').value;
    const bimestre = $('n-bim').value;
    const materia  = $('n-disc').value;
    const valor    = parseFloat($('n-val').value);

    if (!aluno_id || !bimestre || !materia || isNaN(valor)) {
        showToast('Preencha todos os campos.', 'warning'); return;
    }
    if (valor < 0 || valor > 10) {
        showToast('Nota deve ser entre 0 e 10.', 'warning'); return;
    }
    try {
        await apiFetch('/notas', { method: 'POST', body: JSON.stringify({ aluno_id, bimestre, materia, valor }) });
        showToast('Nota lançada!');
        $('n-bim').value = '';
        $('n-disc').value = '';
        $('n-val').value = '';
        buscarNotasAluno(aluno_id);
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   DIÁRIO
──────────────────────────────── */
async function carregarDiario(c) {
    loading(c);
    try {
        const registros = await apiFetch('/diario');
        const rows = registros.map(r => `
          <tr>
            <td>${r.serie}</td>
            <td>${r.turno}</td>
            <td style="max-width:300px">${r.conteudo?.substring(0,80)}${r.conteudo?.length > 80 ? '…' : ''}</td>
            <td style="white-space:nowrap">${fmtDate(r.data_registro)}</td>
          </tr>`).join('');

        c.innerHTML = shell('Diário de Aula',
            `<div class="content-card" style="margin-bottom:20px">
               <div class="card-head"><h3><i class="fa-solid fa-pen-to-square"></i> Novo Registro</h3></div>
               <div class="card-body">
                 <div class="form-row cols-2">
                   <div class="form-group"><label>Série *</label>
                     <select id="di-serie">
                       <option value="">Selecione a série</option>
                       <option value="1º Ano">1º Ano</option>
                       <option value="2º Ano">2º Ano</option>
                       <option value="3º Ano">3º Ano</option>
                       <option value="4º Ano">4º Ano</option>
                       <option value="5º Ano">5º Ano</option>
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
                   <textarea id="di-cont" placeholder="Descreva os temas abordados na aula..."></textarea>
                 </div>
                 <div class="form-group"><label>Observações</label>
                   <textarea id="di-obs" placeholder="Comportamento, dificuldades, observações gerais..."></textarea>
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
                   ? `<div class="empty-state"><i class="fa-solid fa-book-bookmark"></i><p>Nenhum registro encontrado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Série</th><th>Turno</th><th>Conteúdo</th><th>Data</th></tr></thead>
                       <tbody>${rows}</tbody>
                      </table></div>`}
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Diário', erroCard(e.message)); }
}

async function salvarDiario() {
    const serie     = $('di-serie').value;
    const turno     = $('di-turno').value;
    const conteudo  = $('di-cont').value.trim();
    const observacoes = $('di-obs').value.trim();

    if (!serie || !turno || !conteudo) { showToast('Preencha os campos obrigatórios.', 'warning'); return; }

    try {
        await apiFetch('/diario', { method: 'POST', body: JSON.stringify({ serie, turno, conteudo, observacoes }) });
        showToast('Aula registrada no diário!');
        carregarDiario($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   FINANCEIRO
──────────────────────────────── */
async function carregarFinanceiro(c) {
    loading(c);
    try {
        const lista = await apiFetch('/financeiro');
        const rows = lista.map(a => `
          <tr>
            <td><strong>${a.nome}</strong></td>
            <td>${a.serie || '-'}</td>
            <td>${a.turno || '-'}</td>
            <td><span class="badge ${a.pago ? 'badge-ok' : 'badge-err'}">${a.pago ? 'Pago' : 'Pendente'}</span></td>
            <td>${a.valor_pago ? 'R$ ' + Number(a.valor_pago).toFixed(2) : '-'}</td>
            <td>${fmtDate(a.data_pagamento)}</td>
            <td>
              ${!a.pago
                ? `<button class="btn btn-sm btn-success" onclick="modalPagamento(${a.id}, '${a.nome.replace(/'/g,"\\'")}')">
                     <i class="fa-solid fa-circle-dollar-to-slot"></i> Registrar
                   </button>`
                : `<span style="color:var(--muted);font-size:12px">✓ Quitado</span>`}
            </td>
          </tr>`).join('');

        const inadim = lista.filter(a => !a.pago).length;

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
                   ? `<div class="empty-state"><i class="fa-solid fa-wallet"></i><p>Nenhum aluno cadastrado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Aluno</th><th>Série</th><th>Turno</th><th>Status</th><th>Valor Pago</th><th>Data Pgto.</th><th>Ação</th></tr></thead>
                       <tbody>${rows}</tbody>
                      </table></div>`}
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
          <i class="fa-solid fa-circle-check"></i> Confirmar Pagamento
        </button>
      </div>
    `);
}

async function salvarPagamento(aluno_id) {
    const valor = parseFloat($('fin-val').value);
    if (isNaN(valor) || valor <= 0) { showToast('Informe um valor válido.', 'warning'); return; }
    try {
        await apiFetch('/pagamentos', { method: 'POST', body: JSON.stringify({ aluno_id, valor }) });
        closeModalDirect();
        showToast('Pagamento registrado!');
        carregarFinanceiro($('module-container'));
        carregarStats();
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   COMUNICADOS
──────────────────────────────── */
async function carregarComunicados(c) {
    loading(c);
    try {
        const comuns = await apiFetch('/comunicados');
        const rows = comuns.map(cm => `
          <tr>
            <td><strong>${cm.titulo}</strong></td>
            <td style="max-width:280px">${cm.mensagem?.substring(0,80)}${cm.mensagem?.length > 80 ? '…' : ''}</td>
            <td><span class="badge badge-info">${cm.destinatario_tipo || 'todos'}</span></td>
            <td style="white-space:nowrap">${fmtDate(cm.data_envio)}</td>
          </tr>`).join('');

        c.innerHTML = shell('Comunicados',
            `<div class="content-card" style="margin-bottom:20px">
               <div class="card-head"><h3><i class="fa-solid fa-pen-nib"></i> Novo Comunicado</h3></div>
               <div class="card-body">
                 <div class="form-group"><label>Título *</label>
                   <input type="text" id="cm-titulo" placeholder="Ex: Reunião de Pais">
                 </div>
                 <div class="form-row cols-2">
                   <div class="form-group" style="grid-column:1/-1"><label>Mensagem *</label>
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
                 </div>
                 <div class="form-actions">
                   <button class="btn btn-primary" onclick="salvarComunicado()">
                     <i class="fa-solid fa-paper-plane"></i> Enviar Comunicado
                   </button>
                 </div>
               </div>
             </div>
             <div class="content-card">
               <div class="card-head"><h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico</h3></div>
               <div class="card-body">
                 ${comuns.length === 0
                   ? `<div class="empty-state"><i class="fa-solid fa-bullhorn"></i><p>Nenhum comunicado enviado.</p></div>`
                   : `<div class="table-wrap"><table>
                       <thead><tr><th>Título</th><th>Mensagem</th><th>Destinatário</th><th>Data</th></tr></thead>
                       <tbody>${rows}</tbody>
                      </table></div>`}
               </div>
             </div>`
        );
    } catch (e) { c.innerHTML = shell('Comunicados', erroCard(e.message)); }
}

async function salvarComunicado() {
    const titulo = $('cm-titulo').value.trim();
    const mensagem = $('cm-msg').value.trim();
    const destinatario_tipo = $('cm-dest').value;

    if (!titulo || !mensagem) { showToast('Preencha título e mensagem.', 'warning'); return; }

    try {
        await apiFetch('/comunicados', { method: 'POST', body: JSON.stringify({ titulo, mensagem, destinatario_tipo }) });
        showToast('Comunicado enviado!');
        carregarComunicados($('module-container'));
    } catch (e) { showToast(e.message, 'error'); }
}

/* ────────────────────────────────
   RADAR DE EVASÃO
──────────────────────────────── */
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
            <span class="badge badge-err"><i class="fa-solid fa-triangle-exclamation"></i> Risco ${a.total_faltas >= 6 ? 'Alto' : 'Médio'}</span>
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
