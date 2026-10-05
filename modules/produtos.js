import { Store } from './storage.js';
import { toast, openModal, closeModal, escapeHtml, uid } from './utils.js';
import { escanearCodigo } from '../scanner.js';

export function renderProdutos(container, ctx) {
  const produtos = Store.get('produtos');

  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-filters">
        <input class="chip active" placeholder="🔍 Filtrar..." id="filterProd" style="min-width:280px; cursor:text;" />
      </div>
      <button class="btn btn-primary" id="btnNovoProd">
        <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Novo Produto
      </button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produto</th><th>Casa</th><th>Categoria</th><th>Unidade</th>
            <th>Mín.</th><th>Fornecedor</th><th>Código de Barras</th><th>Ações</th>
          </tr>
        </thead>
        <tbody id="tbodyProd">
          ${produtos.length === 0 ? emptyRow(8) : produtos.map(p => `
            <tr>
              <td><strong>${escapeHtml(p.nome)}</strong></td>
              <td><span class="badge ${p.casa === 'LD' ? 'ld' : 'absp'}">${escapeHtml(p.casa)}</span></td>
              <td>${escapeHtml(p.categoria)}</td>
              <td>${escapeHtml(p.unidade)}</td>
              <td>${p.minimo}</td>
              <td>${escapeHtml(p.fornecedor)}</td>
              <td><code style="color:var(--pink-300)">${escapeHtml(p.codigo)}</code></td>
              <td>
                <button class="btn btn-ghost btn-sm" data-edit="${p.id}">✏️</button>
                <button class="btn btn-danger btn-sm" data-del="${p.id}">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('filterProd').addEventListener('input', e => {
    const t = e.target.value.toLowerCase();
    document.querySelectorAll('#tbodyProd tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(t) ? '' : 'none';
    });
  });

  document.getElementById('btnNovoProd').addEventListener('click', () => openForm());

  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = produtos.find(x => x.id === btn.dataset.edit);
      openForm(p);
    });
  });

  container.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Excluir este produto?')) return;
      Store.set('produtos', produtos.filter(x => x.id !== btn.dataset.del));
      toast('Produto excluído', 'success');
      ctx.refresh();
    });
  });

  function openForm(produto = null) {
    const p = produto || { nome: '', casa: 'LD', categoria: 'Hortifruti', unidade: 'UN', minimo: 0, fornecedor: '', codigo: '' };
    openModal(`
      <h3>${produto ? 'Editar' : 'Novo'} Produto</h3>
      <form id="formProd">
        <div class="form-grid">
          <div class="field"><label>Nome *</label><input name="nome" required value="${escapeHtml(p.nome)}" /></div>
          <div class="field"><label>Casa Principal</label>
            <select name="casa">
              <option ${p.casa==='LD'?'selected':''}>LD</option>
              <option ${p.casa==='ABSP'?'selected':''}>ABSP</option>
            </select>
          </div>
          <div class="field"><label>Categoria</label>
            <select name="categoria">
              ${['Hortifruti','Hortifruti Colaborador','Secos','Secos Bar','Itens Diversos','Limpeza/Descartáveis','Diversos'].map(c => `<option ${p.categoria===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Unidade</label>
            <select name="unidade">
              ${['UN','KG','G','L','ML','CX','PCT','FD','DZ','BDJ','GL','RL','PAR'].map(u => `<option ${p.unidade===u?'selected':''}>${u}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>Estoque Mínimo</label><input type="number" name="minimo" value="${p.minimo}" min="0" step="0.01" /></div>
          <div class="field"><label>Fornecedor</label><input name="fornecedor" value="${escapeHtml(p.fornecedor)}" /></div>
          <div class="field"><label>Código de Barras *</label>
            <div style="display:flex; gap:8px;">
              <input name="codigo" required value="${escapeHtml(p.codigo)}" style="flex:1; min-width:0;" />
              <button type="button" class="btn btn-ghost" id="btnScan" title="Escanear com a câmera">📷 Escanear</button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="btnCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar</button>
        </div>
      </form>
    `);

    document.getElementById('btnCancel').onclick = closeModal;

    document.getElementById('btnScan').onclick = async () => {
      const codigo = await escanearCodigo();
      if (codigo) document.querySelector('#formProd [name="codigo"]').value = codigo;
    };

    document.getElementById('formProd').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      data.minimo = parseFloat(data.minimo) || 0;

      const list = Store.get('produtos');
      if (produto) {
        const idx = list.findIndex(x => x.id === produto.id);
        list[idx] = { ...produto, ...data };
      } else {
        if (list.some(x => x.codigo === data.codigo)) {
          toast('Código de barras já cadastrado!', 'error');
          return;
        }
        list.push({ id: uid(), ...data });
      }
      Store.set('produtos', list);
      toast(`Produto ${produto ? 'atualizado' : 'cadastrado'}!`, 'success');
      closeModal();
      ctx.refresh();
    };
  }
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}">
    <div class="empty">
      <svg viewBox="0 0 24 24"><path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6 0h-4V4h4v2z"/></svg>
      <h4>Nenhum produto cadastrado</h4>
      <p>Clique em "Novo Produto" para começar</p>
    </div>
  </td></tr>`;
}