document.addEventListener("DOMContentLoaded", () => {

  const API = 'https://tasks-hbdt.onrender.com';
 
// Detecta se está na tela de login
const currentPage = window.location.pathname.split('/').pop();
const isLoginPage = currentPage === '' || currentPage === 'index.html';

if (isLoginPage) {
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nickname = document.getElementById("nickname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!nickname || !email || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Erro no login.");
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(result));
      window.location.href = "tasks.html";

    } catch (error) {
      alert("Erro ao conectar com o servidor.");
      console.error(error);
    }
  });

} else {
  // Tela de tarefas
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const taskListEl = document.getElementById("task-list");
  const taskForm = document.getElementById("task-form");
  const taskName = document.getElementById("task-name");
  const taskDate = document.getElementById("task-date");
  const taskTime = document.getElementById("task-time");
  const taskDesc = document.getElementById("task-desc");
  const welcome = document.getElementById("welcome");
  const logoutBtn = document.getElementById("logout");

  welcome.textContent = `Bem-vindo, ${user.nickname}!`;

  let tasks = [];

  async function loadTasks() {
    try {
      const res = await fetch(`${API}/tasks/${user.email}`);
      tasks = await res.json();
      renderTasks();
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  }

  function renderTasks() {
    taskListEl.innerHTML = "";
    tasks.forEach((task, index) => {
      const item = document.createElement("div");
      item.className = "task-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.addEventListener("change", async () => {
        await fetch(`${API}/tasks/${user.email}/${index}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ done: checkbox.checked })
        });
        loadTasks();
      });

      const content = document.createElement("div");
      content.className = "task-item-content";
      content.innerHTML = `
        <strong>${task.name}</strong><br/>
        <small>Data: ${task.date} | Hora: ${task.time}</small><br/>
        <p>${task.description}</p>
        <p>Status: <span style="color:${task.done ? 'green' : 'red'}">${task.done ? 'Concluída' : 'Pendente'}</span></p>
      `;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Excluir";
      deleteBtn.onclick = async () => {
        await fetch(`${API}/tasks/${user.email}/${index}`, {
          method: 'DELETE'
        });
        loadTasks();
      };

      item.appendChild(checkbox);
      item.appendChild(content);
      item.appendChild(deleteBtn);
      taskListEl.appendChild(item);
    });
  }

  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const task = {
      name: taskName.value.trim(),
      date: taskDate.value,
      time: taskTime.value,
      description: taskDesc.value.trim(),
      done: false
    };

    if (task.name && task.date && task.time && task.description) {
      await fetch(`${API}/tasks/${user.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      taskForm.reset();
      loadTasks();
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });

  loadTasks();
}
});