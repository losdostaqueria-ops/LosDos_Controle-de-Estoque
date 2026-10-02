import { Store } from './storage.js';
import { toast, openModal, closeModal, escapeHtml } from './utils.js';

export function renderEstoque(container, ctx) {
  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters">
        <button class="chip active" data-casa="LD">🏠 LD</button>
        <button class="chip" data-casa="ABSP">🏢 ABSP</button>
      </div>
    </div>
    <div id="estoqueView"></div>
  `;

  let casaAtual = 'LD';

  function renderCasa() {
    const produtos = Store.get('produtos');
    const estoqueKey = casaAtual === 'LD' ? 'estoqueLD' : 'estoqueABSP';
    const estoque = Store.get(estoqueKey) || {};
    const reqKey = casaAtual === 'LD' ? 'reqLD' : 'reqABSP';
    const entKey = casaAtual === 'LD' ? 'entLD' : 'entABSP';
    const reqs = Store.get(reqKey) || [];
    const ents = Store.get(entKey) || [];

    const rows = produtos.map(p => {
      const e = estoque[p.id] || { inicial: 0, minimo: p.minimo, maximo: p.minimo * 3 };
      const saidas = reqs.filter(r => r.produtoId === p.id).reduce((s, r) => s + Number(r.qtd), 0);
      const entradas = ents.filter(r => r.produtoId === p.id).reduce((s, r) => s + Number(r.qtd), 0);
      const saldo = Number(e.inicial || 0) + entradas - saidas;

      let status = 'OK', cls = 'ok';
      if (saldo < (e.minimo || 0)) { status = 'Abaixo do Mínimo'; cls = 'low'; }
      else if (saldo > (e.maximo || 0)) { status = 'Acima do Máximo'; cls = 'high'; }

      const sugestao = cls === 'low' ? Math.max(0, (e.maximo || 0) - saldo) : 0;

      return { p, e, saldo, status, cls, sugestao, entradas, saidas };
    });

    container.querySelector('#estoqueView').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th><th>Fornecedor</th><th>Un.</th>
              <th>Inicial</th><th>Mín.</th><th>Máx.</th>
              <th>Entradas</th><th>Saídas</th><th>Saldo</th>
              <th>Status</th><th>Sugestão</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0 ? emptyRow(12) : rows.map(r => `
              <tr>
                <td><strong>${escapeHtml(r.p.nome)}</strong></td>
                <td>${escapeHtml(r.p.fornecedor)}</td>
                <td>${escapeHtml(r.p.unidade)}</td>
                <td>${r.e.inicial ?? 0}</td>
                <td>${r.e.minimo ?? 0}</td>
                <td>${r.e.maximo ?? 0}</td>
                <td style="color:#34d399">+${r.entradas}</td>
                <td style="color:#f87171">-${r.saidas}</td>
                <td><strong style="color:var(--pink-300); font-size:15px">${r.saldo}</strong></td>
                <td><span class="badge ${r.cls}">${r.status}</span></td>
                <td>${r.sugestao > 0 ? `<strong style="color:#fbbf24">${r.sugestao}</strong>` : '—'}</td>
                <td><button class="btn btn-ghost btn-sm" data-config="${r.p.id}">⚙️</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('[data-config]').forEach(btn => {
      btn.onclick = () => {
        const p = produtos.find(x => x.id === btn.dataset.config);
        const e = estoque[p.id] || { inicial: 0, minimo: p.minimo, maximo: p.minimo * 3 };
        openModal(`
          <h3>Configurar Estoque — ${escapeHtml(p.nome)}</h3>
          <form id="formEst">
            <div class="form-grid">
              <div class="field"><label>Estoque Inicial</label><input type="number" name="inicial" step="0.01" value="${e.inicial ?? 0}" /></div>
              <div class="field"><label>Estoque Mínimo</label><input type="number" name="minimo" step="0.01" value="${e.minimo ?? 0}" /></div>
              <div class="field"><label>Estoque Máximo</label><input type="number" name="maximo" step="0.01" value="${e.maximo ?? 0}" /></div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" id="btnCancel">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
          </form>
        `);
        document.getElementById('btnCancel').onclick = closeModal;
        document.getElementById('formEst').onsubmit = (ev) => {
          ev.preventDefault();
          const fd = Object.fromEntries(new FormData(ev.target));
          const est = Store.get(estoqueKey) || {};
          est[p.id] = {
            inicial: parseFloat(fd.inicial) || 0,
            minimo: parseFloat(fd.minimo) || 0,
            maximo: parseFloat(fd.maximo) || 0
          };
          Store.set(estoqueKey, est);
          toast('Estoque atualizado!', 'success');
          closeModal();
          renderCasa();
        };
      };
    });
  }

  container.querySelectorAll('[data-casa]').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('[data-casa]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      casaAtual = btn.dataset.casa;
      renderCasa();
    };
  });

  renderCasa();
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}"><div class="empty"><h4>Nenhum produto cadastrado</h4><p>Cadastre produtos primeiro</p></div></td></tr>`;
}