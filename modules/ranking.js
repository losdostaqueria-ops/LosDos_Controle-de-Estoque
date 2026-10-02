import { Store } from './storage.js';
import { escapeHtml } from './utils.js';

export function renderRanking(container) {
  container.innerHTML = `
    <div class="grid-2">
      <div class="card"><h3>🔥 Top 10 Mais Requisitados</h3><div class="rank-list" id="topList"></div></div>
      <div class="card"><h3>❄️ Top 10 Menos Requisitados</h3><div class="rank-list" id="bottomList"></div></div>
    </div>
  `;

  const produtos = Store.get('produtos');
  const todasReqs = [
    ...(Store.get('reqLD') || []).map(r => ({ ...r, casa: 'LD' })),
    ...(Store.get('reqABSP') || []).map(r => ({ ...r, casa: 'ABSP' })),
    ...(Store.get('reqProducao') || []).map(r => ({ ...r, casa: 'Produção' }))
  ];

  const agrupado = {};
  todasReqs.forEach(r => {
    if (!agrupado[r.produtoId]) agrupado[r.produtoId] = { total: 0, count: 0 };
    agrupado[r.produtoId].total += Number(r.qtd);
    agrupado[r.produtoId].count += 1;
  });

  const lista = produtos.map(p => ({
    p,
    total: agrupado[p.id]?.total || 0,
    count: agrupado[p.id]?.count || 0
  })).sort((a,b) => b.total - a.total);

  const top = lista.slice(0, 10);
  const bottom = [...lista].reverse().slice(0, 10);

  document.getElementById('topList').innerHTML = top.map((x, i) => rankItem(x, i)).join('') || empty();
  document.getElementById('bottomList').innerHTML = bottom.map((x, i) => rankItem(x, i)).join('') || empty();
}

function rankItem(x, i) {
  return `
    <div class="rank-item">
      <div class="rank-pos">${i+1}</div>
      <div class="rank-info">
        <strong>${escapeHtml(x.p.nome)}</strong>
        <span>${x.count} requisições • ${escapeHtml(x.p.categoria)}</span>
      </div>
      <div class="rank-value">${x.total} ${escapeHtml(x.p.unidade)}</div>
    </div>
  `;
}

function empty() {
  return '<div class="empty"><h4>Sem dados</h4><p>Registre requisições primeiro</p></div>';
}