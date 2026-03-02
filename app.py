import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Puxa a Connection String das variáveis de ambiente do Railway
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# --- ROTA INICIAL (ENTREGA O FRONTEND) ---
@app.route('/')
def index():
    pasta_atual = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory('.', 'index.html')

@app.route('/style.css')
def css(): return send_from_directory('.', 'style.css')

@app.route('/script.js')
def js(): return send_from_directory('.', 'script.js')

# Login Simples
@app.route('/login', methods=['POST'])
def login():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM usuarios WHERE username = %s AND password = %s', (d['user'], d['pass']))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify(user) if user else (jsonify({"erro": "Invalido"}), 401)

# Endpoints de Cadastro (Exemplo Professores)
@app.route('/professores', methods=['POST'])
def add_professor():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO professores (nome, especialidade) VALUES (%s, %s)', (d['nome'], d['espec']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "ok"})

# --- ALUNOS E MATRÍCULAS ---
@app.route('/alunos', methods=['GET'])
def listar_alunos():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM alunos ORDER BY nome ASC')
    alunos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(alunos)

@app.route('/alunos', methods=['POST'])
def matricular():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO alunos (nome, serie, turno) VALUES (%s, %s, %s) RETURNING id',
        (d['nome'], d['serie'], d['turno'])
    )
    novo_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": novo_id}), 201

# --- FINANCEIRO E PAGAMENTOS ---
@app.route('/pagamentos', methods=['POST'])
def registrar_pagamento():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO pagamentos (aluno_id, valor_pago) VALUES (%s, %s)', (d['aluno_id'], d['valor']))
    cur.execute('UPDATE alunos SET pago = TRUE WHERE id = %s', (d['aluno_id'],))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "sucesso"})

# --- DIÁRIO E NOTAS ---
@app.route('/diario', methods=['POST'])
def salvar_diario():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO diario (serie, turno, conteudo) VALUES (%s, %s, %s)', 
                (d['serie'], d['turno'], d['conteudo']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "gravado"})

# --- RELATÓRIOS ---
@app.route('/relatorios', methods=['GET'])
def relatorios():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT COALESCE(SUM(valor_pago), 0) as total FROM pagamentos')
    total = cur.fetchone()['total']
    cur.execute('SELECT COUNT(*) as devedores FROM alunos WHERE pago = FALSE')
    devedores = cur.fetchone()['devedores']
    cur.close()
    conn.close()
    return jsonify({"faturamento": float(total), "inadimplentes": devedores})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)



