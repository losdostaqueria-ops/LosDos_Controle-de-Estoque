// ============================================================
// modules/dados_estoque.js
// Camada de acesso à base de dados de estoque (JSON estático)
// ============================================================

// URL raw do JSON no GitHub
const URL_ESTOQUE =
  "https://raw.githubusercontent.com/losdostaqueria-ops/LosDos_Controle-de-Estoque/refs/heads/main/modules/dados_estoque.json";

// Cache em memória
let _cacheEstoque = null;

// ============================================================
// 1. CARREGAMENTO
// ============================================================

export async function carregarEstoque(forcarReload = false) {
  if (_cacheEstoque && !forcarReload) {
    return _cacheEstoque;
  }

  try {
    const resposta = await fetch(URL_ESTOQUE, { cache: "no-store" });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status} ao buscar estoque`);
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados)) {
      throw new Error("Formato inválido: esperado um array de itens");
    }

    _cacheEstoque = dados;
    console.log(`[dados_estoque] ${dados.length} itens carregados`);
    return dados;

  } catch (erro) {
    console.error("[dados_estoque] Falha ao carregar:", erro);
    return _cacheEstoque || [];
  }
}

export function limparCache() {
  _cacheEstoque = null;
}

// ============================================================
// 2. FILTROS
// ============================================================

export function filtrarPorCasa(estoque, casa) {
  return estoque.filter(
    (item) => item.CASA?.toUpperCase() === casa?.toUpperCase()
  );
}

export function filtrarPorCategoria(estoque, categoria) {
  return estoque.filter(
    (item) => item.CATEGORIA?.toUpperCase() === categoria?.toUpperCase()
  );
}

export function filtrarPorFornecedor(estoque, fornecedor) {
  const termo = fornecedor.toLowerCase();
  return estoque.filter((item) =>
    item.FORNECEDOR?.toLowerCase().includes(termo)
  );
}

export function filtrarPorCasaECategoria(estoque, casa, categoria) {
  return estoque.filter(
    (item) =>
      item.CASA?.toUpperCase() === casa?.toUpperCase() &&
      item.CATEGORIA?.toUpperCase() === categoria?.toUpperCase()
  );
}

// ============================================================
// 3. BUSCA
// ============================================================

export function buscar(estoque, termo) {
  if (!termo) return estoque;
  const t = termo.toString().toLowerCase().trim();

  return estoque.filter((item) => {
    return (
      item.NOME?.toLowerCase().includes(t) ||
      item.FORNECEDOR?.toLowerCase().includes(t) ||
      String(item["CODIGO DE BARRAS"]).includes(t)
    );
  });
}

export function buscarPorCodigo(estoque, codigo, casa = null) {
  return estoque.find((item) => {
    const codigoOk = String(item["CODIGO DE BARRAS"]) === String(codigo);
    const casaOk = casa ? item.CASA?.toUpperCase() === casa.toUpperCase() : true;
    return codigoOk && casaOk;
  });
}

// ============================================================
// 4. LISTAGENS
// ============================================================

export function listarCasas(estoque) {
  return [...new Set(estoque.map((i) => i.CASA).filter(Boolean))].sort();
}

export function listarCategorias(estoque, casa = null) {
  const base = casa ? filtrarPorCasa(estoque, casa) : estoque;
  return [...new Set(base.map((i) => i.CATEGORIA).filter(Boolean))].sort();
}

export function listarFornecedores(estoque) {
  return [...new Set(estoque.map((i) => i.FORNECEDOR).filter(Boolean))].sort();
}

export function listarUnidades(estoque) {
  return [...new Set(estoque.map((i) => i.UNIDADE).filter(Boolean))].sort();
}

// ============================================================
// 5. ESTATÍSTICAS
// ============================================================

export function contarPorCasa(estoque) {
  return estoque.reduce((acc, item) => {
    acc[item.CASA] = (acc[item.CASA] || 0) + 1;
    return acc;
  }, {});
}

export function contarPorCategoria(estoque, casa = null) {
  const base = casa ? filtrarPorCasa(estoque, casa) : estoque;
  return base.reduce((acc, item) => {
    acc[item.CATEGORIA] = (acc[item.CATEGORIA] || 0) + 1;
    return acc;
  }, {});
}

// ============================================================
// 6. ORDENAÇÃO
// ============================================================

export function ordenarPorNome(estoque, direcao = "asc") {
  const copia = [...estoque];
  copia.sort((a, b) => {
    const cmp = a.NOME.localeCompare(b.NOME, "pt-BR");
    return direcao === "asc" ? cmp : -cmp;
  });
  return copia;
}

// ============================================================
// 7. MESCLAGEM COM FIREBASE
// ============================================================

export function mesclarEstoques(estoqueJSON, estoqueFirebase) {
  const mapa = new Map();

  estoqueJSON.forEach((item) => {
    const chave = `${item.CASA}_${item["CODIGO DE BARRAS"]}`;
    mapa.set(chave, { ...item, _origem: "json" });
  });

  estoqueFirebase.forEach((item) => {
    const chave = `${item.CASA}_${item["CODIGO DE BARRAS"]}`;
    mapa.set(chave, { ...item, _origem: "firebase" });
  });

  return Array.from(mapa.values());
}
