import { Store } from './storage.js';
import { escapeHtml } from './utils.js';

export function renderDashboard(container) {
  const produtos = Store.get('produtos');
  const reqLD = Store.get('reqLD') || [];
  const reqABSP = Store.get('reqABSP') || [];
  const reqProd = Store.get('reqProducao') || [];
  const entLD = Store.get('entLD') || [];
  const entABSP = Store.get('entABSP') || [];
  const estoqueLD = Store.get('estoqueLD') || {};
  const estoqueABSP = Store.get('estoqueABSP') || {};

  const totalReqs = reqLD.length + reqABSP.length + reqProd.length;
  const totalEnts = entLD.length + entABSP.length;

  // Itens abaixo do mínimo
  function itensBaixo(estoque, reqs, ents) {
    return produtos.filter(p => {
      const e = estoque[p.id];
      if (!e) return false;
      const saidas = reqs.filter(r => r.produtoId === p.id).reduce((s, r) => s + Number(r.qtd), 0);
      const entradas = ents.filter(r => r.produtoId === p.id).reduce((s, r) => s + Number(r.qtd), 0);
      const saldo = Number(e.inicial || 0) + entradas - saidas;
      return saldo < (e.minimo || 0);
    }).length;
  }

  const baixoLD = itensBaixo(estoqueLD, reqLD, entLD);
  const baixoABSP = itensBaixo(estoqueABSP, reqABSP, entABSP);

  // Top 5 mais requisitados (geral)
  const agrupado = {};
  [...reqLD, ...reqABSP, ...reqProd].forEach(r => {
    agrupado[r.produtoId] = (agrupado[r.produtoId] || 0) + Number(r.qtd);
  });
  const top5 = produtos
    .map(p => ({ p, total: agrupado[p.id] || 0 }))
    .filter(x => x.total > 0)
    .sort((a,b) => b.total - a.total)
    .slice(0, 5);

  // Top 5 mais comprados (entradas)
  const agrupadoEnt = {};
  [...entLD, ...entABSP].forEach(r => {
    agrupadoEnt[r.produtoId] = (agrupadoEnt[r.produtoId] || 0) + Number(r.qtd);
  });
  const topEnt = produtos
    .map(p => ({ p, total: agrupadoEnt[p.id] || 0 }))
    .filter(x => x.total > 0)
    .sort((a,b) => b.total - a.total)
    .slice(0, 5);

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Produtos Cadastrados</div>
        <div class="stat-value">${produtos.length}</div>
        <div class="stat-sub">Base única</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Requisições Totais</div>
        <div class="stat-value">${totalReqs}</div>
        <div class="stat-sub">LD + ABSP + Produção</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Entradas Registradas</div>
        <div class="stat-value">${totalEnts}</div>
        <div class="stat-sub">Compras recebidas</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Abaixo do Mínimo</div>
        <div class="stat-value" style="background:linear-gradient(135deg,#f87171,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${baixoLD + baixoABSP}</div>
        <div class="stat-sub">LD: ${baixoLD} • ABSP: ${baixoABSP}</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top:24px;">
      <div class="card">
        <h3>🔥 Top 5 Mais Requisitados</h3>
        <div class="rank-list">
          ${top5.length === 0 ? '<div class="empty"><h4>Sem requisições</h4></div>' : top5.map((x,i) => `
            <div class="rank-item">
              <div class="rank-pos">${i+1}</div>
              <div class="rank-info">
                <strong>${escapeHtml(x.p.nome)}</strong>
                <span>${escapeHtml(x.p.categoria)} • ${escapeHtml(x.p.fornecedor)}</span>
              </div>
              <div class="rank-value">${x.total} ${escapeHtml(x.p.unidade)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <h3>🛒 Top 5 Mais Comprados</h3>
        <div class="rank-list">
          ${topEnt.length === 0 ? '<div class="empty"><h4>Sem entradas</h4></div>' : topEnt.map((x,i) => `
            <div class="rank-item">
              <div class="rank-pos">${i+1}</div>
              <div class="rank-info">
                <strong>${escapeHtml(x.p.nome)}</strong>
                <span>${escapeHtml(x.p.fornecedor)}</span>
              </div>
              <div class="rank-value">${x.total} ${escapeHtml(x.p.unidade)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}