import { Store } from './storage.js';
import { toast, openModal, closeModal, escapeHtml, fmtDate, today, uid } from './utils.js';

const CASAS = [
  { key: 'reqLD', label: 'LD', badge: 'ld' },
  { key: 'reqABSP', label: 'ABSP', badge: 'absp' },
  { key: 'reqProducao', label: 'Produção', badge: 'prod' }
];

export function renderRequisicoes(container, ctx) {
  let casaIdx = 0;

  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters" id="chipsReq">
        ${CASAS.map((c, i) => `<button class="chip ${i===0?'active':''}" data-idx="${i}">${c.label}</button>`).join('')}
      </div>
      <button class="btn btn-primary" id="btnNovaReq">
        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Nova Requisição
      </button>
    </div>
    <div id="reqView"></div>
  `;

  function renderLista() {
    const casa = CASAS[casaIdx];
    const reqs = Store.get(casa.key) || [];
    const produtos = Store.get('produtos');

    const sorted = [...reqs].sort((a,b) => (b.data || '').localeCompare(a.data || ''));

    container.querySelector('#reqView').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Data</th><th>Produto</th><th>Unidade</th><th>Quantidade</th><th></th></tr>
          </thead>
          <tbody>
            ${sorted.length === 0 ? emptyRow() : sorted.map(r => {
              const p = produtos.find(x => x.id === r.produtoId);
              return `<tr>
                <td>${fmtDate(r.data)}</td>
                <td><strong>${escapeHtml(p?.nome || '—')}</strong></td>
                <td>${escapeHtml(p?.unidade || '—')}</td>
                <td style="color:#f87171"><strong>${r.qtd}</strong></td>
                <td><button class="btn btn-danger btn-sm" data-del="${r.id}">🗑️</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Excluir esta requisição?')) return;
        Store.set(casa.key, reqs.filter(r => r.id !== btn.dataset.del));
        toast('Requisição excluída', 'success');
        renderLista();
      };
    });
  }

  container.querySelectorAll('#chipsReq .chip').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('#chipsReq .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      casaIdx = Number(btn.dataset.idx);
      renderLista();
    };
  });

  container.querySelector('#btnNovaReq').onclick = () => {
    const produtos = Store.get('produtos');
    if (produtos.length === 0) {
      toast('Cadastre produtos primeiro!', 'error');
      return;
    }
    const casa = CASAS[casaIdx];
    openModal(`
      <h3>Nova Requisição — ${casa.label}</h3>
      <form id="formReq">
        <div class="form-grid">
          <div class="field"><label>Data</label><input type="date" name="data" value="${today()}" required /></div>
          <div class="field"><label>Produto</label>
            <select name="produtoId" required>
              <option value="">Selecione...</option>
              ${produtos.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${p.unidade})</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Quantidade</label><input type="number" name="qtd" step="0.01" min="0.01" required /></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="btnCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar</button>
        </div>
      </form>
    `);
    document.getElementById('btnCancel').onclick = closeModal;
    document.getElementById('formReq').onsubmit = (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      const list = Store.get(casa.key) || [];
      list.push({ id: uid(), ...fd, qtd: parseFloat(fd.qtd) });
      Store.set(casa.key, list);
      toast('Requisição registrada!', 'success');
      closeModal();
      renderLista();
    };
  };

  renderLista();
}

function emptyRow() {
  return `<tr><td colspan="5"><div class="empty">
    <h4>Nenhuma requisição</h4>
    <p>Clique em "Nova Requisição" para registrar</p>
  </div></td></tr>`;
}