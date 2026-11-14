const { app, BrowserWindow, ipcMain, screen, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Permite testar com uma pasta de dados separada.
if (process.env.PROJETOR_DADOS) app.setPath('userData', process.env.PROJETOR_DADOS);

const PASTA_BIBLIAS = () => path.join(app.getPath('userData'), 'biblias');
const ARQ_CONFIG = () => path.join(app.getPath('userData'), 'config.json');

// Versões que o programa sabe baixar da internet (uma vez só; depois funciona offline).
const BASE = 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/';
const DISPONIVEIS = [
  { id: 'acf', nome: 'Almeida Corrigida Fiel (ACF)', url: BASE + 'acf.json' },
  { id: 'aa', nome: 'Almeida Revisada (AA)', url: BASE + 'aa.json' },
];

const PADRAO = {
  fonte: 'Segoe UI',
  corTexto: '#ffffff',
  corFundo: '#000000',
  imagemFundo: null,
  tamanhoMax: 11, // % da altura da tela
  alinhamento: 'center',
  maiusculas: false,
  mostrarVersao: true,
  telaId: null,
  versao: null,
};

let config = { ...PADRAO };
let aoVivo = null; // { referencia, versos: [{n, texto}], versao }
let janControle = null;
let janProjecao = null;
let projecaoVisivel = true;

function lerConfig() {
  try {
    config = { ...PADRAO, ...JSON.parse(fs.readFileSync(ARQ_CONFIG(), 'utf8')) };
  } catch {
    config = { ...PADRAO };
  }
}

function salvarConfig() {
  fs.mkdirSync(path.dirname(ARQ_CONFIG()), { recursive: true });
  fs.writeFileSync(ARQ_CONFIG(), JSON.stringify(config, null, 2));
}

function estado() {
  return { aoVivo, config };
}

function enviarEstado() {
  for (const j of [janProjecao, janControle]) {
    if (j && !j.isDestroyed()) j.webContents.send('estado', estado());
  }
}

// ---------- Telas ----------

function listarTelas() {
  const principal = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    nome: `Tela ${i + 1} (${d.size.width}×${d.size.height})${d.id === principal ? ' – principal' : ''}`,
    principal: d.id === principal,
  }));
}

function telaDeProjecao() {
  const telas = screen.getAllDisplays();
  const principal = screen.getPrimaryDisplay().id;
  return telas.find((d) => d.id === config.telaId) || telas.find((d) => d.id !== principal) || null;
}

function criarProjecao() {
  if (janProjecao && !janProjecao.isDestroyed()) {
    janProjecao.removeAllListeners('closed');
    janProjecao.destroy();
  }
  const tela = telaDeProjecao();
  const base = {
    show: false,
    backgroundColor: '#000000',
    title: 'Projeção',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  };
  janProjecao = tela
    ? new BrowserWindow({ ...base, ...tela.bounds, frame: false, skipTaskbar: true, alwaysOnTop: true })
    : new BrowserWindow({ ...base, width: 800, height: 450, title: 'Projeção (nenhuma segunda tela encontrada)' });
  janProjecao.loadFile(path.join(__dirname, '..', 'renderer', 'projecao.html'));
  janProjecao.once('ready-to-show', () => {
    if (!projecaoVisivel) return;
    if (tela) {
      janProjecao.setBounds(tela.bounds);
      janProjecao.setFullScreen(true);
    }
    janProjecao.showInactive();
  });
  janProjecao.on('closed', () => {
    janProjecao = null;
    projecaoVisivel = false;
    avisarTelas();
  });
}

function avisarTelas() {
  if (janControle && !janControle.isDestroyed()) {
    janControle.webContents.send('telas', infoTelas());
  }
}

function infoTelas() {
  const tela = telaDeProjecao();
  return { telas: listarTelas(), atual: tela ? tela.id : null, visivel: projecaoVisivel };
}

function criarControle() {
  const area = screen.getPrimaryDisplay().workArea;
  janControle = new BrowserWindow({
    x: area.x,
    y: area.y,
    width: Math.min(1400, area.width),
    height: Math.min(900, area.height),
    minWidth: 900,
    minHeight: 600,
    title: 'Projetor Bíblico',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  janControle.loadFile(path.join(__dirname, '..', 'renderer', 'controle.html'));
  janControle.on('closed', () => app.quit());
}

// ---------- Bíblias ----------

function arquivoBiblia(id) {
  if (!/^[a-z0-9_-]+$/i.test(id)) throw new Error('Identificador inválido');
  return path.join(PASTA_BIBLIAS(), id + '.json');
}

// Aceita o formato comum [{ abbrev, chapters: [[versos...], ...] }, ...] ou { nome, livros: [...] }.
function validarBiblia(dados) {
  const lista = Array.isArray(dados) ? dados : dados && (dados.livros || dados.books);
  if (!Array.isArray(lista) || lista.length < 66) throw new Error('O arquivo não tem os 66 livros.');
  const livros = lista.slice(0, 66).map((l) => {
    const caps = Array.isArray(l) ? l : l.chapters || l.capitulos;
    if (!Array.isArray(caps) || !caps.every((c) => Array.isArray(c))) throw new Error('Formato de capítulos desconhecido.');
    return caps.map((c) => c.map((v) => String(v).trim()));
  });
  return livros;
}

function listarBiblias() {
  fs.mkdirSync(PASTA_BIBLIAS(), { recursive: true });
  const instaladas = fs
    .readdirSync(PASTA_BIBLIAS())
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const id = f.slice(0, -5);
      let nome = id.toUpperCase();
      try {
        // O nome fica no começo do arquivo; evita ler os 4 MB inteiros.
        const inicio = fs.readFileSync(path.join(PASTA_BIBLIAS(), f), 'utf8').slice(0, 300);
        const m = inicio.match(/^\{"nome":("(?:[^"\\]|\\.)*")/);
        if (m) nome = JSON.parse(m[1]);
      } catch {}
      return { id, nome };
    });
  const ids = new Set(instaladas.map((b) => b.id));
  return { instaladas, disponiveis: DISPONIVEIS.filter((d) => !ids.has(d.id)).map(({ id, nome }) => ({ id, nome })) };
}

function gravarBiblia(id, nome, livros) {
  fs.mkdirSync(PASTA_BIBLIAS(), { recursive: true });
  fs.writeFileSync(arquivoBiblia(id), JSON.stringify({ nome, livros }));
}

ipcMain.handle('biblias:listar', () => listarBiblias());

ipcMain.handle('biblias:carregar', (_e, id) => JSON.parse(fs.readFileSync(arquivoBiblia(id), 'utf8')));

ipcMain.handle('biblias:baixar', async (_e, id) => {
  const item = DISPONIVEIS.find((d) => d.id === id);
  if (!item) throw new Error('Versão desconhecida');
  const resp = await net.fetch(item.url);
  if (!resp.ok) throw new Error('Falha ao baixar (HTTP ' + resp.status + '). Verifique a internet.');
  const texto = (await resp.text()).replace(/^﻿/, '');
  gravarBiblia(item.id, item.nome, validarBiblia(JSON.parse(texto)));
  return listarBiblias();
});

ipcMain.handle('biblias:importar', async () => {
  const r = await dialog.showOpenDialog(janControle, {
    title: 'Importar Bíblia (arquivo JSON)',
    filters: [{ name: 'Bíblia em JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (r.canceled) return null;
  const arq = r.filePaths[0];
  const dados = JSON.parse(fs.readFileSync(arq, 'utf8').replace(/^﻿/, ''));
  const base = path.basename(arq, '.json');
  const id = base.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'biblia';
  const nome = (!Array.isArray(dados) && (dados.nome || dados.name)) || base.toUpperCase();
  gravarBiblia(id, String(nome), validarBiblia(dados));
  return { id, ...listarBiblias() };
});

ipcMain.handle('biblias:remover', (_e, id) => {
  fs.rmSync(arquivoBiblia(id), { force: true });
  return listarBiblias();
});

// ---------- Projeção / configuração ----------

ipcMain.handle('estado:obter', () => estado());

ipcMain.handle('aovivo:definir', (_e, dados) => {
  aoVivo = dados || null;
  enviarEstado();
});

ipcMain.handle('config:alterar', (_e, mudancas) => {
  const telaAntes = config.telaId;
  config = { ...config, ...mudancas };
  salvarConfig();
  if (config.telaId !== telaAntes) {
    projecaoVisivel = true;
    criarProjecao();
    avisarTelas();
  }
  enviarEstado();
  return config;
});

ipcMain.handle('fundo:escolher', async () => {
  const r = await dialog.showOpenDialog(janControle, {
    title: 'Imagem de fundo',
    filters: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
    properties: ['openFile'],
  });
  if (r.canceled) return config;
  // Copia para a pasta do programa, assim continua funcionando se o original for apagado.
  const destino = path.join(app.getPath('userData'), 'fundo' + path.extname(r.filePaths[0]).toLowerCase());
  fs.copyFileSync(r.filePaths[0], destino);
  config.imagemFundo = pathToFileURL(destino).href + '?v=' + Date.now();
  salvarConfig();
  enviarEstado();
  return config;
});

ipcMain.handle('telas:obter', () => infoTelas());

ipcMain.handle('projecao:alternar', () => {
  projecaoVisivel = !projecaoVisivel;
  if (projecaoVisivel) criarProjecao();
  else if (janProjecao && !janProjecao.isDestroyed()) janProjecao.hide();
  return infoTelas();
});

// ---------- Início ----------

app.whenReady().then(() => {
  lerConfig();
  criarControle();
  criarProjecao();
  const refazer = () => {
    if (projecaoVisivel) criarProjecao();
    avisarTelas();
  };
  screen.on('display-added', refazer);
  screen.on('display-removed', refazer);
  screen.on('display-metrics-changed', refazer);
});

app.on('window-all-closed', () => app.quit());
