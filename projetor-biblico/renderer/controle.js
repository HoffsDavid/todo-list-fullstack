/* global Livros, desenharSlide */
const $ = (id) => document.getElementById(id);
const { LIVROS, normalizar, interpretar } = Livros;

let config = null;
let aoVivo = null;
let biblia = null; // { id, nome, livros: [ [ [verso, ...], ... ], ... ] }
let livro = 42; // João
let cap = 0; // base 0
let sel = null; // { inicio, fim } base 0
let ancora = null;
let resultados = null; // resultados da busca por palavras, ou null
const historico = [];

// ---------- utilidades ----------

function el(tag, props, ...filhos) {
  const e = Object.assign(document.createElement(tag), props || {});
  e.append(...filhos);
  return e;
}

const capitulos = () => (biblia ? biblia.livros[livro] : []);
const versosDoCap = () => capitulos()[cap] || [];

function montar(l, c, inicio, fim) {
  const vs = biblia.livros[l][c];
  const versos = [];
  for (let i = inicio; i <= fim; i++) versos.push({ n: i + 1, texto: vs[i] });
  const faixa = inicio === fim ? `${inicio + 1}` : `${inicio + 1}-${fim + 1}`;
  return {
    referencia: `${LIVROS[l].nome} ${c + 1}:${faixa}`,
    versos,
    versao: biblia.id.toUpperCase(),
    pos: { l, c, inicio, fim, biblia: biblia.id },
  };
}

const selecionado = () => (biblia && sel ? montar(livro, cap, sel.inicio, sel.fim) : null);
const vivoAqui = () => aoVivo && biblia && aoVivo.pos.biblia === biblia.id && aoVivo.pos.l === livro && aoVivo.pos.c === cap;

// ---------- desenho ----------

function desenharLivros() {
  const filtro = normalizar($('filtroLivro').value.trim());
  $('livros').replaceChildren(
    ...LIVROS.map((l, i) => ({ l, i }))
      .filter(({ l }) => !filtro || normalizar(l.nome).includes(filtro) || l.abrev.startsWith(filtro))
      .map(({ l, i }) =>
        el('div', {
          textContent: l.nome,
          className: (i === livro ? 'ativo ' : '') + (i === 39 && !filtro ? 'nt-inicio' : ''),
          onclick: () => irPara(i, 0, null),
        })
      )
  );
  const ativo = $('livros').querySelector('.ativo');
  if (ativo) ativo.scrollIntoView({ block: 'nearest' });
}

function desenharCapitulos() {
  $('tituloCap').textContent = biblia ? `${LIVROS[livro].nome} ${cap + 1}` : '';
  $('capitulos').replaceChildren(
    ...capitulos().map((_c, i) =>
      el('button', { textContent: i + 1, className: i === cap ? 'ativo' : '', onclick: () => irPara(livro, i, null) })
    )
  );
}

function desenharVersos() {
  const lista = $('versos');
  if (!biblia) {
    lista.replaceChildren(
      el('div', { className: 'vazio' }, 'Nenhuma Bíblia instalada ainda.', el('br'), 'Clique em “Bíblias…” no alto da janela para baixar ou importar uma.')
    );
    return;
  }
  if (resultados) {
    const itens = resultados.map((r) =>
      el(
        'div',
        { className: 'verso', onclick: () => { limparBusca(); irPara(r.l, r.c, r.v); } },
        el('span', { className: 'onde', textContent: `${LIVROS[r.l].nome} ${r.c + 1}:${r.v + 1}` }),
        el('span', { textContent: biblia.livros[r.l][r.c][r.v] })
      )
    );
    const titulo = resultados.length ? `${resultados.length}${resultados.length === 300 ? '+' : ''} resultado(s) — clique para abrir` : 'Nada encontrado.';
    lista.replaceChildren(el('div', { className: 'vazio', textContent: titulo, style: 'padding:10px' }), ...itens);
    return;
  }
  const vivo = vivoAqui() ? aoVivo.pos : null;
  lista.replaceChildren(
    ...versosDoCap().map((t, i) =>
      el(
        'div',
        {
          className: 'verso' + (sel && i >= sel.inicio && i <= sel.fim ? ' sel' : '') + (vivo && i >= vivo.inicio && i <= vivo.fim ? ' vivo' : ''),
          onclick: (e) => clicarVerso(i, e.shiftKey),
          ondblclick: () => projetar(),
        },
        el('b', { textContent: i + 1 }),
        el('span', { textContent: t })
      )
    )
  );
  const alvo = lista.querySelector('.sel');
  if (alvo) alvo.scrollIntoView({ block: 'nearest' });
}

function desenharPainel() {
  if (!config) return;
  const s = selecionado();
  desenharSlide($('previa'), s, config);
  desenharSlide($('vivo'), aoVivo, config);
  $('refSel').textContent = s ? s.referencia : '';
  $('refVivo').textContent = aoVivo ? aoVivo.referencia : '(vazia)';
  $('quadroVivo').classList.toggle('ativo', !!aoVivo);
}

function desenharHistorico() {
  $('historico').replaceChildren(
    ...historico.map((h) =>
      el('div', {
        textContent: `${h.referencia}  (${h.versao})`,
        onclick: async () => {
          if (!biblia || biblia.id !== h.pos.biblia) await carregar(h.pos.biblia);
          if (!biblia || biblia.id !== h.pos.biblia) return;
          limparBusca();
          irPara(h.pos.l, h.pos.c, h.pos.inicio, h.pos.fim);
          projetar();
        },
      })
    )
  );
}

function desenharTudo() {
  desenharLivros();
  desenharCapitulos();
  desenharVersos();
  desenharPainel();
}

// ---------- navegação ----------

function irPara(l, c, inicio, fim) {
  if (!biblia) return;
  livro = l;
  cap = Math.min(Math.max(c, 0), capitulos().length - 1);
  const total = versosDoCap().length;
  if (inicio == null) sel = null;
  else {
    const a = Math.min(Math.max(inicio, 0), total - 1);
    sel = { inicio: a, fim: Math.min(Math.max(fim == null ? a : fim, a), total - 1) };
  }
  ancora = sel ? sel.inicio : null;
  desenharTudo();
}

function clicarVerso(i, comShift) {
  if (comShift && ancora != null) sel = { inicio: Math.min(ancora, i), fim: Math.max(ancora, i) };
  else {
    sel = { inicio: i, fim: i };
    ancora = i;
  }
  desenharVersos();
  desenharPainel();
}

// Avança/volta um versículo (ou um bloco, se vários estiverem selecionados). Se algo está na tela, já projeta.
function mover(direcao) {
  if (!biblia) return;
  limparBusca();
  const total = versosDoCap().length;
  if (!sel) {
    irPara(livro, cap, direcao > 0 ? 0 : total - 1);
  } else {
    const tam = sel.fim - sel.inicio + 1;
    if (direcao > 0) {
      if (sel.fim + 1 < total) irPara(livro, cap, sel.fim + 1, sel.fim + tam);
      else if (cap + 1 < capitulos().length) irPara(livro, cap + 1, 0, tam - 1);
      else return;
    } else {
      if (sel.inicio > 0) irPara(livro, cap, Math.max(sel.inicio - tam, 0), sel.inicio - 1);
      else if (cap > 0) {
        const n = capitulos()[cap - 1].length;
        irPara(livro, cap - 1, Math.max(n - tam, 0), n - 1);
      } else return;
    }
  }
  if (aoVivo) projetar();
}

async function projetar() {
  const s = selecionado();
  if (!s) return;
  aoVivo = s;
  if (!historico.length || historico[0].referencia !== s.referencia || historico[0].versao !== s.versao) {
    historico.unshift(s);
    historico.length = Math.min(historico.length, 30);
    desenharHistorico();
  }
  desenharVersos();
  desenharPainel();
  await window.api.definirAoVivo(s);
}

async function limpar() {
  aoVivo = null;
  desenharVersos();
  desenharPainel();
  await window.api.definirAoVivo(null);
}

// ---------- busca ----------

function limparBusca() {
  if (!resultados) return;
  resultados = null;
  $('busca').value = '';
}

function buscar() {
  const termos = normalizar($('busca').value).split(/\s+/).filter(Boolean);
  if (!biblia || !termos.length) {
    resultados = null;
    desenharVersos();
    return;
  }
  if (!biblia.indice) biblia.indice = biblia.livros.map((l) => l.map((c) => c.map(normalizar)));
  resultados = [];
  busca: for (let l = 0; l < 66; l++)
    for (let c = 0; c < biblia.indice[l].length; c++)
      for (let v = 0; v < biblia.indice[l][c].length; v++) {
        const t = biblia.indice[l][c][v];
        if (termos.every((p) => t.includes(p))) {
          resultados.push({ l, c, v });
          if (resultados.length === 300) break busca;
        }
      }
  desenharVersos();
  $('versos').scrollTop = 0;
}

// ---------- Bíblias ----------

async function carregar(id) {
  try {
    const dados = await window.api.carregarBiblia(id);
    biblia = { id, nome: dados.nome, livros: dados.livros };
    $('versao').value = id;
    if (config.versao !== id) config = await window.api.alterarConfig({ versao: id });
  } catch (e) {
    biblia = null;
  }
  resultados = null;
  irPara(livro, cap, sel ? sel.inicio : null, sel ? sel.fim : null);
}

async function atualizarBiblias(listas) {
  const { instaladas, disponiveis } = listas || (await window.api.listarBiblias());
  $('versao').replaceChildren(...instaladas.map((b) => el('option', { value: b.id, textContent: b.nome })));
  $('versao').hidden = !instaladas.length;

  $('instaladas').replaceChildren(
    ...(instaladas.length
      ? instaladas.map((b) =>
          el('div', { className: 'linha' }, b.nome, el('button', {
            textContent: 'Remover',
            onclick: async () => {
              const l = await window.api.removerBiblia(b.id);
              if (biblia && biblia.id === b.id) biblia = null;
              await atualizarBiblias(l);
            },
          }))
        )
      : [el('div', { className: 'nota', textContent: 'Nenhuma.' })])
  );
  $('disponiveis').replaceChildren(
    ...(disponiveis.length
      ? disponiveis.map((b) =>
          el('div', { className: 'linha' }, b.nome, el('button', {
            textContent: 'Baixar',
            className: 'primario',
            onclick: async (e) => {
              e.target.disabled = true;
              $('msgBiblias').textContent = 'Baixando ' + b.nome + '…';
              try {
                const l = await window.api.baixarBiblia(b.id);
                $('msgBiblias').textContent = '';
                await atualizarBiblias(l);
                await carregar(b.id);
              } catch (err) {
                $('msgBiblias').textContent = 'Não foi possível baixar. Verifique a conexão com a internet.';
                e.target.disabled = false;
              }
            },
          }))
        )
      : [el('div', { className: 'nota', textContent: 'Todas já foram baixadas.' })])
  );

  if (!biblia || !instaladas.some((b) => b.id === biblia.id)) {
    const alvo = instaladas.find((b) => b.id === config.versao) || instaladas[0];
    if (alvo) await carregar(alvo.id);
    else {
      biblia = null;
      desenharTudo();
    }
  } else $('versao').value = biblia.id;
}

// ---------- telas e aparência ----------

function desenharTelas(info) {
  $('tela').replaceChildren(...info.telas.map((t) => el('option', { value: t.id, textContent: t.nome })));
  if (info.atual != null) $('tela').value = info.atual;
  else $('tela').prepend(el('option', { textContent: 'Sem segunda tela (janela)', selected: true, value: '' }));
  $('btnAlternar').textContent = info.visivel ? 'Ocultar projeção' : 'Mostrar projeção';
}

function preencherAparencia() {
  $('cfgFonte').value = config.fonte;
  $('cfgTamanho').value = config.tamanhoMax;
  $('cfgAlinhamento').value = config.alinhamento;
  $('cfgCorTexto').value = config.corTexto;
  $('cfgCorFundo').value = config.corFundo;
  $('cfgMaiusculas').checked = config.maiusculas;
  $('cfgVersao').checked = config.mostrarVersao;
}

async function mudar(mudancas) {
  config = await window.api.alterarConfig(mudancas);
  desenharPainel();
}

// ---------- eventos ----------

$('filtroLivro').oninput = desenharLivros;
$('filtroLivro').onkeydown = (e) => {
  if (e.key !== 'Enter') return;
  const primeiro = $('livros').firstElementChild;
  if (primeiro) primeiro.click();
  $('filtroLivro').value = '';
  desenharLivros();
};
$('versao').onchange = (e) => carregar(e.target.value);
$('busca').onkeydown = (e) => { if (e.key === 'Enter') buscar(); };
$('busca').oninput = (e) => { if (!e.target.value && resultados) { resultados = null; desenharVersos(); } };

$('rapida').onkeydown = (e) => {
  if (e.key !== 'Enter' || !biblia) return;
  const r = interpretar(e.target.value);
  const ok = r && r.capitulo >= 1 && r.capitulo <= biblia.livros[r.livro].length &&
    (r.inicio == null || (r.inicio >= 1 && r.inicio <= biblia.livros[r.livro][r.capitulo - 1].length));
  if (!ok) {
    e.target.style.borderColor = '#e5484d';
    setTimeout(() => (e.target.style.borderColor = ''), 800);
    return;
  }
  limparBusca();
  irPara(r.livro, r.capitulo - 1, r.inicio == null ? null : r.inicio - 1, r.fim == null ? null : r.fim - 1);
  if (r.inicio != null) projetar();
  e.target.select();
};

$('btnProjetar').onclick = projetar;
$('btnLimpar').onclick = limpar;
$('btnAnterior').onclick = () => mover(-1);
$('btnProximo').onclick = () => mover(1);
$('btnAlternar').onclick = async () => desenharTelas(await window.api.alternarProjecao());
$('tela').onchange = (e) => e.target.value && mudar({ telaId: Number(e.target.value) });

$('cfgFonte').onchange = (e) => mudar({ fonte: e.target.value });
$('cfgTamanho').oninput = (e) => mudar({ tamanhoMax: Number(e.target.value) });
$('cfgAlinhamento').onchange = (e) => mudar({ alinhamento: e.target.value });
$('cfgCorTexto').oninput = (e) => mudar({ corTexto: e.target.value });
$('cfgCorFundo').oninput = (e) => mudar({ corFundo: e.target.value });
$('cfgMaiusculas').onchange = (e) => mudar({ maiusculas: e.target.checked });
$('cfgVersao').onchange = (e) => mudar({ mostrarVersao: e.target.checked });
$('btnFundo').onclick = async () => { config = await window.api.escolherFundo(); desenharPainel(); };
$('btnSemFundo').onclick = () => mudar({ imagemFundo: null });

$('btnBiblias').onclick = () => { $('msgBiblias').textContent = ''; $('dlgBiblias').showModal(); };
$('btnFecharBiblias').onclick = () => $('dlgBiblias').close();
$('btnImportar').onclick = async () => {
  try {
    const r = await window.api.importarBiblia();
    if (!r) return;
    await atualizarBiblias(r);
    await carregar(r.id);
    $('msgBiblias').textContent = '';
  } catch (e) {
    $('msgBiblias').textContent = 'Arquivo inválido: ' + String(e.message || e).replace(/^.*Error: /, '');
  }
};

document.addEventListener('keydown', (e) => {
  if ($('dlgBiblias').open) return;
  const digitando = e.target.matches('input[type=text]');
  if (e.key === 'Escape') {
    if (digitando) e.target.blur();
    else limpar();
    return;
  }
  if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 'l')) {
    e.preventDefault();
    $('rapida').focus();
    $('rapida').select();
    return;
  }
  if (e.key === 'PageDown') { e.preventDefault(); mover(1); return; }
  if (e.key === 'PageUp') { e.preventDefault(); mover(-1); return; }
  if (digitando || e.target.matches('select, input')) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
  else if (e.key === 'Enter' && !e.target.matches('button, summary')) { e.preventDefault(); projetar(); }
});

window.addEventListener('resize', desenharPainel);
window.api.aoMudarTelas(desenharTelas);

(async function iniciar() {
  const estado = await window.api.obterEstado();
  config = estado.config;
  aoVivo = estado.aoVivo;
  preencherAparencia();
  desenharTelas(await window.api.obterTelas());
  await atualizarBiblias();
  desenharTudo();
  if (!biblia) $('dlgBiblias').showModal();
})();
