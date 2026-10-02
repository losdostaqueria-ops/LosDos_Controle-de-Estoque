const KEY = 'losdos_data_v1';

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

export const Store = {
  _data: null,

  load() {
    if (this._data) return this._data;
    try {
      const raw = localStorage.getItem(KEY);
      this._data = raw ? { ...defaultData, ...JSON.parse(raw) } : structuredClone(defaultData);
    } catch {
      this._data = structuredClone(defaultData);
    }
    return this._data;
  },

  save() {
    localStorage.setItem(KEY, JSON.stringify(this._data));
  },

  get(key) {
    return this.load()[key];
  },

  set(key, value) {
    this.load()[key] = value;
    this.save();
  },

  export() {
    return this.load();
  },

  import(data) {
    this._data = { ...defaultData, ...data };
    this.save();
  },

  reset() {
    this._data = structuredClone(defaultData);
    this.save();
  }
};