import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# --- ROTAS DE ALUNOS (MATRÍCULAS) ---
@app.route('/alunos', methods=['GET'])
def listar_alunos():
    serie = request.args.get('serie')
    conn = get_db()
    cur = conn.cursor()
    if serie:
        cur.execute('SELECT * FROM alunos WHERE serie = %s ORDER BY nome', (serie,))
    else:
        cur.execute('SELECT * FROM alunos ORDER BY nome')
    res = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(res)

@app.route('/alunos', methods=['POST'])
def matricular():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO alunos (nome, serie, turno) VALUES (%s, %s, %s) RETURNING id',
                (d['nome'], d['serie'], d['turno']))
    novo_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": novo_id}), 201

# --- FINANCEIRO ---
@app.route('/pagamentos', methods=['POST'])
def registrar_pagamento():
    d = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    # Registra o valor e marca o aluno como "pago"
    cur.execute('INSERT INTO pagamentos (aluno_id, valor_pago) VALUES (%s, %s)', (d['aluno_id'], d['valor']))
    cur.execute('UPDATE alunos SET pago = TRUE WHERE id = %s', (d['aluno_id'],))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "sucesso"})

# --- RELATÓRIOS ---
@app.route('/relatorios', methods=['GET'])
def relatorios():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT SUM(valor_pago) as total FROM pagamentos')
    total = cur.fetchone()['total'] or 0
    cur.execute('SELECT COUNT(*) as devedores FROM alunos WHERE pago = FALSE')
    devedores = cur.fetchone()['devedores']
    cur.close()
    conn.close()
    return jsonify({"faturamento": float(total), "inadimplentes": devedores})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
