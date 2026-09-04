/**
 * Barra de pestañas de abajo, compartida por tema.html y grupo.html
 * (4-sep-2026).
 *
 * Nació de un problema real: el perfil de papás traía perfil, racha,
 * progreso, biblioteca de plantillas e historial de temas TODO en la misma
 * pantalla, y con 230 plantillas eso era un scroll interminable. En vez de
 * esconder cosas en un menú de hamburguesa —donde lo que se guarda deja de
 * usarse— se parte en 3 secciones siempre visibles, como cualquier app de
 * celular.
 *
 * Vive fuera de #contenido (igual que la barra de racha) porque esas
 * páginas reescriben ese contenedor a cada rato y la barra se perdería.
 */
(function () {
  const ESTILOS = `
  .barra-tabs {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
    background: #fff; border-top: 2px solid var(--linea, #DCEEFC);
    display: none; box-shadow: 0 -2px 12px rgba(30,58,138,0.06);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .barra-tabs.visible { display: block; }
  .barra-tabs-interna { max-width: 640px; margin: 0 auto; display: flex; }
  .barra-tabs button {
    flex: 1 1 0; margin: 0; width: auto; border: 0; background: none;
    padding: 9px 4px 11px; font-family: inherit; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    color: #4A6A85; font-size: 0.72rem; font-weight: 800; line-height: 1.1;
    border-radius: 0; box-shadow: none;
  }
  .barra-tabs button .tab-icono { font-size: 1.35rem; line-height: 1; }
  .barra-tabs button .tab-globo {
    font-size: 0.62rem; font-weight: 800; color: #fff;
    background: var(--coral, #F97066); border-radius: 999px; padding: 1px 6px;
  }
  .barra-tabs button.activa { color: var(--profundo, #1E3A8A); }
  .barra-tabs button.activa .tab-icono { transform: translateY(-1px); }
  .barra-tabs button { position: relative; }
  .barra-tabs button.activa::before {
    content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 34px; height: 4px; border-radius: 0 0 4px 4px; background: var(--profundo, #1E3A8A);
  }
  /* El numerito no debe empujar el texto de la pestaña. */
  .barra-tabs button .tab-globo { position: absolute; top: 4px; right: 22%; }
  body.con-tabs { padding-bottom: 84px; }
  /* El botón de comentarios (feedback.js) vive abajo a la derecha con la
     misma esquina que la barra: se sube para que no se encimen. Su clase
     .subido ya lo levanta 78px cuando aparece el aviso de generación, así
     que aquí se suma sobre eso. */
  /* En iPhone con rayita del home la barra crece por la franja segura, así
     que el botón tiene que subir esos píxeles de más o se encima (visto en
     un iPhone 14 Pro emulado: se pasaba por 1 px). */
  body.con-tabs #fb-lanzador { bottom: calc(96px + env(safe-area-inset-bottom, 0px)); }
  body.con-tabs #fb-lanzador.subido { bottom: calc(158px + env(safe-area-inset-bottom, 0px)); }
  `;

  let alCambiar = null;
  let activa = null;

  function estilos() {
    if (document.getElementById("estilos-tabs")) return;
    const tag = document.createElement("style");
    tag.id = "estilos-tabs";
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
  }

  function caja() {
    let el = document.getElementById("barra-tabs");
    if (!el) {
      el = document.createElement("nav");
      el.id = "barra-tabs";
      el.className = "barra-tabs";
      el.innerHTML = `<div class="barra-tabs-interna"></div>`;
      document.body.appendChild(el);
    }
    return el;
  }

  /**
   * montar({ tabs: [{id, icono, texto, globo?}], activa, onCambio })
   * `globo` es un numerito opcional (ej. cuántas plantillas hay).
   */
  function montar({ tabs, activa: inicial, onCambio }) {
    estilos();
    const el = caja();
    activa = inicial || tabs[0].id;
    alCambiar = onCambio;

    el.querySelector(".barra-tabs-interna").innerHTML = tabs
      .map(
        (t) => `
      <button type="button" data-tab="${t.id}" class="${t.id === activa ? "activa" : ""}">
        <span class="tab-icono">${t.icono}</span>
        <span>${t.texto}</span>
        ${t.globo ? `<span class="tab-globo">${t.globo}</span>` : ""}
      </button>`
      )
      .join("");

    el.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.tab === activa) {
          // Tocar la pestaña donde ya estás sube al principio, como en las
          // apps de siempre.
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        marcar(b.dataset.tab);
        if (alCambiar) alCambiar(b.dataset.tab);
      })
    );
    mostrar(true);
  }

  function marcar(id) {
    activa = id;
    document.querySelectorAll("#barra-tabs [data-tab]").forEach((b) =>
      b.classList.toggle("activa", b.dataset.tab === id)
    );
  }

  function mostrar(si) {
    const el = document.getElementById("barra-tabs");
    if (!el) return;
    el.classList.toggle("visible", !!si);
    document.body.classList.toggle("con-tabs", !!si);
  }

  /** Cambia el numerito de una pestaña sin volver a montar todo. */
  function globo(id, valor) {
    const b = document.querySelector(`#barra-tabs [data-tab="${id}"]`);
    if (!b) return;
    let g = b.querySelector(".tab-globo");
    if (!valor) {
      g?.remove();
      return;
    }
    if (!g) {
      g = document.createElement("span");
      g.className = "tab-globo";
      b.appendChild(g);
    }
    g.textContent = valor;
  }

  window.EnsenaiTabs = { montar, mostrar, marcar, globo, actual: () => activa };
})();
