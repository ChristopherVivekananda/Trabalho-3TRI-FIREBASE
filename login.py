from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from flask import send_from_directory
import os

def serve_frontend():
    return send_from_directory('login.html')

cred = credentials.Certificate('login-fa00d-firebase-adminsdk-fbsvc-6131a6c7cd.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

app = Flask(__name__)
CORS(app)  # Permite requests do frontend

@app.route('/')
def serve_frontend():
    return render_template('login.html')

@app.route('/adicionar-usuario', methods=['POST'])
def adicionar_usuario():
    try:
        data = request.json
        
        doc_ref = db.collection('usuarios').document()
        doc_ref.set({
            'nome': data['nome'],
            'email': data['email'],
            'idade': int(data['idade']),
            'cidade': data['cidade'],
            'data_criacao': datetime.now(),
            'ativo': True
        })
        
        return jsonify({
            'success': True,
            'message': 'Usuário cadastrado com sucesso!',
            'id': doc_ref.id
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro ao cadastrar usuário: {str(e)}'
        }), 500

@app.route('listar-usuarios', methods=['GET'])
def listar_usuarios():
    try:
        usuarios_ref = db.collection('usuarios')
        docs = usuarios_ref.stream()
        
        usuarios = []
        for doc in docs:
            usuario_data = doc.to_dict()
            usuario_data['id'] = doc.id
            # Converter datetime para string
            if 'data_criacao' in usuario_data:
                usuario_data['data_criacao'] = usuario_data['data_criacao'].isoformat()
            usuarios.append(usuario_data)
        
        return jsonify({
            'success': True,
            'usuarios': usuarios
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro ao buscar usuários: {str(e)}'
        }), 500

# Rota para deletar usuário
@app.route('/deletar-usuario/<user_id>', methods=['DELETE'])
def deletar_usuario(user_id):
    try:
        db.collection('usuarios').document(user_id).delete()
        
        return jsonify({
            'success': True,
            'message': 'Usuário deletado com sucesso!'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro ao deletar usuário: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)