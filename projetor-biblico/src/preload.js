const { contextBridge, ipcRenderer } = require('electron');

const chamar = (canal) => (...args) => ipcRenderer.invoke(canal, ...args);
const ouvir = (canal) => (fn) => ipcRenderer.on(canal, (_e, dados) => fn(dados));

contextBridge.exposeInMainWorld('api', {
  listarBiblias: chamar('biblias:listar'),
  carregarBiblia: chamar('biblias:carregar'),
  baixarBiblia: chamar('biblias:baixar'),
  importarBiblia: chamar('biblias:importar'),
  removerBiblia: chamar('biblias:remover'),
  obterEstado: chamar('estado:obter'),
  definirAoVivo: chamar('aovivo:definir'),
  alterarConfig: chamar('config:alterar'),
  escolherFundo: chamar('fundo:escolher'),
  obterTelas: chamar('telas:obter'),
  alternarProjecao: chamar('projecao:alternar'),
  aoMudarEstado: ouvir('estado'),
  aoMudarTelas: ouvir('telas'),
});
