import { Store } from './storage.js';
import { escapeHtml } from './utils.js';

export function renderComprar(container) {
  const produtos = Store.get('produtos');
  const estoqueLD = Store.get('estoqueLD') || {};
  const estoqueABSP = Store.get('estoqueABSP') || {};
  const reqLD = Store.get('reqLD') || [];
  const reqABSP = Store.get('reqABSP') || [];
  const entLD = Store.get('entLD') || [];
  const entABSP = Store.get('entABSP') || [];

  function calc(produto, estoque, reqs, ents) {
    const e = estoque[produto.id];
    if (!e) return null;
    const saidas = reqs.filter(r => r.produtoId === produto.id).reduce((s, r) => s + Number(r.qtd), 0);
    const entradas = ents.filter(r => r.produtoId === produto.id).reduce((s, r) => s + Number(r.qtd), 0);
    const saldo = Number(e.inicial || 0) + entradas - saidas;
    if (saldo < (e.minimo || 0)) {
      return { saldo, minimo: e.minimo, maximo: e.maximo, sugestao: Math.max(0, (e.maximo || 0) - saldo) };
    }
    return null;
  }

  const comprarLD = produtos.map(p => ({ p, r: calc(p, estoqueLD, reqLD, entLD) })).filter(x => x.r);
  const comprarABSP = produtos.map(p => ({ p, r: calc(p, estoqueABSP, reqABSP, entABSP) })).filter(x => x.r);

  container.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3>🏠 LD — ${comprarLD.length} itens</h3>
        ${comprarLD.length === 0 ? '<div class="empty"><h4>Tudo em ordem</h4><p>Nenhum item abaixo do mínimo</p></div>' : `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Produto</th><th>Fornecedor</th><th>Saldo</th><th>Mín.</th><th>Sugestão</th></tr></thead>
              <tbody>
                ${comprarLD.map(x => `
                  <tr>
                    <td><strong>${escapeHtml(x.p.nome)}</strong></td>
                    <td>${escapeHtml(x.p.fornecedor)}</td>
                    <td style="color:#f87171">${x.r.saldo}</td>
                    <td>${x.r.minimo}</td>
                    <td><strong style="color:#fbbf24">${x.r.sugestao} ${x.p.unidade}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <div class="card">
        <h3>🏢 ABSP — ${comprarABSP.length} itens</h3>
        ${comprarABSP.length === 0 ? '<div class="empty"><h4>Tudo em ordem</h4><p>Nenhum item abaixo do mínimo</p></div>' : `
          <div class="table-wrap">
            <table>
              <thead><tr><th>Produto</th><th>Fornecedor</th><th>Saldo</th><th>Mín.</th><th>Sugestão</th></tr></thead>
              <tbody>
                ${comprarABSP.map(x => `
                  <tr>
                    <td><strong>${escapeHtml(x.p.nome)}</strong></td>
                    <td>${escapeHtml(x.p.fornecedor)}</td>
                    <td style="color:#f87171">${x.r.saldo}</td>
                    <td>${x.r.minimo}</td>
                    <td><strong style="color:#fbbf24">${x.r.sugestao} ${x.p.unidade}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}