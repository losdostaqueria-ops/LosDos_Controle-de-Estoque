import { Store } from './storage.js';
import { toast, openModal, closeModal, escapeHtml, fmtDate, today, uid } from './utils.js';
import { escanearCodigo } from '../scanner.js';

const CASAS = [
  { key: 'entLD', label: 'LD' },
  { key: 'entABSP', label: 'ABSP' }
];

export function renderEntradas(container, ctx) {
  let casaIdx = 0;

  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters" id="chipsEnt">
        ${CASAS.map((c,i) => `<button class="chip ${i===0?'active':''}" data-idx="${i}">${c.label}</button>`).join('')}
      </div>
      <button class="btn btn-primary" id="btnNovaEnt">
        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Nova Entrada
      </button>
    </div>
    <div id="entView"></div>
  `;

  function renderLista() {
    const casa = CASAS[casaIdx];
    const ents = Store.get(casa.key) || [];
    const produtos = Store.get('produtos');
    const sorted = [...ents].sort((a,b) => (b.data || '').localeCompare(a.data || ''));

    container.querySelector('#entView').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Data</th><th>Produto</th><th>Unidade</th><th>Quantidade</th><th></th></tr></thead>
          <tbody>
            ${sorted.length === 0 ? emptyRow() : sorted.map(r => {
              const p = produtos.find(x => x.id === r.produtoId);
              return `<tr>
                <td>${fmtDate(r.data)}</td>
                <td><strong>${escapeHtml(p?.nome || '—')}</strong></td>
                <td>${escapeHtml(p?.unidade || '—')}</td>
                <td style="color:#34d399"><strong>+${r.qtd}</strong></td>
                <td><button class="btn btn-danger btn-sm" data-del="${r.id}">🗑️</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Excluir esta entrada?')) return;
        Store.set(casa.key, ents.filter(r => r.id !== btn.dataset.del));
        toast('Entrada excluída', 'success');
        renderLista();
      };
    });
  }

  container.querySelectorAll('#chipsEnt .chip').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('#chipsEnt .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      casaIdx = Number(btn.dataset.idx);
      renderLista();
    };
  });

  container.querySelector('#btnNovaEnt').onclick = () => {
    const produtos = Store.get('produtos');
    if (produtos.length === 0) { toast('Cadastre produtos primeiro!', 'error'); return; }
    const casa = CASAS[casaIdx];
    openModal(`
      <h3>Nova Entrada — ${casa.label}</h3>
      <form id="formEnt">
        <div class="form-grid">
          <div class="field"><label>Data</label><input type="date" name="data" value="${today()}" required /></div>
          <div class="field"><label>Produto</label>
            <div style="display:flex; gap:8px;">
              <select name="produtoId" required style="flex:1; min-width:0;">
                <option value="">Selecione...</option>
                ${produtos.map(p => `<option value="${p.id}">${escapeHtml(p.nome)} (${p.unidade})</option>`).join('')}
              </select>
              <button type="button" class="btn btn-ghost" id="btnScanEnt" title="Escanear com a câmera">📷</button>
            </div>
          </div>
          <div class="field"><label>Quantidade Recebida</label><input type="number" name="qtd" step="0.01" min="0.01" required /></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="btnCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Registrar</button>
        </div>
      </form>
    `);
    document.getElementById('btnCancel').onclick = closeModal;
    document.getElementById('btnScanEnt').onclick = async () => {
      const codigo = await escanearCodigo();
      if (!codigo) return;
      const achado = produtos.find(x => String(x.codigo) === String(codigo));
      if (achado) document.querySelector('#formEnt [name="produtoId"]').value = achado.id;
      else toast('Código não cadastrado: ' + codigo, 'error');
    };
    document.getElementById('formEnt').onsubmit = (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      const list = Store.get(casa.key) || [];
      list.push({ id: uid(), ...fd, qtd: parseFloat(fd.qtd) });
      Store.set(casa.key, list);
      toast('Entrada registrada!', 'success');
      closeModal();
      renderLista();
    };
  };

  renderLista();
}

function emptyRow() {
  return `<tr><td colspan="5"><div class="empty"><h4>Nenhuma entrada</h4><p>Clique em "Nova Entrada" para registrar</p></div></td></tr>`;
}