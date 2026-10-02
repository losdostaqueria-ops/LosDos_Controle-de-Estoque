// modules/storage.js
import { db } from './firebase.js';
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DOC_ID = 'losdos_data';
const COLLECTION = 'app';

const defaultData = {
  produtos: [],
  estoqueLD: {},
  estoqueABSP: {},
  reqLD: [],
  reqABSP: [],
  reqProducao: [],
  entLD: [],
  entABSP: []
};

let _data = null;
let _loaded = false;
let _saveTimer = null;

export const Store = {
  async init() {
    if (_loaded) return _data;
    try {
      const ref = doc(db, COLLECTION, DOC_ID);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        _data = { ...defaultData, ...snap.data() };
      } else {
        _data = structuredClone(defaultData);
        await setDoc(ref, _data);
      }
    } catch (err) {
      console.error('Erro ao carregar do Firestore:', err);
      _data = structuredClone(defaultData);
    }
    _loaded = true;
    return _data;
  },

  async save() {
    if (!_data) return;
    // debounce: evita múltiplas gravações seguidas
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      try {
        const ref = doc(db, COLLECTION, DOC_ID);
        await setDoc(ref, _data);
      } catch (err) {
        console.error('Erro ao salvar no Firestore:', err);
      }
    }, 400);
  },

  get(key) {
    if (!_data) return defaultData[key] || [];
    return _data[key];
  },

  async set(key, value) {
    if (!_data) await this.init();
    _data[key] = value;
    await this.save();
  },

  export() {
    return _data || defaultData;
  },

  async import(data) {
    _data = { ...defaultData, ...data };
    await this.save();
  },

  async reset() {
    _data = structuredClone(defaultData);
    await this.save();
  },

  // força recarregar do Firestore (útil se outra pessoa mudou)
  async refresh() {
    _loaded = false;
    _data = null;
    return await this.init();
  }
};
