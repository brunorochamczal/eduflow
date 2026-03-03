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

# ── 1. AUTENTICAÇÃO — retorna perfil ────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    d = request.get_json()
    if not d or not d.get('user') or not d.get('pass'):
        return jsonify({"status": "erro", "mensagem": "Dados incompletos"}), 400
    try:
        conn = get_db(); cur = conn.cursor()
        try:
            cur.execute(
                "SELECT id, username, nome, COALESCE(perfil,'usuario') AS perfil "
                "FROM usuarios WHERE username=%s AND password=%s",
                (d['user'], d['pass'])
            )
        except Exception:
            conn.rollback()
            cur.execute(
                "SELECT id, username, nome FROM usuarios WHERE username=%s AND password=%s",
                (d['user'], d['pass'])
            )
        user = cur.fetchone()
        cur.close(); conn.close()
        if user:
            u = dict(user)
            if 'perfil' not in u:
                u['perfil'] = 'admin' if u.get('username') == 'admin' else 'usuario'
            return jsonify({"status": "sucesso", "user": u}), 200
        return jsonify({"status": "erro", "mensagem": "Usuário ou senha incorretos"}), 401
    except Exception as e:
        return jsonify({"status": "erro", "mensagem": str(e)}), 500

# ── 2. STATS E RADAR ────────────────────────────────────
@app.route('/api/stats')
def stats():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN pago THEN 1 ELSE 0 END) AS pagos FROM alunos")
        res = cur.fetchone(); cur.close(); conn.close()
        return jsonify(dict(res))
    except Exception as e:
        return jsonify({"total": 0, "pagos": 0}), 500

@app.route('/api/radar')
def radar():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT a.id, a.nome, COUNT(f.id) AS total_faltas
            FROM alunos a JOIN frequencia f ON a.id=f.aluno_id
            WHERE f.presente=FALSE GROUP BY a.id,a.nome
            HAVING COUNT(f.id)>=3 ORDER BY total_faltas DESC
        """)
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except: return jsonify([])

# ── 3. ALUNOS ───────────────────────────────────────────
@app.route('/api/alunos', methods=['GET','POST'])
def gerenciar_alunos():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute('INSERT INTO alunos (nome,serie,turno,responsavel_celular) VALUES(%s,%s,%s,%s)',
                        (d['nome'],d['serie'],d['turno'],d.get('celular')))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute('SELECT * FROM alunos ORDER BY nome')
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/alunos/<int:id>', methods=['PUT','DELETE'])
def aluno_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE alunos SET nome=%s,serie=%s,turno=%s,responsavel_celular=%s WHERE id=%s',
                        (d['nome'],d['serie'],d['turno'],d.get('celular'),id))
        else:
            cur.execute('DELETE FROM alunos WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 4. PROFESSORES ──────────────────────────────────────
@app.route('/api/professores', methods=['GET','POST'])
def gerenciar_professores():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute('INSERT INTO professores (nome,especialidade,email) VALUES(%s,%s,%s)',
                        (d['nome'],d.get('materia'),d.get('email')))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute('SELECT * FROM professores ORDER BY nome')
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/professores/<int:id>', methods=['PUT','DELETE'])
def professor_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE professores SET nome=%s,especialidade=%s,email=%s WHERE id=%s',
                        (d['nome'],d.get('materia'),d.get('email'),id))
        else:
            cur.execute('DELETE FROM professores WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 5. DISCIPLINAS ──────────────────────────────────────
@app.route('/api/disciplinas', methods=['GET','POST'])
def gerenciar_disciplinas():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute('INSERT INTO disciplinas (nome,carga_horaria) VALUES(%s,%s)',
                        (d['nome'],d.get('carga_horaria')))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute('SELECT * FROM disciplinas ORDER BY nome')
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/disciplinas/<int:id>', methods=['PUT','DELETE'])
def disciplina_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE disciplinas SET nome=%s,carga_horaria=%s WHERE id=%s',
                        (d['nome'],d.get('carga_horaria'),id))
        else:
            cur.execute('DELETE FROM disciplinas WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 6. TURMAS ───────────────────────────────────────────
@app.route('/api/turmas', methods=['GET','POST'])
def gerenciar_turmas():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute('INSERT INTO turmas (nome,professor_id) VALUES(%s,%s)',
                        (d['nome'],d.get('professor_id')))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute("""SELECT t.*,p.nome AS professor_nome FROM turmas t
                       LEFT JOIN professores p ON t.professor_id=p.id ORDER BY t.nome""")
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/turmas/<int:id>', methods=['PUT','DELETE'])
def turma_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE turmas SET nome=%s,professor_id=%s WHERE id=%s',
                        (d['nome'],d.get('professor_id'),id))
        else:
            cur.execute('DELETE FROM turmas WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 7. NOTAS ────────────────────────────────────────────
@app.route('/api/notas', methods=['GET','POST'])
def gerenciar_notas():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute('INSERT INTO notas (aluno_id,bimestre,materia,valor) VALUES(%s,%s,%s,%s)',
                        (d['aluno_id'],d['bimestre'],d['materia'],d['valor']))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        aluno_id = request.args.get('aluno_id')
        q = "SELECT n.*,a.nome AS aluno_nome FROM notas n JOIN alunos a ON n.aluno_id=a.id"
        if aluno_id:
            cur.execute(q+" WHERE n.aluno_id=%s ORDER BY n.bimestre,n.materia",(aluno_id,))
        else:
            cur.execute(q+" ORDER BY a.nome,n.bimestre")
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/notas/<int:id>', methods=['PUT','DELETE'])
def nota_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE notas SET bimestre=%s,materia=%s,valor=%s WHERE id=%s',
                        (d['bimestre'],d['materia'],d['valor'],id))
        else:
            cur.execute('DELETE FROM notas WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 8. DIÁRIO ───────────────────────────────────────────
@app.route('/api/diario', methods=['GET','POST'])
def gerenciar_diario():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute('INSERT INTO diario (serie,turno,conteudo,observacoes) VALUES(%s,%s,%s,%s)',
                        (d['serie'],d['turno'],d['conteudo'],d.get('observacoes')))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute('SELECT * FROM diario ORDER BY data_registro DESC')
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/diario/<int:id>', methods=['PUT','DELETE'])
def diario_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE diario SET serie=%s,turno=%s,conteudo=%s,observacoes=%s WHERE id=%s',
                        (d['serie'],d['turno'],d['conteudo'],d.get('observacoes'),id))
        else:
            cur.execute('DELETE FROM diario WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 9. FINANCEIRO ───────────────────────────────────────
@app.route('/api/financeiro')
def listar_financeiro():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT a.id,a.nome,a.serie,a.turno,a.pago,a.data_vencimento,
                   p.valor_pago,p.data_pagamento
            FROM alunos a
            LEFT JOIN pagamentos p ON a.id=p.aluno_id
                AND p.id=(SELECT MAX(id) FROM pagamentos WHERE aluno_id=a.id)
            ORDER BY a.pago ASC,a.nome ASC
        """)
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/pagamentos', methods=['POST'])
def registrar_pagamento():
    try:
        d = request.get_json()
        conn = get_db(); cur = conn.cursor()
        cur.execute('INSERT INTO pagamentos (aluno_id,valor_pago) VALUES(%s,%s)',(d['aluno_id'],d['valor']))
        cur.execute('UPDATE alunos SET pago=TRUE WHERE id=%s',(d['aluno_id'],))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"}), 201
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/pagamentos/estornar/<int:aluno_id>', methods=['POST'])
def estornar_pagamento(aluno_id):
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute('UPDATE alunos SET pago=FALSE WHERE id=%s',(aluno_id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 10. FREQUÊNCIA ──────────────────────────────────────
@app.route('/api/frequencia', methods=['GET','POST'])
def gerenciar_frequencia():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            for reg in request.get_json():
                cur.execute('INSERT INTO frequencia (aluno_id,presente) VALUES(%s,%s)',
                            (reg['aluno_id'],reg.get('presente',True)))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute("""SELECT f.*,a.nome AS aluno_nome FROM frequencia f
                       JOIN alunos a ON f.aluno_id=a.id ORDER BY f.data_aula DESC,a.nome""")
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/frequencia/<int:id>', methods=['PUT','DELETE'])
def frequencia_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE frequencia SET presente=%s WHERE id=%s',(d['presente'],id))
        else:
            cur.execute('DELETE FROM frequencia WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 11. COMUNICADOS ─────────────────────────────────────
@app.route('/api/comunicados', methods=['GET','POST'])
def gerenciar_comunicados():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute('INSERT INTO comunicados (titulo,mensagem,destinatario_tipo) VALUES(%s,%s,%s)',
                        (d['titulo'],d['mensagem'],d.get('destinatario_tipo','todos')))
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute('SELECT * FROM comunicados ORDER BY data_envio DESC')
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/comunicados/<int:id>', methods=['PUT','DELETE'])
def comunicado_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            cur.execute('UPDATE comunicados SET titulo=%s,mensagem=%s,destinatario_tipo=%s WHERE id=%s',
                        (d['titulo'],d['mensagem'],d.get('destinatario_tipo','todos'),id))
        else:
            cur.execute('DELETE FROM comunicados WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

# ── 12. USUÁRIOS (somente admin) ────────────────────────
@app.route('/api/usuarios', methods=['GET','POST'])
def gerenciar_usuarios():
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'POST':
            d = request.get_json()
            cur.execute(
                "INSERT INTO usuarios (username,password,nome,perfil) VALUES(%s,%s,%s,%s)",
                (d['username'],d['password'],d['nome'],d.get('perfil','usuario'))
            )
            conn.commit(); cur.close(); conn.close()
            return jsonify({"status":"sucesso"}), 201
        cur.execute("SELECT id,username,nome,COALESCE(perfil,'usuario') AS perfil FROM usuarios ORDER BY nome")
        rows = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

@app.route('/api/usuarios/<int:id>', methods=['PUT','DELETE'])
def usuario_por_id(id):
    try:
        conn = get_db(); cur = conn.cursor()
        if request.method == 'PUT':
            d = request.get_json()
            if d.get('password'):
                cur.execute(
                    "UPDATE usuarios SET nome=%s,username=%s,password=%s,perfil=%s WHERE id=%s",
                    (d['nome'],d['username'],d['password'],d.get('perfil','usuario'),id)
                )
            else:
                cur.execute(
                    "UPDATE usuarios SET nome=%s,username=%s,perfil=%s WHERE id=%s",
                    (d['nome'],d['username'],d.get('perfil','usuario'),id)
                )
        else:
            cur.execute('DELETE FROM usuarios WHERE id=%s',(id,))
        conn.commit(); cur.close(); conn.close()
        return jsonify({"status":"sucesso"})
    except Exception as e: return jsonify({"status":"erro","mensagem":str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

