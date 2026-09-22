// Configuração do Firebase
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

// Estado Global da Aplicação
let currentUser = null;
let currentTimelineMode = 'foryou';
let attendanceList = [];
let isSignUpMode = false;

// Inicialização dos Ícones
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  setupAuthListeners();
});

// Autenticação
function setupAuthListeners() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      document.getElementById('bottomNav').style.display = 'flex';
      document.getElementById('headerProfileArea').style.display = 'block';

      // Carregar Perfil do Banco
      firebase.database().ref('usuarios/' + user.uid).on('value', snap => {
        const userData = snap.val() || {};
        currentUser.nome = userData.nome || user.email.split('@')[0];
        currentUser.nivelAcesso = userData.nivelAcesso || 'membro';
        currentUser.fotoUrl = userData.fotoUrl || '';

        updateUIWithUserData();
      });

      loadPosts();
      switchView('viewFeed');
    } else {
      currentUser = null;
      document.getElementById('bottomNav').style.display = 'none';
      document.getElementById('headerProfileArea').style.display = 'none';
      switchView('viewAuth');
    }
  });
}

function updateUIWithUserData() {
  document.getElementById('txtHeaderUserName').innerText = currentUser.nome;
  document.getElementById('profileNameDisplay').innerText = currentUser.nome;
  document.getElementById('profileEmailDisplay').innerText = currentUser.email;

  const badge = document.getElementById('profileBadge');
  badge.innerText = currentUser.nivelAcesso.toUpperCase();
  badge.className = `badge-role badge-${currentUser.nivelAcesso}`;

  const avatarBox = document.getElementById('profileInitials');
  if (currentUser.fotoUrl) {
    avatarBox.innerHTML = `<img src="${currentUser.fotoUrl}" alt="Avatar">`;
  } else {
    avatarBox.innerText = currentUser.nome.charAt(0).toUpperCase();
  }

  // Se for admin, habilita botão de gestão
  if (currentUser.nivelAcesso === 'admin') {
    document.getElementById('btnNavAdmin').style.display = 'flex';
  } else {
    document.getElementById('btnNavAdmin').style.display = 'none';
  }
}

function toggleAuthMode(signUp) {
  isSignUpMode = signUp;
  document.getElementById('groupNome').style.display = isSignUpMode ? 'block' : 'none';
  document.getElementById('btnSubmitAuth').innerText = isSignUpMode ? 'Criar Conta' : 'Entrar';
  document.getElementById('txtToggleAuth').innerHTML = isSignUpMode
    ? 'Já possui uma conta? <a href="#" onclick="toggleAuthMode(false)" style="color:var(--accent-blue);">Entre aqui</a>'
    : 'Ainda não tem conta? <a href="#" onclick="toggleAuthMode(true)" style="color:var(--accent-blue);">Cadastre-se</a>';
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('iptEmail').value;
  const password = document.getElementById('iptSenha').value;

  if (isSignUpMode) {
    const nome = document.getElementById('iptNome').value;
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(res => {
        return firebase.database().ref('usuarios/' + res.user.uid).set({
          nome: nome,
          email: email,
          nivelAcesso: 'membro',
          fotoUrl: ''
        });
      })
      .catch(err => alert("Erro ao cadastrar: " + err.message));
  } else {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(err => alert("Erro ao fazer login: " + err.message));
  }
}

function logout() {
  firebase.auth().signOut();
}

// Navegação entre Telas
function switchView(viewId) {
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  
  const navMap = {
    'viewFeed': 'navFeed',
    'viewCalendario': 'navCalendario',
    'viewMidia': 'navMidia',
    'viewChamada': 'navChamada',
    'viewHistoria': 'navHistoria',
    'viewPerfil': 'navPerfil',
    'viewAdmin': 'btnNavAdmin'
  };

  if (navMap[viewId]) {
    const activeNav = document.getElementById(navMap[viewId]);
    if (activeNav) activeNav.classList.add('active');
  }

  if (viewId === 'viewPerfil') loadUserPosts();
  if (viewId === 'viewAdmin') loadAdminUsersList();
}

// Lógica de Feed & Postagens
function setTimelineMode(mode) {
  currentTimelineMode = mode;
  document.getElementById('tabForYou').classList.toggle('active', mode === 'foryou');
  document.getElementById('tabSeguindo').classList.toggle('active', mode === 'seguindo');
  loadPosts();
}

function createPost() {
  const content = document.getElementById('iptPostContent').value.trim();
  if (!content) return alert("Por favor, escreva algo antes de publicar.");

  firebase.database().ref('posts').push({
    uid: currentUser.uid,
    autorNome: currentUser.nome,
    autorFoto: currentUser.fotoUrl || '',
    texto: content,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    data: new Date().toLocaleString('pt-BR'),
    likes: 0
  }).then(() => {
    document.getElementById('iptPostContent').value = '';
  }).catch(err => alert("Erro ao publicar: " + err.message));
}

function loadPosts() {
  firebase.database().ref('posts').on('value', snap => {
    const container = document.getElementById('feedPostsList');
    container.innerHTML = '';
    const data = snap.val();

    if (!data) {
      container.innerHTML = '<div class="card" style="text-align:center; color:var(--text-muted);">Nenhuma publicação no feed.</div>';
      return;
    }

    Object.keys(data).reverse().forEach(key => {
      const post = data[key];
      const avatarContent = post.autorFoto
        ? `<img src="${post.autorFoto}" alt="User">`
        : (post.autorNome ? post.autorNome.charAt(0).toUpperCase() : 'M');

      container.innerHTML += `
        <div class="card">
          <div class="post-header-area">
            <div class="post-user-info">
              <div class="user-avatar">${avatarContent}</div>
              <div class="user-details">
                <strong>${post.autorNome}</strong>
                <span>${post.data}</span>
              </div>
            </div>
          </div>
          <div class="post-content-body">${post.texto}</div>
          <div class="post-actions-bar">
            <button class="action-item" onclick="likePost('${key}', ${post.likes || 0})">
              <i data-lucide="heart" style="width:18px;"></i>
              <span>${post.likes || 0}</span>
            </button>
          </div>
        </div>
      `;
    });
    lucide.createIcons();
  });
}

function likePost(key, currentLikes) {
  firebase.database().ref(`posts/${key}/likes`).set(currentLikes + 1);
}

function loadUserPosts() {
  if (!currentUser) return;
  firebase.database().ref('posts').once('value').then(snap => {
    const container = document.getElementById('userPostsList');
    container.innerHTML = '';
    const data = snap.val() || {};
    let count = 0;

    Object.keys(data).reverse().forEach(key => {
      const p = data[key];
      if (p.uid === currentUser.uid) {
        count++;
        container.innerHTML += `
          <div style="border-bottom:1px solid var(--border-color); padding:10px 0;">
            <p style="font-size:0.9rem; color:var(--text-main);">${p.texto}</p>
            <span style="font-size:0.75rem; color:var(--text-muted);">${p.data}</span>
          </div>
        `;
      }
    });

    if (count === 0) {
      container.innerHTML = '<p style="font-size:0.85rem; color:var(--text-muted);">Você ainda não tem publicações.</p>';
    }
  });
}

function changeProfilePhoto() {
  const url = prompt("Cole o link (URL) da sua foto de perfil:");
  if (url && currentUser) {
    firebase.database().ref(`usuarios/${currentUser.uid}/fotoUrl`).set(url)
      .then(() => alert("Foto atualizada com sucesso!"))
      .catch(err => alert("Erro ao atualizar foto: " + err.message));
  }
}

// Lista de Chamada e PDF
function addAttendance() {
  const input = document.getElementById('iptAttendanceName');
  const name = input.value.trim();
  if (!name) return alert("Informe um nome válido.");

  attendanceList.push(name);
  input.value = '';

  const listContainer = document.getElementById('attendanceListRender');
  listContainer.innerHTML = '';
  attendanceList.forEach((n, idx) => {
    listContainer.innerHTML += `<li style="padding:4px 0; color:var(--text-heading);">${idx + 1}. ${n}</li>`;
  });
}

function exportAttendancePDF() {
  if (attendanceList.length === 0) return alert("Adicione membros à lista antes de gerar o PDF.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Igreja Missionária de Itagimirim", 14, 20);
  doc.setFontSize(12);
  doc.text(`Relatório Oficial de Presença - ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
  doc.text("------------------------------------------------------------------", 14, 34);

  let posY = 42;
  attendanceList.forEach((name, index) => {
    doc.text(`${index + 1}. ${name}`, 14, posY);
    posY += 8;
  });

  doc.save(`chamada-imub-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Painel Administrativo
function loadAdminUsersList() {
  firebase.database().ref('usuarios').on('value', snap => {
    const container = document.getElementById('adminUsersContainer');
    container.innerHTML = '';
    const data = snap.val() || {};

    Object.keys(data).forEach(uid => {
      const u = data[uid];
      const level = u.nivelAcesso || 'membro';

      container.innerHTML += `
        <div style="border-bottom:1px solid var(--border-color); padding:12px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:var(--text-heading);">${u.nome || 'Usuário'}</strong><br>
              <small style="color:var(--text-muted);">${u.email}</small>
            </div>
            <span class="badge-role badge-${level}">${level}</span>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="updateUserRole('${uid}', 'membro')">Membro</button>
            <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:var(--accent-yellow);" onclick="updateUserRole('${uid}', 'obreiro')">Obreiro</button>
            <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:var(--accent-red);" onclick="updateUserRole('${uid}', 'admin')">Admin</button>
          </div>
        </div>
      `;
    });
  });
}

function updateUserRole(uid, newRole) {
  firebase.database().ref(`usuarios/${uid}/nivelAcesso`).set(newRole)
    .then(() => alert("Nível de acesso atualizado!"))
    .catch(err => alert("Erro ao atualizar nível: " + err.message));
}
