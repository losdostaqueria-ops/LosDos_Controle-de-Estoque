// app.js
import { Store } from './modules/storage.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderProdutos } from './modules/produtos.js';
import { renderEstoque } from './modules/estoque.js';
import { renderRequisicoes } from './modules/requisicoes.js';
import { renderEntradas } from './modules/entradas.js';
import { renderComprar } from './modules/comprar.js';
import { renderRanking } from './modules/ranking.js';
import { renderLogin, watchAuth, logout } from './modules/auth.js';
import { toast, closeModal } from './modules/utils.js';

const views = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral em tempo real', render: renderDashboard },
  produtos: { title: 'Cadastro de Produtos', subtitle: 'Base única de produtos', render: renderProdutos },
  estoque: { title: 'Estoque', subtitle: 'Controle por casa (LD e ABSP)', render: renderEstoque },
  requisicoes: { title: 'Requisições', subtitle: 'Saídas por casa', render: renderRequisicoes },
  entradas: { title: 'Entradas', subtitle: 'Compras recebidas', render: renderEntradas },
  comprar: { title: 'Produtos a Comprar', subtitle: 'Sugestão automática', render: renderComprar },
  ranking: { title: 'Ranking', subtitle: 'Mais e menos requisitados', render: renderRanking }
};

let currentView = 'dashboard';

function navigate(view) {
  if (!views[view]) return;
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('pageTitle').textContent = views[view].title;
  document.getElementById('pageSubtitle').textContent = views[view].subtitle;
  render();
}

function render() {
  const container = document.getElementById('viewContainer');
  container.innerHTML = '';
  views[currentView].render(container, { refresh: render, navigate });
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});

document.getElementById('globalSearch').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

document.getElementById('btnExport').addEventListener('click', () => {
  const data = JSON.stringify(Store.export(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `losdos-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup exportado com sucesso!', 'success');
});

document.getElementById('btnImport').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      await Store.import(data);
      toast('Dados importados com sucesso!', 'success');
      render();
    } catch (err) {
      toast('Arquivo inválido!', 'error');
    }
  };
  reader.readAsText(file);
});

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

function injectLogoutButton() {
  const actions = document.querySelector('.topbar-actions');
  if (!actions || document.getElementById('btnLogout')) return;
  const btn = document.createElement('button');
  btn.id = 'btnLogout';
  btn.className = 'btn-icon';
  btn.title = 'Sair';
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/></svg>`;
  btn.onclick = async () => {
    if (!confirm('Deseja sair?')) return;
    await logout();
  };
  actions.appendChild(btn);
}

function showApp() {
  document.querySelector('.sidebar').style.display = '';
  document.querySelector('.main').style.display = '';
  document.querySelector('.login-wrap')?.remove();
  injectLogoutButton();
  render();
}

function showLogin() {
  document.querySelector('.sidebar').style.display = 'none';
  document.querySelector('.main').style.display = 'none';
  const existing = document.querySelector('.login-wrap');
  if (existing) return;
  const container = document.createElement('div');
  document.body.appendChild(container);
  renderLogin(container, () => {
    container.remove();
    showApp();
  });
}

// Boot
watchAuth(async (user) => {
  if (user) {
    try {
      await Store.init();
      document.querySelector('.login-wrap')?.remove();
      showApp();
    } catch (err) {
      console.error(err);
      toast('Erro ao carregar dados', 'error');
    }
  } else {
    document.getElementById('btnLogout')?.remove();
    showLogin();
  }
});
