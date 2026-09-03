/* ─────────────────────────────────────────────────────────────────────────
   EnseñAI — Imprimible del material de repaso (2-sep-2026)

   Archivo compartido por tema.html (modo individual), g.html (la liga del
   alumno) y grupo.html (el panel del maestro), igual que intro.js y
   feedback.js. Expone:

       window.EnsenaiImprimible.tarjetas(tipo, tarjetas)
       window.EnsenaiImprimible.materialExtra(materiales, tituloTema)
       window.EnsenaiImprimible.tarjetasHtml(tipo, tarjetas)   // por si se
                                                               // quiere pintar
                                                               // en la pagina
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  function escapeHtml(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ── Imprimible del material de repaso ─────────────────────────────────
     Pedido de la usuaria (2-sep-2026): "las tarjetas de repaso no se
     muestran correctamente, solo se ve de un lado y debe de mostrarse una
     parte de un lado y la otra del otro para doblarlas", y "el material de
     repaso que pueda solo imprimirse".

     Cómo queda:
     - memorama / relacionar: cada par se parte en DOS tarjetas sueltas (así
       funciona el juego de emparejar; un frente/reverso pegado no sirve).
     - flashcards / tarjetas: UNA tarjeta por elemento, partida a la mitad
       por la línea de doblez: arriba el frente, abajo el reverso. El reverso
       va impreso de cabeza a propósito: al doblar la mitad de abajo hacia
       atrás y voltear la tarjeta, el texto queda derecho. Si una tarjeta no
       trae reverso (temas viejos), la mitad de abajo queda en blanco con
       renglones para que el alumno escriba la respuesta.
     - "Imprimir todo el material de repaso" junta las tarjetas de todos los
       recursos MÁS los que son puro texto (crucigrama, glosario, línea del
       tiempo) en una sola hoja. */

  var ESTILOS_IMPRIMIBLE = `
  * { box-sizing: border-box; }
  body { font-family: 'Nunito', sans-serif; margin: 0; padding: 18px; background: #fff; color: #1E3A8A; }
  .encabezado { text-align: center; margin-bottom: 16px; }
  .encabezado h1 { font-family: 'Grandstander', sans-serif; font-size: 1.15rem; margin: 0 0 4px; color: #1E3A8A; }
  .encabezado p { margin: 0; font-size: 0.82rem; color: #5b7d99; }
  h2.seccion { font-family: 'Grandstander', sans-serif; font-size: 0.98rem; margin: 22px 0 4px; color: #1E3A8A; }
  p.seccion-nota { margin: 0 0 10px; font-size: 0.8rem; color: #5b7d99; }
  .bloque-texto { border: 2px solid #DCEEFC; border-radius: 12px; padding: 12px 14px; font-size: 0.9rem; line-height: 1.5; white-space: pre-line; page-break-inside: avoid; break-inside: avoid; }
  .rejilla { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .tarjeta-imprimible {
    border: 2px dashed #7DD3FC; border-radius: 12px; min-height: 112px; padding: 14px 10px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    page-break-inside: avoid; break-inside: avoid;
  }
  .tarjeta-texto { font-weight: 700; font-size: 0.95rem; line-height: 1.35; }
  /* Tarjeta de doblar: dos mitades del MISMO alto, con la línea justo enmedio. */
  .tarjeta-doblez { padding: 0; justify-content: stretch; min-height: 0; }
  .tarjeta-mitad {
    height: 96px; width: 100%; display: flex; align-items: center; justify-content: center;
    padding: 10px; font-weight: 700; font-size: 0.92rem; line-height: 1.3; text-align: center;
  }
  .tarjeta-linea-doblez {
    border-top: 1px dashed #7DD3FC; font-size: 0.62rem; color: #5b7d99; text-align: center;
    padding: 1px 0; letter-spacing: 0.06em;
  }
  /* De cabeza a propósito: ver el comentario de arriba. */
  .tarjeta-reverso { color: #065F46; background: #F0FDF4; border-radius: 0 0 10px 10px; transform: rotate(180deg); }
  .tarjeta-reverso.vacia { background: repeating-linear-gradient(to bottom, transparent 0 22px, #DCEEFC 22px 23px); color: #9CB6CC; font-weight: 600; font-size: 0.68rem; align-items: flex-start; }
  .no-imprimir { text-align: center; margin-bottom: 16px; }
  .no-imprimir button {
    font-family: 'Grandstander', sans-serif; font-weight: 600; background: #34D399; color: #fff; border: none;
    border-radius: 999px; padding: 9px 20px; font-size: 0.9rem; cursor: pointer;
  }
  @media print {
    body { padding: 0; }
    .no-imprimir { display: none; }
    .rejilla { grid-template-columns: repeat(2, 1fr); }
  }`;

  function esTipoEmparejar(tipo) {
    return tipo === "memorama" || tipo === "relacionar";
  }

  /** Las tarjetas de un recurso, ya como HTML de rejilla. */
  function tarjetasImprimiblesHtml(tipo, tarjetasOriginales) {
    const tarjetas = (tarjetasOriginales || []).filter((t) => t && (t.frente || t.reverso));
    if (!tarjetas.length) return "";

    if (esTipoEmparejar(tipo)) {
      const sueltas = [];
      tarjetas.forEach((t) => {
        if (t.frente) sueltas.push(t.frente);
        if (t.reverso) sueltas.push(t.reverso);
      });
      return sueltas
        .map((texto) => `<div class="tarjeta-imprimible"><div class="tarjeta-texto">${escapeHtml(texto)}</div></div>`)
        .join("");
    }

    return tarjetas
      .map((t) => {
        const reverso = (t.reverso || "").trim();
        return `
        <div class="tarjeta-imprimible tarjeta-doblez">
          <div class="tarjeta-mitad">${escapeHtml(t.frente || "")}</div>
          <div class="tarjeta-linea-doblez">✂ DOBLA AQUÍ ✂</div>
          <div class="tarjeta-mitad tarjeta-reverso${reverso ? "" : " vacia"}">${
            reverso ? escapeHtml(reverso) : "escribe aquí tu respuesta"
          }</div>
        </div>`;
      })
      .join("");
  }

  /** Abre la pestaña de impresión con el cuerpo ya armado. */
  function abrirVentanaImpresion(titulo, subtitulo, cuerpo) {
    const html = `<!doctype html>
  <html lang="es">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(titulo)} — EnseñAI</title>
  <link href="https://fonts.googleapis.com/css2?family=Grandstander:wght@600;700&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
  <style>${ESTILOS_IMPRIMIBLE}</style>
  </head>
  <body>
  <div class="no-imprimir"><button onclick="window.print()">🖨️ Imprimir</button></div>
  <div class="encabezado">
    <h1>${escapeHtml(titulo)}</h1>
    <p>${escapeHtml(subtitulo)}</p>
  </div>
  ${cuerpo}
  </body>
  </html>`;

    const ventana = window.open("", "_blank");
    if (!ventana) {
      alert("Tu navegador bloqueó la ventana de impresión — permite ventanas emergentes para ensenai.com e intenta de nuevo.");
      return;
    }
    ventana.document.write(html);
    ventana.document.close();
    ventana.onload = () => {
      setTimeout(() => ventana.print(), 300);
    };
  }

  /** Imprime UN recurso de tarjetas (el botón de cada bloque). */
  function imprimirTarjetas(tipo, tarjetasOriginales) {
    const cuerpo = tarjetasImprimiblesHtml(tipo, tarjetasOriginales);
    if (!cuerpo) return;
    abrirVentanaImpresion(
      "EnseñAI — Tarjetas",
      esTipoEmparejar(tipo)
        ? "Recorta cada tarjeta y júntalas en pares."
        : "Recorta cada tarjeta, dobla hacia atrás por la línea punteada y listo: pregunta de un lado, respuesta del otro.",
      `<div class="rejilla">${cuerpo}</div>`
    );
  }

  /** Imprime TODO el material de repaso de un tema, en una sola hoja. */
  function imprimirMaterialExtra(materiales, tituloTema) {
    const lista = (materiales || []).filter(Boolean);
    if (!lista.length) return;

    const secciones = lista
      .map((m) => {
        const tarjetas = tarjetasImprimiblesHtml(m.tipo, m.tarjetas);
        const nombre = (m.tipo || "material").replace(/_/g, " ");
        const nota = m.contenido ? escapeHtml(m.contenido) : "";
        if (tarjetas) {
          return `<h2 class="seccion">${escapeHtml(nombre)}</h2>
            <p class="seccion-nota">${
              nota ||
              (esTipoEmparejar(m.tipo)
                ? "Recorta cada tarjeta y júntalas en pares."
                : "Recorta, dobla por la línea punteada y repasa.")
            }</p>
            <div class="rejilla">${tarjetas}</div>`;
        }
        if (!m.contenido) return "";
        return `<h2 class="seccion">${escapeHtml(nombre)}</h2>
          <div class="bloque-texto">${nota}</div>`;
      })
      .filter(Boolean)
      .join("");

    if (!secciones) return;
    abrirVentanaImpresion(
      "EnseñAI — Material de repaso",
      tituloTema ? `Tema: ${tituloTema}` : "Recorta, dobla y repasa.",
      secciones
    );
  }

  window.EnsenaiImprimible = {
    tarjetas: imprimirTarjetas,
    materialExtra: imprimirMaterialExtra,
    tarjetasHtml: tarjetasImprimiblesHtml,
    esEmparejar: esTipoEmparejar,
  };
})();
