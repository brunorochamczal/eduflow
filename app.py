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
    return send_from_directory('.', 'index.html')

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

