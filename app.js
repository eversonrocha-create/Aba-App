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

// Troca de Abas com a Estética do Wireframe
function switchTab(tabId) {
  // Atualiza painéis ativos
  document.querySelectorAll('.content-display').forEach(panel => {
    panel.classList.remove('active');
  });
  
  const targetPanel = document.getElementById(`panel-${tabId}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  // Atualiza botões do menu diagonal
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.remove('active'));

  const tabIndexMap = {
    'feed': 0,
    'agenda': 1,
    'chamada': 2,
    'membros': 3,
    'admin': 4
  };

  if (tabIndexMap[tabId] !== undefined) {
    menuItems[tabIndexMap[tabId]].classList.add('active');
  }
}

// Carregar Dados Básicos do Firebase
document.addEventListener('DOMContentLoaded', () => {
  firebase.database().ref('posts').limitToLast(5).on('value', snap => {
    const container = document.getElementById('feedList');
    if (!container) return;
    
    const data = snap.val();
    if (!data) {
      container.innerHTML = '<p style="color: var(--text-gray);">Sem publicações recentes.</p>';
      return;
    }

    container.innerHTML = '';
    Object.keys(data).reverse().forEach(key => {
      const post = data[key];
      container.innerHTML += `
        <div style="border-bottom: 1px solid var(--border-color); padding: 10px 0;">
          <strong style="color: #fff;">${post.autorNome || 'Membro'}:</strong>
          <p style="color: var(--text-gray); font-size: 0.9rem;">${post.texto}</p>
        </div>
      `;
    });
  });
});
