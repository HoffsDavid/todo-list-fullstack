# Projetor Bíblico

Programa para Windows 11 que mostra versículos bíblicos na **segunda tela** (projetor/TV),
enquanto o operador escolhe o versículo na **primeira tela**.

## Como usar

1. Ligue o projetor/TV e deixe o Windows em modo **Estender** (`Win + P` → Estender).
2. Abra o programa. A janela de controle abre na tela principal e a projeção em tela cheia na segunda tela.
3. Na primeira vez, clique em **Bíblias…** e baixe uma versão (precisa de internet só nessa hora)
   ou importe um arquivo JSON.
4. Escolha livro → capítulo → versículo e clique em **Projetar** (ou dê dois cliques no versículo).

| Ação | Atalho |
| --- | --- |
| Digitar uma referência (`jo 3 16`, `sl 23 1-3`, `1co 13 4`) | `F2` ou `Ctrl+L`, depois `Enter` |
| Projetar o versículo selecionado | `Enter` ou duplo clique |
| Próximo / anterior (já projeta se houver algo na tela) | `↓` `↑` ou `PageDown` `PageUp` (funciona com passador de slides) |
| Selecionar vários versículos | `Shift` + clique |
| Limpar a tela | `Esc` |

Outros recursos: busca por palavras, histórico, troca de versão, escolha da tela de projeção,
botão para ocultar a projeção, e aparência (fonte, tamanho, cores, imagem de fundo).
O texto se ajusta sozinho para caber na tela.

## Instalar

O instalador (`.exe`) é gerado automaticamente pelo GitHub Actions (aba **Actions** → *Projetor Bíblico (Windows)* →
artefato `projetor-biblico-windows`). Há também uma versão portátil que não precisa de instalação.

Para gerar no próprio computador (com [Node.js](https://nodejs.org) instalado):

```
cd projetor-biblico
npm install
npm start        # abre o programa
npm run dist     # gera o instalador em dist/
```

## Bíblias

O programa não vem com o texto bíblico embutido. As versões oferecidas para download (ACF e AA) vêm do
projeto público [thiagobodruk/biblia](https://github.com/thiagobodruk/biblia). Outras traduções podem ser
importadas em JSON no mesmo formato (lista de 66 livros com `chapters`). Confirme a licença da tradução
que a igreja for usar.
