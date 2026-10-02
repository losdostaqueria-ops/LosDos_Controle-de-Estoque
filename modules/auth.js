// modules/auth.js
import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { toast } from './utils.js';

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function login(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
  toast('Sessão encerrada', 'success');
}

export function renderLogin(container, onSuccess) {
  container.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-brand">
          <div class="brand-logo">LD</div>
          <h1>Los Dos</h1>
          <p>Controle de Estoque e Requisições</p>
        </div>
        <form id="loginForm">
          <div class="field">
            <label>E-mail</label>
            <input type="email" name="email" required placeholder="seu@email.com" autocomplete="email" />
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" name="password" required placeholder="••••••••" autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary login-btn" id="btnLogin">
            Entrar
          </button>
          <p class="login-error" id="loginError"></p>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('loginForm');
  const btn = document.getElementById('btnLogin');
  const errEl = document.getElementById('loginError');

  form.onsubmit = async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    const fd = new FormData(e.target);
    try {
      await login(fd.get('email'), fd.get('password'));
      toast('Bem-vindo! 👋', 'success');
      onSuccess();
    } catch (err) {
      console.error(err);
      const msgs = {
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.'
      };
      errEl.textContent = msgs[err.code] || 'Erro ao entrar: ' + err.message;
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  };
}
