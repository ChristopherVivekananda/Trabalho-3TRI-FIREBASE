// script.js (modular, Firebase v9+)

// --- 1) IMPORTS do Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- 2) CONFIGURAÇÃO do Firebase (substitua pelos seus dados) ---
const FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  // measurementId: "G-MEASUREID", // opcional
};

// Inicializa Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const usuariosCol = collection(db, "usuarios");

// --- 3) FUNÇÕES --- 

// Exibir mensagens
function mostrarMensagem(texto, sucesso) {
  const msg = document.getElementById("message");
  msg.textContent = texto;
  msg.className = `message ${sucesso ? "success" : "error"}`;
  setTimeout(() => {
    msg.className = "message hidden";
  }, 3000);
}

// Função para escapar HTML
function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Cadastrar usuário
document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const idadeRaw = document.getElementById("idade").value;
  const cidade = document.getElementById("cidade").value.trim();

  if (!nome || !email || !idadeRaw || !cidade) {
    mostrarMensagem("Todos os campos são obrigatórios.", false);
    return;
  }

  const idade = parseInt(idadeRaw, 10);
  if (Number.isNaN(idade)) {
    mostrarMensagem("Idade inválida.", false);
    return;
  }

  try {
    await addDoc(usuariosCol, {
      nome,
      email,
      idade,
      cidade,
      data_criacao: serverTimestamp(),
      ativo: true
    });
    mostrarMensagem("Usuário cadastrado com sucesso!", true);
    document.getElementById("userForm").reset();
    carregarUsuarios();
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao cadastrar usuário.", false);
  }
});

// Carregar usuários
async function carregarUsuarios() {
  document.getElementById("loading").style.display = "block";
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";

  try {
    const q = query(usuariosCol, orderBy("data_criacao", "desc"));
    const snapshot = await getDocs(q);

    document.getElementById("loading").style.display = "none";

    if (snapshot.empty) {
      usersList.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const u = docSnap.data() || {};
      u.id = docSnap.id;

      if (u.data_criacao && typeof u.data_criacao.toDate === "function") {
        try {
          u.data_criacao = u.data_criacao.toDate().toISOString();
        } catch {
          u.data_criacao = String(u.data_criacao);
        }
      }

      const card = document.createElement("div");
      card.classList.add("user-card");
      card.innerHTML = `
        <div class="user-info">
          <h3>${escapeHtml(u.nome)}</h3>
          <p>${escapeHtml(u.email)}</p>
          <p>Idade: ${escapeHtml(String(u.idade))}</p>
          <p>Cidade: ${escapeHtml(u.cidade)}</p>
          <p class="small">Criado: ${u.data_criacao ?? "-"}</p>
        </div>
        <button class="delete-btn" data-id="${u.id}">Excluir</button>
      `;
      usersList.appendChild(card);
    });

    usersList.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        const id = ev.currentTarget.dataset.id;
        if (id) deletarUsuario(id);
      });
    });
  } catch (err) {
    document.getElementById("loading").style.display = "none";
    console.error(err);
    mostrarMensagem("Erro ao listar usuários.", false);
  }
}

// Deletar usuário
async function deletarUsuario(id) {
  try {
    await deleteDoc(doc(db, "usuarios", id));
    mostrarMensagem("Usuário deletado com sucesso!", true);
    carregarUsuarios();
  } catch (err) {
    console.error(err);
    mostrarMensagem("Erro ao deletar usuário.", false);
  }
}

// Carrega usuários quando a página abre
window.addEventListener("load", carregarUsuarios);
