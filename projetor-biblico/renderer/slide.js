// Desenha o "slide" (usado na tela de projeção e na pré-visualização).
// Todos os tamanhos são proporcionais à altura do slide, então a miniatura fica idêntica à projeção.
(function () {
  function desenharSlide(raiz, aoVivo, config) {
    const h = raiz.clientHeight || 1;
    raiz.classList.add('slide');
    raiz.style.backgroundColor = config.corFundo;
    raiz.style.backgroundImage = config.imagemFundo ? `url("${config.imagemFundo}")` : 'none';
    raiz.style.color = config.corTexto;
    raiz.style.fontFamily = `"${config.fonte}", "Segoe UI", Arial, sans-serif`;
    raiz.style.padding = `${h * 0.06}px ${h * 0.09}px`;
    raiz.replaceChildren();
    if (!aoVivo) return;

    const caixa = document.createElement('div');
    caixa.className = 'slide-caixa';
    const texto = document.createElement('div');
    texto.className = 'slide-texto';
    texto.style.textAlign = config.alinhamento;
    if (config.maiusculas) texto.style.textTransform = 'uppercase';
    const varios = aoVivo.versos.length > 1;
    for (const v of aoVivo.versos) {
      if (varios) {
        const n = document.createElement('sup');
        n.textContent = v.n;
        texto.append(n);
      }
      texto.append(v.texto + ' ');
    }
    caixa.append(texto);

    const ref = document.createElement('div');
    ref.className = 'slide-ref';
    ref.style.fontSize = h * 0.05 + 'px';
    ref.style.marginTop = h * 0.03 + 'px';
    ref.textContent = aoVivo.referencia + (config.mostrarVersao && aoVivo.versao ? `  •  ${aoVivo.versao}` : '');
    raiz.append(caixa, ref);

    // Maior tamanho de letra que cabe na caixa (busca binária), limitado pelo máximo configurado.
    let min = h * 0.02;
    let max = (h * config.tamanhoMax) / 100;
    texto.style.fontSize = max + 'px';
    if (texto.offsetHeight > caixa.clientHeight) {
      for (let i = 0; i < 12; i++) {
        const meio = (min + max) / 2;
        texto.style.fontSize = meio + 'px';
        if (texto.offsetHeight <= caixa.clientHeight) min = meio;
        else max = meio;
      }
      texto.style.fontSize = min + 'px';
    }
  }
  window.desenharSlide = desenharSlide;
})();
