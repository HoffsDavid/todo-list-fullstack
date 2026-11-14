const slide = document.getElementById('slide');
let estado = null;
const desenhar = () => estado && desenharSlide(slide, estado.aoVivo, estado.config);
window.api.aoMudarEstado((e) => { estado = e; desenhar(); });
window.api.obterEstado().then((e) => { estado = e; desenhar(); });
window.addEventListener('resize', desenhar);
