const test = require('node:test');
const assert = require('node:assert');
const { interpretar, acharLivro, LIVROS } = require('../renderer/livros.js');

const nome = (i) => LIVROS[i].nome;

test('são 66 livros', () => assert.strictEqual(LIVROS.length, 66));

test('abreviações e nomes', () => {
  assert.strictEqual(nome(acharLivro('jo')), 'João');
  assert.strictEqual(nome(acharLivro('jó')), 'Jó');
  assert.strictEqual(nome(acharLivro('João')), 'João');
  assert.strictEqual(nome(acharLivro('1 co')), '1 Coríntios');
  assert.strictEqual(nome(acharLivro('gen')), 'Gênesis');
  assert.strictEqual(nome(acharLivro('salmo')), 'Salmos');
  assert.strictEqual(nome(acharLivro('apoc')), 'Apocalipse');
  assert.strictEqual(acharLivro('xyz'), -1);
});

test('referências', () => {
  assert.deepStrictEqual(interpretar('jo 3 16'), { livro: 42, capitulo: 3, inicio: 16, fim: 16 });
  assert.deepStrictEqual(interpretar('João 3:16-18'), { livro: 42, capitulo: 3, inicio: 16, fim: 18 });
  assert.deepStrictEqual(interpretar('1co 13.4'), { livro: 45, capitulo: 13, inicio: 4, fim: 4 });
  assert.deepStrictEqual(interpretar('1 João 4 8'), { livro: 61, capitulo: 4, inicio: 8, fim: 8 });
  assert.deepStrictEqual(interpretar('sl 23'), { livro: 18, capitulo: 23, inicio: null, fim: null });
  assert.deepStrictEqual(interpretar('sl23'), { livro: 18, capitulo: 23, inicio: null, fim: null });
  assert.strictEqual(interpretar('nada'), null);
  assert.strictEqual(interpretar(''), null);
});
