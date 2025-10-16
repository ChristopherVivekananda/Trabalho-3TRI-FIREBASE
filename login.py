# login.py  (corrigido)
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5000"]}})

cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'login-fa00d-firebase-adminsdk-fbsvc-6131a6c7cd.json')
if not os.path.exists(cred_path):
    raise RuntimeError(f"Arquivo de credenciais não encontrado: {cred_path}")

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

# --- Rotas ---
@app.route('/')
def index():
    # serve o login.html que está no mesmo diretório
    return render_template('login.html')

@app.route('/adicionar-usuario', methods=['POST'])
def adicionar_usuario():
    try:
        data = request.json or {}
        # validações mínimas
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip()
        idade = data.get('idade')
        cidade = data.get('cidade', '').strip()

        if not nome or not email or not idade or not cidade:
            return jsonify({'success': False, 'message': 'Todos os campos são obrigatórios.'}), 400

        # converter idade para int de forma segura
        try:
            idade = int(idade)
        except ValueError:
            return jsonify({'success': False, 'message': 'Idade inválida.'}), 400

        doc_ref = db.collection('usuarios').document()
        doc_ref.set({
            'nome': nome,
            'email': email,
            'idade': idade,
            'cidade': cidade,
            'data_criacao': datetime.utcnow(),
            'ativo': True
        })
        return jsonify({'success': True, 'message': 'Usuário cadastrado com sucesso!', 'id': doc_ref.id}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao cadastrar usuário: {str(e)}'}), 500

@app.route('/listar-usuarios', methods=['GET'])
def listar_usuarios():
    try:
        usuarios_ref = db.collection('usuarios')
        docs = usuarios_ref.stream()
        usuarios = []
        for doc in docs:
            usuario_data = doc.to_dict() or {}
            usuario_data['id'] = doc.id
            # converter datetime para string, se existir
            if 'data_criacao' in usuario_data and hasattr(usuario_data['data_criacao'], 'isoformat'):
                try:
                    usuario_data['data_criacao'] = usuario_data['data_criacao'].isoformat()
                except Exception:
                    usuario_data['data_criacao'] = str(usuario_data['data_criacao'])
            usuarios.append(usuario_data)
        return jsonify({'success': True, 'usuarios': usuarios}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar usuários: {str(e)}'}), 500

@app.route('/deletar-usuario/<user_id>', methods=['DELETE'])
def deletar_usuario(user_id):
    try:
        db.collection('usuarios').document(user_id).delete()
        return jsonify({'success': True, 'message': 'Usuário deletado com sucesso!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao deletar usuário: {str(e)}'}), 500

if __name__ == '__main__':
    # Em dev:
    app.run(debug=True, host='127.0.0.1', port=5000)
