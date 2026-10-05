// scanner.js — leitor de código de barras / QR pela câmera do celular
// Uso:  import { escanearCodigo } from './scanner.js';
//       const codigo = await escanearCodigo();   // string ou null (se cancelado)

import { Store } from './modules/storage.js';
import { toast } from './modules/utils.js';

const LIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
let carregando = null;

function carregarLib() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (!carregando) {
    carregando = new Promise((ok, erro) => {
      const s = document.createElement('script');
      s.src = LIB_URL;
      s.onload = ok;
      s.onerror = () => {
        carregando = null;
        erro(new Error('Não foi possível carregar o leitor. Verifique a internet.'));
      };
      document.head.appendChild(s);
    });
  }
  return carregando;
}

export function escanearCodigo() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.85);display:flex;' +
      'flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;' +
      'font-family:Inter,system-ui,sans-serif;color:#fff;';
    overlay.innerHTML = `
      <strong style="font-size:18px">Aponte a câmera para o código</strong>
      <div id="ld-leitor" style="width:min(92vw,420px);border-radius:12px;overflow:hidden;background:#000"></div>
      <div id="ld-msg" style="min-height:20px;font-size:14px;text-align:center"></div>
      <div style="display:flex;gap:8px;width:min(92vw,420px)">
        <input id="ld-manual" inputmode="numeric" placeholder="ou digite o código"
          style="flex:1;padding:10px;border-radius:8px;border:0;font-size:16px">
        <button id="ld-ok" style="padding:10px 14px;border-radius:8px;border:0;font-weight:600">OK</button>
      </div>
      <button id="ld-cancelar" style="padding:10px 18px;border-radius:8px;border:0;font-weight:600">Cancelar</button>`;
    document.body.appendChild(overlay);

    const msg = overlay.querySelector('#ld-msg');
    let leitor = null;
    let encerrado = false;

    async function fechar(valor) {
      if (encerrado) return;
      encerrado = true;
      try {
        if (leitor) {
          if (leitor.isScanning) await leitor.stop();
          leitor.clear();
        }
      } catch (_) { /* ignora */ }
      overlay.remove();
      resolve(valor);
    }

    overlay.querySelector('#ld-cancelar').onclick = () => fechar(null);
    overlay.querySelector('#ld-ok').onclick = () => {
      const v = overlay.querySelector('#ld-manual').value.trim();
      if (v) fechar(v);
    };

    carregarLib()
      .then(() => {
        if (encerrado) return;
        const F = window.Html5QrcodeSupportedFormats;
        leitor = new window.Html5Qrcode('ld-leitor', {
          formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false,
        });
        return leitor.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 140 } },
          (texto) => fechar(texto),
          () => {} // erros de frame sem código: ignorar
        );
      })
      .catch((e) => {
        const negado = /permission|denied|NotAllowed/i.test(String(e));
        msg.textContent = negado
          ? 'Câmera bloqueada. Libere a permissão no navegador ou digite o código.'
          : (e && e.message) || 'Não foi possível abrir a câmera. Digite o código.';
      });
  });
}

window.escanearCodigo = escanearCodigo;

// Botão de câmera ao lado da busca global: preenche o campo e dispara a busca.
function adicionarBotaoNaBusca() {
  const input = document.getElementById('globalSearch');
  if (!input || document.getElementById('btnScanBusca')) return;
  const btn = document.createElement('button');
  btn.id = 'btnScanBusca';
  btn.type = 'button';
  btn.title = 'Escanear código de barras';
  btn.textContent = '📷';
  btn.style.cssText = 'border:0;background:transparent;cursor:pointer;font-size:18px;padding:0 6px;';
  btn.onclick = async () => {
    const codigo = await escanearCodigo();
    if (!codigo) return;
    // Procura o produto pelo código; as telas mostram o nome, então filtramos por ele.
    const p = (Store.get('produtos') || []).find((x) => String(x.codigo) === String(codigo));
    if (!p) { toast('Código não cadastrado: ' + codigo, 'error'); return; }
    input.value = p.nome;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  input.insertAdjacentElement('afterend', btn);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', adicionarBotaoNaBusca);
} else {
  adicionarBotaoNaBusca();
}
