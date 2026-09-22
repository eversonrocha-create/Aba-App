// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBzDM5VnLAKjUd6qfojvnZmDQsTB_D7cIs",
  authDomain: "aba-app-828b4.firebaseapp.com",
  databaseURL: "https://aba-app-828b4-default-rtdb.firebaseio.com",
  projectId: "aba-app-828b4",
  storageBucket: "aba-app-828b4.firebasestorage.app",
  messagingSenderId: "943402703897",
  appId: "1:943402703897:web:d3449445fb729e7424de88"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let isAdmin = true; // Define o modo admin ativado por padrão para gestão
let editingHistoryKey = null;

// Sistema de Navegação por Abas (Sempre passa pelo Lobby)
function switchTab(tabId) {
  // Esconde todas as views
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Remove a classe ativa do menu lateral
  document.querySelectorAll('.poly-menu-item').forEach(item => {
    item.classList.remove('active');
  });

  // Exibe a view selecionada
  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  const activeMenuItem = document.getElementById(`menu-${tabId}`);
  if (activeMenuItem) {
    activeMenuItem.classList.add('active');
  }

  if (tabId === 'historia') {
    loadHistoryTexts();
  }
}

// LÓGICA DA HISTÓRIA DA IGREJA (POSTAR, EDITAR, EXCLUIR)
function loadHistoryTexts() {
  const formBox = document.getElementById('adminHistoryForm');
  formBox.style.display = isAdmin ? 'flex' : 'none';

  db.ref('church_history').on('value', snapshot => {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    const data = snapshot.val();

    if (!data) {
      container.innerHTML = `
        <div class="history-block">
          <h3>Igreja Missionária Unida de Itagimirim</h3>
          <p>Nossa igreja tem raízes firmadas nas Escrituras Sagradas e no compromisso com o evangelho de Jesus Cristo em Itagimirim, BA.</p>
        </div>
      `;
      return;
    }

    Object.keys(data).forEach(key => {
      const item = data[key];
      let adminButtons = '';

      if (isAdmin) {
        adminButtons = `
          <div class="admin-controls">
            <button class="btn-hud" onclick="editHistoryText('${key}', '${encodeURIComponent(item.title)}', '${encodeURIComponent(item.body)}')">Editar</button>
            <button class="btn-hud btn-danger" onclick="deleteHistoryText('${key}')">Excluir</button>
          </div>
        `;
      }

      container.innerHTML += `
        <article class="history-block">
          <h3>${item.title}</h3>
          <p style="margin-top:10px; line-height:1.5;">${item.body}</p>
          ${adminButtons}
        </article>
      `;
    });
  });
}

function saveHistoryText() {
  const title = document.getElementById('historyTitle').value.trim();
  const body = document.getElementById('historyBody').value.trim();

  if (!title || !body) return alert("Preencha o título e o texto.");

  if (editingHistoryKey) {
    db.ref(`church_history/${editingHistoryKey}`).update({ title, body })
      .then(() => {
        editingHistoryKey = null;
        resetHistoryForm();
      });
  } else {
    db.ref('church_history').push({ title, body, timestamp: Date.now() })
      .then(() => resetHistoryForm());
  }
}

function editHistoryText(key, titleEncoded, bodyEncoded) {
  editingHistoryKey = key;
  document.getElementById('historyTitle').value = decodeURIComponent(titleEncoded);
  document.getElementById('historyBody').value = decodeURIComponent(bodyEncoded);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteHistoryText(key) {
  if (confirm("Tem certeza que deseja excluir este texto da história?")) {
    db.ref(`church_history/${key}`).remove();
  }
}

function resetHistoryForm() {
  document.getElementById('historyTitle').value = '';
  document.getElementById('historyBody').value = '';
}

function toggleAdminRole() {
  isAdmin = !isAdmin;
  alert(isAdmin ? "Modo Administrador Ativado" : "Modo Membro Ativado");
  loadHistoryTexts();
}

// Inicializador
document.addEventListener('DOMContentLoaded', () => {
  loadHistoryTexts();
});
