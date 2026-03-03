import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuração da Database (Neon/Railway)
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# --- NAVEGAÇÃO ---
@app.route('/')
def index():
    return render_template('index.html')

# --- 1. AUTENTICAÇÃO ---
@app.route('/api/login', methods=['POST'])
def login():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT username, nome FROM usuarios WHERE username = %s AND password = %s', (d['user'], d['pass']))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user: return jsonify({"status": "sucesso", "user": user}), 200
    return jsonify({"status": "erro", "mensagem": "Usuário ou senha incorretos"}), 401

# --- 2. RADAR PEDAGÓGICO E STATS ---
@app.route('/api/radar', methods=['GET'])
def radar():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT a.nome, COUNT(f.id) as total_faltas 
        FROM alunos a 
        JOIN frequencia f ON a.id = f.aluno_id 
        WHERE f.presente = FALSE 
        GROUP BY a.nome HAVING COUNT(f.id) >= 3
    ''')
    alertas = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(alertas)

@app.route('/api/stats', methods=['GET'])
def stats():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as total, SUM(CASE WHEN pago THEN 1 ELSE 0 END) as pagos FROM alunos")
    res = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify(res)

# --- 3. GESTÃO DE PROFESSORES E DISCIPLINAS ---
@app.route('/api/professores', methods=['GET', 'POST'])
def gerenciar_professores():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO professores (nome, especialidade, email) VALUES (%s, %s, %s)', 
                    (d['nome'], d['especialidade'], d.get('email')))
        conn.commit()
        msg = {"status": "sucesso"}
    else:
        cur.execute('SELECT * FROM professores ORDER BY nome')
        msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

@app.route('/api/disciplinas', methods=['GET', 'POST'])
def gerenciar_disciplinas():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO disciplinas (nome, carga_horaria) VALUES (%s, %s)', 
                    (d['nome'], d['carga_horaria']))
        conn.commit()
        msg = {"status": "sucesso"}
    else:
        cur.execute('SELECT * FROM disciplinas ORDER BY nome')
        msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

# --- 4. TURMAS E ALUNOS ---
@app.route('/api/turmas', methods=['GET', 'POST'])
def gerenciar_turmas():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO turmas (nome, professor_id) VALUES (%s, %s)', (d['nome'], d['professor_id']))
        conn.commit()
        msg = {"status": "sucesso"}
    else:
        cur.execute('SELECT t.*, p.nome as professor_nome FROM turmas t LEFT JOIN professores p ON t.professor_id = p.id ORDER BY t.nome')
        msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

@app.route('/api/alunos', methods=['GET', 'POST'])
def gerenciar_alunos():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO alunos (nome, serie, turno) VALUES (%s, %s, %s)', (d['nome'], d['serie'], d['turno']))
        conn.commit()
        msg = {"status": "sucesso"}
    else:
        cur.execute('SELECT * FROM alunos ORDER BY nome')
        msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

# --- 5. NOTAS E DIÁRIO ---
@app.route('/api/notas', methods=['POST'])
def lancar_nota():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO notes (aluno_id, bimestre, materia, valor) VALUES (%s, %s, %s, %s)',
                (d['aluno_id'], d['bimestre'], d['materia'], d['valor']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "sucesso"})

@app.route('/api/diario', methods=['GET', 'POST'])
def gerenciar_diario():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO diario (serie, turno, conteudo, observacoes) VALUES (%s, %s, %s, %s)',
                    (d['serie'], d['turno'], d['conteudo'], d.get('observacoes')))
        conn.commit()
        msg = {"status": "sucesso"}
    else:
        cur.execute('SELECT * FROM diario ORDER BY data_registro DESC')
        msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

# --- 6. FINANCEIRO ---
@app.route('/api/pagamentos', methods=['POST'])
def pagar():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO pagamentos (aluno_id, valor_pago) VALUES (%s, %s)', (d['aluno_id'], d['valor']))
    cur.execute('UPDATE alunos SET pago = TRUE WHERE id = %s', (d['aluno_id'],))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "sucesso"})

# --- 7. ROTA AUXILIAR PARA O FRONT ---
@app.route('/api/cadastrar/<tipo>', methods=['POST'])
def cadastrar_dinamico(tipo):
    if tipo == 'alunos': return gerenciar_alunos()
    if tipo == 'professores': return gerenciar_professores()
    return jsonify({"status": "erro", "mensagem": "Rota não encontrada"}), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)





