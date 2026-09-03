/* ─────────────────────────────────────────────────────────────────────────
   EnseñAI — Diagramas del tema (versión responsiva, 2-sep-2026)

   ANTES: cada diagrama se dibujaba como un SVG con viewBox de 600 de ancho
   y `min-width: 460px`. En una pantalla de 360px eso deja dos malos
   caminos: o hay scroll lateral (media mitad del diagrama no se ve), o el
   SVG se encoge y el texto de 10.5px acaba renderizando a ~6px, ilegible.
   Reporte de la usuaria: "la parte del diagrama donde lo explica en celular
   se ve incorrectamente".

   AHORA: los diagramas son HTML + CSS. Se reacomodan solos (una columna en
   celular, dos o tres en pantalla ancha), el texto siempre se lee al tamaño
   real del navegador, se puede seleccionar y copiar, y al imprimir se
   reparte en páginas en vez de salir cortado.

   Se carga como archivo aparte (mismo patrón que intro.js y feedback.js)
   porque lo usan tema.html, g.html y grupo.html. Expone:

       window.EnsenaiDiagrama.dibujar(diagrama) -> string de HTML ("" si no
       hay un diagrama válido)

   Los estilos se inyectan en <head> una sola vez, porque esas páginas
   reescriben #contenido a cada rato.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var COLORES = ["#1E3A8A", "#34D399", "#F97066", "#7C6FE0", "#F5A524", "#60A5FA"];

  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function color(i) {
    return COLORES[i % COLORES.length];
  }

  /* ── Estilos ──────────────────────────────────────────────────────────
     Todo en una columna por default (celular primero). A partir de 560px
     las filas que tienen "nombre + explicación" se parten en dos columnas.  */
  var CSS = [
    ".dg-caja{border:2px solid var(--linea,#DCEEFC);border-radius:16px;padding:14px;margin-bottom:18px;background:#fff;}",
    ".dg-caja h3.dg-titulo{font-family:'Grandstander',sans-serif;font-size:1rem;margin:0 0 10px;color:var(--profundo,#1E3A8A);}",
    ".dg-todo{background:var(--profundo,#1E3A8A);color:#fff;border-radius:12px;padding:10px 14px;font-weight:800;font-size:0.95rem;line-height:1.3;text-align:center;margin-bottom:10px;}",
    ".dg-lista{display:flex;flex-direction:column;gap:8px;}",
    /* fila con barra de color a la izquierda: partes, jerarquía, mapa mental */
    ".dg-fila{border:1.5px solid var(--linea,#DCEEFC);border-radius:12px;padding:10px 12px;border-left-width:6px;background:#fff;}",
    ".dg-fila .dg-nombre{font-weight:800;font-size:0.92rem;line-height:1.3;}",
    ".dg-fila .dg-detalle{font-size:0.86rem;line-height:1.45;color:#4A6A85;margin-top:3px;}",
    ".dg-fila ul.dg-hijos{margin:6px 0 0;padding-left:18px;}",
    ".dg-fila ul.dg-hijos li{font-size:0.85rem;line-height:1.45;color:#4A6A85;margin:2px 0;}",
    /* pasos numerados: proceso y ciclo */
    ".dg-paso{display:flex;gap:10px;align-items:flex-start;border:1.5px solid var(--linea,#DCEEFC);border-radius:12px;padding:10px 12px;background:#fff;}",
    ".dg-paso .dg-num{flex:0 0 auto;width:28px;height:28px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Grandstander',sans-serif;font-weight:700;font-size:0.9rem;}",
    ".dg-paso .dg-cuerpo{min-width:0;flex:1 1 auto;}",
    ".dg-flecha{text-align:center;color:#B9CFE4;font-size:1rem;line-height:1;margin:-2px 0;}",
    ".dg-cierra-ciclo{text-align:center;font-size:0.8rem;font-weight:700;color:#5b7d99;background:#F7FAFD;border-radius:999px;padding:5px 10px;}",
    /* línea de tiempo */
    ".dg-hito{display:flex;gap:10px;align-items:flex-start;}",
    ".dg-hito .dg-marca{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;align-self:stretch;}",
    ".dg-hito .dg-punto{width:13px;height:13px;border-radius:50%;margin-top:5px;}",
    ".dg-hito .dg-linea{flex:1 1 auto;width:3px;background:var(--linea,#DCEEFC);border-radius:2px;margin:4px 0 0;}",
    ".dg-hito .dg-fecha{font-family:'Grandstander',sans-serif;font-weight:700;font-size:0.82rem;}",
    ".dg-hito .dg-cuerpo{min-width:0;flex:1 1 auto;padding-bottom:12px;}",
    /* comparativo: tarjeta por fila en celular, tabla real en pantalla ancha */
    ".dg-comp{display:flex;flex-direction:column;gap:8px;}",
    ".dg-comp-fila{border:1.5px solid var(--linea,#DCEEFC);border-radius:12px;padding:10px 12px;}",
    ".dg-comp-fila .dg-criterio{font-weight:800;font-size:0.9rem;color:var(--profundo,#1E3A8A);margin-bottom:6px;}",
    ".dg-comp-valor{display:flex;gap:8px;align-items:baseline;margin:4px 0;}",
    ".dg-comp-valor .dg-col{flex:0 0 auto;font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.02em;border-radius:999px;padding:2px 8px;color:#fff;}",
    ".dg-comp-valor .dg-txt{font-size:0.87rem;line-height:1.45;color:#2E4A63;min-width:0;}",
    "@media (min-width:620px){",
    "  .dg-fila.dg-dos{display:grid;grid-template-columns:minmax(120px,34%) 1fr;gap:12px;align-items:baseline;}",
    "  .dg-fila.dg-dos .dg-detalle{margin-top:0;}",
    "}",
    /* Ilustraciones de la biblioteca (icon_library) */
    ".dg-ilustraciones{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;}",
    ".dg-ilus{border:2px solid var(--linea,#DCEEFC);border-radius:16px;background:#fff;padding:12px;text-align:center;}",
    ".dg-ilus img{max-width:100%;height:auto;max-height:220px;display:block;margin:0 auto;}",
    ".dg-ilus figcaption{font-size:0.8rem;font-weight:800;color:var(--profundo,#1E3A8A);margin-top:8px;line-height:1.3;}",
    ".dg-ilus .dg-credito{font-size:0.68rem;color:#7794AC;font-weight:600;margin-top:3px;line-height:1.35;}",
    "@media print{",
    "  .dg-caja{break-inside:auto;}",
    "  .dg-fila,.dg-paso,.dg-hito,.dg-comp-fila,.dg-ilus{break-inside:avoid;page-break-inside:avoid;}",
    "}",
  ].join("\n");

  function inyectarEstilos() {
    if (document.getElementById("estilos-diagrama")) return;
    var s = document.createElement("style");
    s.id = "estilos-diagrama";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── Dibujantes ────────────────────────────────────────────────────── */

  function partes(d) {
    var lista = (d.partes || []).filter(Boolean).slice(0, 8);
    if (!lista.length) return "";
    return (
      (d.todo ? '<div class="dg-todo">' + esc(d.todo) + "</div>" : "") +
      '<div class="dg-lista">' +
      lista
        .map(function (p, i) {
          var c = color(i + 1);
          return (
            '<div class="dg-fila dg-dos" style="border-left-color:' + c + '">' +
            '<div class="dg-nombre" style="color:' + c + '">' + esc(p.nombre || "") + "</div>" +
            (p.funcion ? '<div class="dg-detalle">' + esc(p.funcion) + "</div>" : "") +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function proceso(d) {
    var pasos = (d.pasos || []).filter(Boolean).slice(0, 8);
    if (!pasos.length) return "";
    return (
      '<div class="dg-lista">' +
      pasos
        .map(function (p, i) {
          var c = color(i);
          return (
            '<div class="dg-paso">' +
            '<div class="dg-num" style="background:' + c + '">' + (i + 1) + "</div>" +
            '<div class="dg-cuerpo">' +
            '<div class="dg-nombre">' + esc(p.titulo || "") + "</div>" +
            (p.detalle ? '<div class="dg-detalle">' + esc(p.detalle) + "</div>" : "") +
            "</div></div>" +
            (i < pasos.length - 1 ? '<div class="dg-flecha">▼</div>' : "")
          );
        })
        .join("") +
      "</div>"
    );
  }

  function ciclo(d) {
    var etapas = (d.etapas || []).filter(Boolean).slice(0, 8);
    if (etapas.length < 2) return "";
    return (
      '<div class="dg-lista">' +
      etapas
        .map(function (e, i) {
          var c = color(i);
          return (
            '<div class="dg-paso">' +
            '<div class="dg-num" style="background:' + c + '">' + (i + 1) + "</div>" +
            '<div class="dg-cuerpo">' +
            '<div class="dg-nombre">' + esc(e.titulo || "") + "</div>" +
            (e.detalle ? '<div class="dg-detalle">' + esc(e.detalle) + "</div>" : "") +
            "</div></div>" +
            '<div class="dg-flecha">▼</div>'
          );
        })
        .join("") +
      '<div class="dg-cierra-ciclo">↻ y vuelve a empezar</div>' +
      "</div>"
    );
  }

  function jerarquia(d) {
    var niveles = (d.niveles || []).filter(Boolean).slice(0, 6);
    if (!niveles.length) return "";
    return (
      (d.raiz ? '<div class="dg-todo">' + esc(d.raiz) + "</div>" : "") +
      '<div class="dg-lista">' +
      niveles
        .map(function (n, i) {
          var c = color(i + 1);
          var hijos = (n.hijos || []).filter(Boolean).slice(0, 6);
          return (
            '<div class="dg-fila" style="border-left-color:' + c + '">' +
            '<div class="dg-nombre" style="color:' + c + '">' + esc(n.titulo || "") + "</div>" +
            (hijos.length
              ? '<ul class="dg-hijos">' + hijos.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>"
              : "") +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function mapaMental(d) {
    var ramas = (d.ramas || []).filter(Boolean).slice(0, 7);
    if (!ramas.length) return "";
    return (
      (d.centro ? '<div class="dg-todo">' + esc(d.centro) + "</div>" : "") +
      '<div class="dg-lista">' +
      ramas
        .map(function (r, i) {
          var c = color(i + 1);
          var hijos = (r.hijos || []).filter(Boolean).slice(0, 6);
          return (
            '<div class="dg-fila" style="border-left-color:' + c + '">' +
            '<div class="dg-nombre" style="color:' + c + '">' + esc(r.titulo || "") + "</div>" +
            (hijos.length
              ? '<ul class="dg-hijos">' + hijos.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>"
              : "") +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function lineaTiempo(d) {
    var hitos = (d.hitos || []).filter(Boolean).slice(0, 10);
    if (!hitos.length) return "";
    return (
      '<div class="dg-lista" style="gap:0;">' +
      hitos
        .map(function (h, i) {
          var c = color(i);
          return (
            '<div class="dg-hito">' +
            '<div class="dg-marca">' +
            '<div class="dg-punto" style="background:' + c + '"></div>' +
            (i < hitos.length - 1 ? '<div class="dg-linea"></div>' : "") +
            "</div>" +
            '<div class="dg-cuerpo">' +
            (h.fecha ? '<div class="dg-fecha" style="color:' + c + '">' + esc(h.fecha) + "</div>" : "") +
            '<div class="dg-nombre">' + esc(h.titulo || "") + "</div>" +
            (h.detalle ? '<div class="dg-detalle">' + esc(h.detalle) + "</div>" : "") +
            "</div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function comparativo(d) {
    var cols = (d.columnas || []).filter(Boolean).slice(0, 4);
    var filas = (d.filas || []).filter(Boolean).slice(0, 8);
    if (!cols.length || !filas.length) return "";
    return (
      '<div class="dg-comp">' +
      filas
        .map(function (f) {
          var valores = (f.valores || []).slice(0, cols.length);
          return (
            '<div class="dg-comp-fila">' +
            '<div class="dg-criterio">' + esc(f.criterio || "") + "</div>" +
            cols
              .map(function (c, j) {
                if (!valores[j]) return "";
                return (
                  '<div class="dg-comp-valor">' +
                  '<span class="dg-col" style="background:' + color(j) + '">' + esc(c) + "</span>" +
                  '<span class="dg-txt">' + esc(valores[j]) + "</span>" +
                  "</div>"
                );
              })
              .join("") +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  var DIBUJANTES = {
    mapa_mental: mapaMental,
    linea_tiempo: lineaTiempo,
    comparativo: comparativo,
    proceso: proceso,
    ciclo: ciclo,
    jerarquia: jerarquia,
    partes: partes,
  };

  /**
   * Devuelve el HTML del diagrama, o "" si no hay uno válido.
   * Un diagrama mal formado nunca debe tumbar la vista del tema: cualquier
   * error se traga y simplemente no se dibuja.
   */
  function dibujar(diagrama) {
    if (!diagrama || !diagrama.tipo) return "";
    var fn = DIBUJANTES[diagrama.tipo];
    if (!fn) return "";
    var cuerpo = "";
    try {
      cuerpo = fn(diagrama.datos || {});
    } catch (err) {
      return "";
    }
    if (!cuerpo) return "";
    inyectarEstilos();
    return (
      '<div class="dg-caja">' +
      (diagrama.titulo ? '<h3 class="dg-titulo">' + esc(diagrama.titulo) + "</h3>" : "") +
      cuerpo +
      "</div>"
    );
  }

  /**
   * Ilustraciones de la biblioteca que el material trae colgadas
   * (`contenido.ilustraciones`, ver adjuntarIlustraciones en
   * routes/temas.js). Son imágenes fijas subidas a mano desde admin.html y
   * empatadas por palabras clave — no las genera la IA.
   *
   * Se pintan con <img src>, nunca inyectando el SVG en la página: un SVG
   * es un documento y podría traer script. Con <img> el navegador no
   * ejecuta nada de dentro. (El archivo además ya se limpió al subirse, en
   * utils/archivosBiblioteca.js — esto es la segunda cerradura.)
   *
   * El crédito se pinta cuando lo hay porque muchas licencias libres
   * (Wikimedia sobre todo) lo piden.
   */
  function ilustraciones(lista) {
    var items = (lista || []).filter(function (i) {
      return i && i.image_url;
    });
    if (!items.length) return "";
    inyectarEstilos();
    return (
      '<div class="dg-ilustraciones">' +
      items
        .map(function (i) {
          var credito = [i.autor, i.licencia].filter(Boolean).join(" · ");
          return (
            '<figure class="dg-ilus">' +
            '<img src="' + esc(i.image_url) + '" alt="' + esc(i.nombre || "") + '" loading="lazy">' +
            (i.nombre ? "<figcaption>" + esc(i.nombre) + "</figcaption>" : "") +
            (credito ? '<div class="dg-credito">' + esc(credito) + "</div>" : "") +
            "</figure>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  window.EnsenaiDiagrama = { dibujar: dibujar, ilustraciones: ilustraciones, css: CSS };
})();
