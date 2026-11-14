// Lista dos 66 livros (ordem protestante) e interpretação de referências digitadas.
// Funciona tanto no navegador (window.Livros) quanto no Node (module.exports).
(function (root) {
  const LIVROS = [
    ['Gênesis', 'gn'], ['Êxodo', 'ex'], ['Levítico', 'lv'], ['Números', 'nm'], ['Deuteronômio', 'dt'],
    ['Josué', 'js'], ['Juízes', 'jz'], ['Rute', 'rt'], ['1 Samuel', '1sm'], ['2 Samuel', '2sm'],
    ['1 Reis', '1rs'], ['2 Reis', '2rs'], ['1 Crônicas', '1cr'], ['2 Crônicas', '2cr'], ['Esdras', 'ed'],
    ['Neemias', 'ne'], ['Ester', 'et'], ['Jó', 'job'], ['Salmos', 'sl'], ['Provérbios', 'pv'],
    ['Eclesiastes', 'ec'], ['Cânticos', 'ct'], ['Isaías', 'is'], ['Jeremias', 'jr'], ['Lamentações', 'lm'],
    ['Ezequiel', 'ez'], ['Daniel', 'dn'], ['Oséias', 'os'], ['Joel', 'jl'], ['Amós', 'am'],
    ['Obadias', 'ob'], ['Jonas', 'jn'], ['Miquéias', 'mq'], ['Naum', 'na'], ['Habacuque', 'hc'],
    ['Sofonias', 'sf'], ['Ageu', 'ag'], ['Zacarias', 'zc'], ['Malaquias', 'ml'],
    ['Mateus', 'mt'], ['Marcos', 'mc'], ['Lucas', 'lc'], ['João', 'jo'], ['Atos', 'at'],
    ['Romanos', 'rm'], ['1 Coríntios', '1co'], ['2 Coríntios', '2co'], ['Gálatas', 'gl'], ['Efésios', 'ef'],
    ['Filipenses', 'fp'], ['Colossenses', 'cl'], ['1 Tessalonicenses', '1ts'], ['2 Tessalonicenses', '2ts'],
    ['1 Timóteo', '1tm'], ['2 Timóteo', '2tm'], ['Tito', 'tt'], ['Filemom', 'fm'], ['Hebreus', 'hb'],
    ['Tiago', 'tg'], ['1 Pedro', '1pe'], ['2 Pedro', '2pe'], ['1 João', '1jo'], ['2 João', '2jo'],
    ['3 João', '3jo'], ['Judas', 'jd'], ['Apocalipse', 'ap'],
  ].map(([nome, abrev]) => ({ nome, abrev }));

  // Apelidos extras aceitos na digitação rápida.
  const EXTRAS = { sal: 18, salmo: 18, cantares: 21, cnt: 21, fl: 49, fil: 49, ti: 55, apoc: 65, rom: 44, heb: 57, hebr: 57 };

  function normalizar(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function acharLivro(texto) {
    const bruto = String(texto).trim().toLowerCase().replace(/[\s.]+/g, '');
    if (!bruto) return -1;
    if (bruto === 'jó') return 17; // "jó" (com acento) é Jó; "jo" é João
    const t = normalizar(bruto);
    let i = LIVROS.findIndex((l) => l.abrev === t);
    if (i >= 0) return i;
    if (t in EXTRAS) return EXTRAS[t];
    const nomes = LIVROS.map((l) => normalizar(l.nome).replace(/\s+/g, ''));
    i = nomes.indexOf(t);
    if (i >= 0) return i;
    return nomes.findIndex((n) => n.startsWith(t));
  }

  // "jo 3 16", "João 3:16-18", "1co 13.4", "sl 23" -> { livro, capitulo, inicio, fim } (base 1) ou null
  function interpretar(texto) {
    const m = String(texto).trim().match(/^(\d?\s*[^\d\s][^\d]*?)\s*(\d+)(?:\s*[\s:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?$/);
    if (!m) return null;
    const livro = acharLivro(m[1]);
    if (livro < 0) return null;
    const capitulo = +m[2];
    const inicio = m[3] ? +m[3] : null;
    const fim = m[4] ? Math.max(+m[4], inicio) : inicio;
    return { livro, capitulo, inicio, fim };
  }

  const api = { LIVROS, normalizar, acharLivro, interpretar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Livros = api;
})(typeof window !== 'undefined' ? window : globalThis);
