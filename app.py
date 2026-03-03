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

# --- AUTENTICAÇÃO ---
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

# --- GESTÃO DE ALUNOS ---
@app.route('/api/alunos', methods=['GET', 'POST'])
def gerenciar_alunos():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO alunos (nome, serie, turno, celular) VALUES (%s, %s, %s, %s)', 
                    (d['nome'], d['serie'], d.get('turno', 'Manhã'), d.get('celular')))
        conn.commit()
        return jsonify({"status": "sucesso", "mensagem": "Aluno matriculado"})
    cur.execute('SELECT * FROM alunos ORDER BY nome')
    msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

# --- DIÁRIO DE CLASSE (Rota que faltava integração) ---
@app.route('/api/diario', methods=['GET', 'POST'])
def gerenciar_diario():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO diario (serie, turno, conteudo, observacoes) VALUES (%s, %s, %s, %s)',
                    (d['serie'], d['turno'], d['conteudo'], d.get('observacoes')))
        conn.commit()
        return jsonify({"status": "sucesso"})
    cur.execute('SELECT * FROM diario ORDER BY data_registro DESC')
    msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

# --- PROFESSORES ---
@app.route('/api/professores', methods=['GET', 'POST'])
def gerenciar_professores():
    conn = get_db()
    cur = conn.cursor()
    if request.method == 'POST':
        d = request.get_json()
        cur.execute('INSERT INTO professores (nome, especialidade, email) VALUES (%s, %s, %s)', 
                    (d['nome'], d['materia'], d.get('email', '')))
        conn.commit()
        return jsonify({"status": "sucesso"})
    cur.execute('SELECT * FROM professores ORDER BY nome')
    msg = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(msg)

# --- ROTA DE SALVAMENTO DINÂMICO (Para o script.js) ---
@app.route('/api/cadastrar/<tipo>', methods=['POST'])
def cadastrar_via_js(tipo):
    if tipo == 'alunos': return gerenciar_alunos()
    if tipo == 'professores': return gerenciar_professores()
    if tipo == 'diario': return gerenciar_diario()
    return jsonify({"status": "erro", "mensagem": "Rota não definida"}), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)





