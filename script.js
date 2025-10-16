const API_URL = "http://127.0.0.1:5000";

// Cadastrar novo usuário
document.getElementById("userForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        nome: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        idade: document.getElementById("idade").value,
        cidade: document.getElementById("cidade").value,
    };

    try {
        const response = await fetch(`${API_URL}/adicionar-usuario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        mostrarMensagem(result.message, result.success);
        if (result.success) carregarUsuarios();
    } catch (err) {
        mostrarMensagem("Erro de conexão com o servidor.", false);
        console.error(err);
    }
});

// Carregar usuários
async function carregarUsuarios() {
    document.getElementById("loading").style.display = "block";
    try {
        const response = await fetch(`${API_URL}/listar-usuarios`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();

        const usersList = document.getElementById("usersList");
        usersList.innerHTML = "";
        document.getElementById("loading").style.display = "none";

        if (result.success) {
            if (result.usuarios.length === 0) {
                usersList.innerHTML = "<p>Nenhum usuário cadastrado.</p>";
                return;
            }
            result.usuarios.forEach((u) => {
                const card = document.createElement("div");
                card.classList.add("user-card");
                card.innerHTML = `
                    <div class="user-info">
                        <h3>${u.nome}</h3>
                        <p>${u.email}</p>
                        <p>Idade: ${u.idade}</p>
                        <p>Cidade: ${u.cidade}</p>
                    </div>
                    <button class="delete-btn" onclick="deletarUsuario('${u.id}')">Excluir</button>
                `;
                usersList.appendChild(card);
            });
        } else {
            mostrarMensagem(result.message || "Erro ao carregar usuários.", false);
        }
    } catch (err) {
        document.getElementById("loading").style.display = "none";
        mostrarMensagem("Erro de conexão ao listar usuários.", false);
        console.error(err);
    }
}

// Deletar usuário
async function deletarUsuario(id) {
    try {
        const response = await fetch(`${API_URL}/deletar-usuario/${id}`, {
            method: "DELETE",
        });
        const result = await response.json();
        mostrarMensagem(result.message, result.success);
        if (result.success) carregarUsuarios();
    } catch (err) {
        mostrarMensagem("Erro ao deletar usuário.", false);
        console.error(err);
    }
}

// Exibir mensagens
function mostrarMensagem(texto, sucesso) {
    const msg = document.getElementById("message");
    msg.textContent = texto;
    msg.className = `message ${sucesso ? "success" : "error"}`;
    setTimeout(() => {
        msg.className = "message hidden";
    }, 3000);
}

// Carregar usuários ao iniciar
window.onload = carregarUsuarios;
