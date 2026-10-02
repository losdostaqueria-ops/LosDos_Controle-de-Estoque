import { Store } from './modules/storage.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderProdutos } from './modules/produtos.js';
import { renderEstoque } from './modules/estoque.js';
import { renderRequisicoes } from './modules/requisicoes.js';
import { renderEntradas } from './modules/entradas.js';
import { renderComprar } from './modules/comprar.js';
import { renderRanking } from './modules/ranking.js';
import { toast, openModal, closeModal } from './modules/utils.js';

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

// Navegação
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});

// Busca global
document.getElementById('globalSearch').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

// Export / Import
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

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      Store.import(data);
      toast('Dados importados com sucesso!', 'success');
      render();
    } catch (err) {
      toast('Arquivo inválido!', 'error');
    }
  };
  reader.readAsText(file);
});

// Modal close
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

// Init
render();
toast('Bem-vindo ao Los Dos! 👋', 'success');