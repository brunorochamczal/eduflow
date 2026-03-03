import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

@app.route('/')
def index():
    return render_template('index.html')

# --- AUTENTICAÇÃO E BI ---
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

@app.route('/api/stats', methods=['GET'])
def stats():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as total, SUM(CASE WHEN pago THEN 1 ELSE 0 END) as pagos FROM alunos")
    res = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify(res)

# --- ROTAS DE GESTÃO (RESTORED) ---

@app.route('/api/alunos', methods=['GET', 'POST'])
def gerenciar_alunos():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO alunos (nome, serie, turno) VALUES (%s, %s, %s)', (d['nome'], d['serie'], d['turno']))
        conn.commit()
        msg = {"status": "Aluno matriculado"}
    else:
        cur.execute('SELECT * FROM alunos ORDER BY nome')
        msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

@app.route('/api/professores', methods=['GET', 'POST'])
def gerenciar_professores():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO professores (nome, especialidade, email) VALUES (%s, %s, %s)', (d['nome'], d['especialidade'], d.get('email')))
        conn.commit()
        msg = {"status": "Professor cadastrado"}
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
        cur.execute('INSERT INTO disciplinas (nome, carga_horaria) VALUES (%s, %s)', (d['nome'], d['carga_horaria']))
        conn.commit()
        return jsonify({"status": "Disciplina cadastrada"})
    cur.execute('SELECT * FROM disciplinas ORDER BY nome')
    res = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(res)

@app.route('/api/diario', methods=['GET', 'POST'])
def gerenciar_diario():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO diario (serie, turno, conteudo, observacoes) VALUES (%s, %s, %s, %s)', (d['serie'], d['turno'], d['conteudo'], d.get('observacoes')))
        conn.commit()
        return jsonify({"status": "Registro salvo"})
    cur.execute('SELECT * FROM diario ORDER BY data_registro DESC')
    res = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(res)

# Rota dinâmica para suporte ao script.js antigo
@app.route('/api/cadastrar/<tipo>', methods=['POST'])
def cadastrar_dinamico(tipo):
    if tipo == 'alunos': return gerenciar_alunos()
    if tipo == 'professores': return gerenciar_professores()
    return jsonify({"error": "Rota não encontrada"}), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)




