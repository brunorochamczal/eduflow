import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Puxa a URL do Neon das variáveis de ambiente do Railway
DATABASE_URL = os.environ.get('DATABASE_URL')

def conectar_bd():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def criar_tabela():
    conn = conectar_bd()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS alunos (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            turma TEXT NOT NULL,
            nota INTEGER NOT NULL
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()

@app.route('/alunos', methods=['GET'])
def obter_alunos():
    conn = conectar_bd()
    cur = conn.cursor()
    cur.execute('SELECT * FROM alunos ORDER BY id ASC')
    alunos = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(alunos)

@app.route('/alunos', methods=['POST'])
def adicionar_aluno():
    dados = request.get_json()
    conn = conectar_bd()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO alunos (nome, turma, nota) VALUES (%s, %s, %s) RETURNING id',
        (dados['nome'], dados['turma'], dados['nota'])
    )
    novo_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": novo_id, **dados}), 201

# --- NOVOS ENDPOINTS ADAPTADOS PARA POSTGRES ---

@app.route('/alunos/<int:id>', methods=['PUT'])
def atualizar_aluno(id):
    dados = request.get_json()
    conn = conectar_bd()
    cur = conn.cursor()
    cur.execute(
        'UPDATE alunos SET nome = %s, turma = %s, nota = %s WHERE id = %s',
        (dados['nome'], dados['turma'], dados['nota'], id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"mensagem": "Atualizado com sucesso"}), 200

@app.route('/alunos/<int:id>', methods=['DELETE'])
def eliminar_aluno(id):
    conn = conectar_bd()
    cur = conn.cursor()
    cur.execute('DELETE FROM alunos WHERE id = %s', (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"mensagem": "Eliminado com sucesso"}), 200

if __name__ == '__main__':
    criar_tabela()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)