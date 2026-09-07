/**
 * Biblioteca de plantillas, compartida por tema.html (papás y alumnos que
 * estudian solos) y grupo.html (maestros y psicólogos) — 4-sep-2026.
 *
 * Vivía duplicada en las dos páginas; aquí queda en un solo lugar, como
 * intro.js y feedback.js. Igual que aquellos, se cuelga de window y mete
 * sus estilos en <head>, porque esas páginas reescriben #contenido a cada
 * rato y un <style> dentro del contenedor se perdería.
 *
 * Dos piezas distintas:
 *
 *   biblioteca()  — el catálogo completo con buscador, chips y secciones.
 *                   Es del plan Ilimitado; a los demás se les pinta la
 *                   invitación con el conteo real de hojas que hay.
 *
 *   delTema()     — las 2 o 3 hojas que embonan con un tema recién
 *                   generado. Esas SÍ son para todos los planes: es el
 *                   material que le toca a lo que la persona está viendo.
 *
 * El servidor manda quién ve qué (routes/recursos.js). Aquí solo se pinta:
 * esconder un botón nunca fue un candado.
 */
(function () {
  const ETIQUETAS_CATEGORIA = {
    emociones: "🫶 Emociones",
    cuerpo_vida: "🌱 Cuerpo y vida",
    tierra_espacio: "🌎 Tierra y espacio",
    matematicas: "🔢 Matemáticas",
    mexico: "🇲🇽 México",
    lenguaje: "🔤 Lenguaje",
    convivencia: "🤝 Convivencia",
    planeacion: "🗂️ Planeación",
    evaluacion: "📝 Evaluación",
    otros: "📎 Otras",
  };
  const etiquetaCategoria = (c) => ETIQUETAS_CATEGORIA[c] || `📎 ${c}`;

  /**
   * Tramos de edad para filtrar (schema_v45).
   *
   * Claudia pidió filtrar por edad Y por grado. Son EL MISMO EJE — un niño
   * de 7 años está en primaria baja — así que en vez de dos filas de chips
   * peleándose por el ancho de un celular, cada chip dice las dos cosas:
   * la mamá lee "5 años" y la maestra lee "Preescolar".
   *
   * Una plantilla entra en el tramo cuando su rango se CRUZA con él, no
   * cuando coincide exacto: una hoja de "4 a 10 años" sale en preescolar,
   * en primaria baja y en primaria alta, que es la verdad.
   */
  const TRAMOS = [
    { id: "3-5",  edad: [3, 5],   corta: "3 a 5",   grado: "Preescolar" },
    { id: "6-8",  edad: [6, 8],   corta: "6 a 8",   grado: "Primaria baja" },
    { id: "9-12", edad: [9, 12],  corta: "9 a 12",  grado: "Primaria alta" },
    { id: "13+",  edad: [13, 99], corta: "13+",     grado: "Secundaria y más" },
  ];

  /** ¿Esta plantilla sirve para este tramo? Sin edad = sirve para todos. */
  function entraEnTramo(p, tramo) {
    if (!tramo) return true;
    if (p.edad_min == null && p.edad_max == null) return true;
    var min = p.edad_min == null ? 0 : p.edad_min;
    var max = p.edad_max == null ? 99 : p.edad_max;
    return !(max < tramo.edad[0] || min > tramo.edad[1]);
  }

  const ETIQUETAS_NIVEL = {
    preescolar: "Preescolar",
    primaria_baja: "Primaria baja",
    primaria_alta: "Primaria alta",
    secundaria: "Secundaria",
    preparatoria: "Preparatoria",
    universidad: "Universidad",
  };

  const ESTILOS = `
  .pl-caja { margin: 0; }
  .pl-buscador { width: 100%; padding: 10px 12px; font-size: 0.95rem; font-family: inherit; margin-bottom: 8px; }
  .pl-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; align-items: center; }
  /* Fila de edad. Los chips traen dos renglones (edad arriba, grado abajo)
     porque son el mismo filtro dicho en los dos idiomas: el de la mamá y el
     de la maestra. En celular la fila se arrastra de lado en vez de
     apretujarse. */
  .pl-edades { display: flex; gap: 6px; margin-bottom: 10px; align-items: center;
               overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
  .pl-edades::-webkit-scrollbar { height: 4px; }
  .pl-edades::-webkit-scrollbar-thumb { background: var(--linea, #dfe7ef); border-radius: 2px; }
  @media (max-width: 560px) {
    .pl-edades { -webkit-mask-image: linear-gradient(to right, #000 88%, transparent 100%);
                 mask-image: linear-gradient(to right, #000 88%, transparent 100%); }
  }
  .pl-et { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
           color: #8aa0b8; flex: 0 0 auto; margin-right: 2px; }
  .pl-chip.pl-edad { display: flex; flex-direction: column; align-items: center; line-height: 1.15;
                     padding: 5px 13px; flex: 0 0 auto; }
  .pl-chip.pl-edad small { font-size: 0.66rem; font-weight: 600; opacity: 0.72; margin-top: 1px; }
  .pl-chip { border: 2px solid var(--linea, #dfe7ef); background: #fff; border-radius: 999px; padding: 5px 12px; font-size: 0.82rem; font-weight: 700; font-family: inherit; cursor: pointer; color: #4A6A85; margin: 0; width: auto; }
  .pl-chip.activo { background: var(--profundo, #2b3f8c); border-color: var(--profundo, #2b3f8c); color: #fff; }
  .pl-grupo { border: 2px solid var(--linea, #dfe7ef); border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
  .pl-grupo > summary { list-style: none; cursor: pointer; padding: 11px 13px; font-weight: 800; font-size: 0.93rem; display: flex; justify-content: space-between; gap: 8px; }
  .pl-grupo > summary::-webkit-details-marker { display: none; }
  .pl-grupo > summary .pl-cuantas { font-weight: 700; color: #4A6A85; font-size: 0.85rem; }
  .pl-grupo > div { padding: 0 10px 10px; }
  .pl-item { display: flex; gap: 10px; align-items: center; border: 1px solid var(--linea, #dfe7ef); border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; }
  .pl-item:last-child { margin-bottom: 0; }
  .pl-item .pl-icono { font-size: 1.3rem; flex: 0 0 auto; }
  .pl-item .pl-datos { flex: 1 1 auto; min-width: 0; }
  .pl-item .pl-nombre { font-weight: 800; font-size: 0.92rem; line-height: 1.3; }
  .pl-item .pl-desc { font-size: 0.82rem; color: #4A6A85; margin-top: 2px; }
  .pl-item button { margin: 0; width: auto; flex: 0 0 auto; padding: 8px 14px; font-size: 0.85rem; }
  .pl-nota { color: #4A6A85; font-size: 0.9rem; margin: 4px 0 0; }
  .pl-aviso { margin-top: 8px; }
  .pl-candado { text-align: center; padding: 6px 0 2px; }
  .pl-candado .pl-num { font-size: 1.8rem; font-weight: 900; color: var(--profundo, #2b3f8c); line-height: 1.1; }
  `;

  function meterEstilos() {
    if (document.getElementById("estilos-plantillas")) return;
    const tag = document.createElement("style");
    tag.id = "estilos-plantillas";
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
  }

  const escapar = (t) =>
    String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /** Sin acentos y en minúsculas, para que "matematicas" halle "Matemáticas". */
  const normalizar = (t) =>
    String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function fila(p) {
    const detalle = [p.descripcion, p.nivel ? ETIQUETAS_NIVEL[p.nivel] : null].filter(Boolean).join(" · ");
    return `
      <div class="pl-item">
        <div class="pl-icono">${p.tipo_mime === "application/pdf" ? "📄" : "🖼️"}</div>
        <div class="pl-datos">
          <div class="pl-nombre">${escapar(p.nombre)}</div>
          ${detalle ? `<div class="pl-desc">${escapar(detalle)}</div>` : ""}
        </div>
        <button type="button" class="secundario chico" data-descargar="${escapar(p.id)}">Descargar</button>
      </div>`;
  }

  /**
   * Bajar una hoja. El bucket es privado: el servidor revisa el plan y
   * firma una liga de 5 minutos. La pestaña se abre ANTES de pedirla,
   * porque abrirla después del await cuenta como ventana emergente y el
   * navegador la bloquea.
   */
  async function descargar({ API_BASE, token }, id, boton) {
    const ventana = window.open("", "_blank");
    const original = boton.textContent;
    boton.disabled = true;
    boton.textContent = "Preparando…";
    try {
      const res = await fetch(`${API_BASE}/api/recursos/plantillas/${id}/descargar`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "No se pudo preparar la descarga.");
      if (ventana) {
        ventana.location.href = data.url;
      } else {
        // Bloquearon la pestaña: no nos llevamos a la persona fuera de la
        // app, le dejamos una liga para que la abra ella.
        const liga = document.createElement("a");
        liga.href = data.url;
        liga.target = "_blank";
        liga.rel = "noopener";
        liga.textContent = "👉 Abrir la hoja";
        liga.style.cssText = "display:inline-block; margin-top:6px; font-weight:800;";
        boton.closest(".pl-item")?.after(liga);
        setTimeout(() => liga.remove(), 60000);
      }
    } catch (err) {
      if (ventana) ventana.close();
      const aviso = document.createElement("div");
      aviso.className = "error pl-aviso";
      aviso.textContent = err.message;
      boton.closest(".pl-item")?.after(aviso);
      setTimeout(() => aviso.remove(), 9000);
    } finally {
      boton.disabled = false;
      boton.textContent = original;
    }
  }

  function conectarDescargas(cont, ctx) {
    cont.querySelectorAll("[data-descargar]").forEach((b) =>
      b.addEventListener("click", () => descargar(ctx, b.dataset.descargar, b))
    );
  }

  /**
   * Catálogo completo. `cont` es el elemento donde se pinta todo; queda
   * escondido si no hay nada que ofrecer, para no dejar un recuadro vacío.
   *
   * opciones: { cont, API_BASE, token, onUpgrade }
   */
  async function biblioteca(opciones) {
    const { cont, API_BASE, token, onUpgrade } = opciones;
    if (!cont) return;
    meterEstilos();

    let todas = [];
    let categoria = "";
    let tramoId = "";
    let busqueda = "";

    let data;
    try {
      const res = await fetch(`${API_BASE}/api/recursos/plantillas`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      data = await res.json();
    } catch (err) {
      return; // sin biblioteca no pasa nada: la tarjeta se queda escondida
    }

    // Plan que no es Ilimitado: se le dice cuántas hay, no cuáles.
    if (data.bloqueada) {
      if (!data.total) return;
      cont.innerHTML = `
        <div class="pl-candado">
          <div class="pl-num">${data.total}</div>
          <p class="pl-nota" style="margin:2px 0 10px;">imprimibles listos en la biblioteca de EnseñAI.<br>
          Con el plan <strong>Ilimitado</strong> puedes buscar entre todos y bajar los que quieras.</p>
          <button type="button" class="primario" data-upgrade>Ver el plan Ilimitado</button>
          <p class="pl-nota" style="margin:8px 0 0; font-size:0.82rem;">Con tu plan actual sigues recibiendo los imprimibles que le quedan a cada tema que generas.</p>
        </div>`;
      cont.querySelector("[data-upgrade]")?.addEventListener("click", () => onUpgrade && onUpgrade());
      cont.dataset.plHay = "1";
      // El numerito de la pestaña se pone también con el candado puesto: que
      // se vea cuántos hay es justo el argumento de venta.
      cont.dataset.plTotal = String(data.total);
      return;
    }

    todas = data.plantillas || [];
    if (!todas.length) return;

    cont.innerHTML = `
      <input type="search" class="pl-buscador" placeholder="Busca por nombre… (ej. laberinto, emociones, tijeras)" autocomplete="off">
      <div class="pl-edades"></div>
      <div class="pl-chips"></div>
      <div class="pl-lista"></div>`;

    const inputBuscar = cont.querySelector(".pl-buscador");
    const contChips = cont.querySelector(".pl-chips");
    const contEdades = cont.querySelector(".pl-edades");
    const contLista = cont.querySelector(".pl-lista");

    function pintarEdades() {
      // Si el backend avisó que no existen las columnas de edad
      // (schema_v45 sin correr), no se pinta un filtro que no filtraría.
      if (data.sinEdad) { contEdades.innerHTML = ""; return; }
      const cuenta = {};
      TRAMOS.forEach((t) => {
        cuenta[t.id] = todas.filter((p) => entraEnTramo(p, t)).length;
      });
      const conAlgo = TRAMOS.filter((t) => cuenta[t.id] > 0);
      if (conAlgo.length < 2) { contEdades.innerHTML = ""; return; }

      contEdades.innerHTML =
        '<span class="pl-et">Edad</span>' +
        [
          `<button type="button" class="pl-chip pl-edad ${tramoId === "" ? "activo" : ""}" data-tramo="">Cualquiera</button>`,
          ...conAlgo.map(
            (t) =>
              `<button type="button" class="pl-chip pl-edad ${tramoId === t.id ? "activo" : ""}" data-tramo="${t.id}">` +
              `<b>${t.corta} años</b><small>${escapar(t.grado)}</small></button>`
          ),
        ].join("");

      contEdades.querySelectorAll("[data-tramo]").forEach((b) =>
        b.addEventListener("click", () => {
          tramoId = b.dataset.tramo;
          pintarEdades();
          pintarChips();
          pintarLista();
        })
      );
    }

    function pintarChips() {
      // Las cuentas se calculan SOBRE EL TRAMO YA ELEGIDO: si filtras por
      // 3 a 5 años, "Lenguaje (4)" tiene que decir cuántas hay de esa edad,
      // no cuántas hay en total. Un número que no cuadra con lo que se ve
      // abajo destruye la confianza en el filtro.
      const tramo = TRAMOS.find((t) => t.id === tramoId) || null;
      const visibles = todas.filter((p) => entraEnTramo(p, tramo));
      const cuenta = {};
      visibles.forEach((p) => {
        const c = p.categoria || "otros";
        cuenta[c] = (cuenta[c] || 0) + 1;
      });
      const cats = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a]);
      if (cats.length < 2) {
        contChips.innerHTML = "";
        return;
      }
      contChips.innerHTML = [
        `<span class="pl-et">Tema</span>`,
        `<button type="button" class="pl-chip ${categoria === "" ? "activo" : ""}" data-categoria="">Todos (${visibles.length})</button>`,
        ...cats.map(
          (c) =>
            `<button type="button" class="pl-chip ${categoria === c ? "activo" : ""}" data-categoria="${escapar(c)}">${escapar(etiquetaCategoria(c))} (${cuenta[c]})</button>`
        ),
      ].join("");
      contChips.querySelectorAll("[data-categoria]").forEach((b) =>
        b.addEventListener("click", () => {
          categoria = b.dataset.categoria;
          pintarChips();
          pintarLista();
        })
      );
    }

    function pintarLista() {
      const q = normalizar(busqueda).trim();
      const tramo = TRAMOS.find((t) => t.id === tramoId) || null;
      const lista = todas.filter((p) => {
        if (!entraEnTramo(p, tramo)) return false;
        if (categoria && (p.categoria || "otros") !== categoria) return false;
        if (!q) return true;
        return normalizar(`${p.nombre} ${p.descripcion || ""} ${p.categoria || ""}`).includes(q);
      });

      if (!lista.length) {
        contLista.innerHTML = `<p class="pl-nota">No encontré ninguna hoja con eso. Prueba con una palabra más corta.</p>`;
        return;
      }

      // Buscando, la persona quiere ver los resultados ya, no abrir cajones.
      if (q) {
        contLista.innerHTML =
          `<p class="pl-nota" style="margin-bottom:8px;">${lista.length} resultado${lista.length === 1 ? "" : "s"}</p>` +
          lista.slice(0, 60).map(fila).join("") +
          (lista.length > 60 ? `<p class="pl-nota">…y ${lista.length - 60} más. Escribe algo más específico.</p>` : "");
      } else {
        const porCat = {};
        lista.forEach((p) => {
          const c = p.categoria || "otros";
          (porCat[c] = porCat[c] || []).push(p);
        });
        const cats = Object.keys(porCat).sort((a, b) => porCat[b].length - porCat[a].length);
        const abrir = cats.length === 1;
        contLista.innerHTML = cats
          .map(
            (c) => `
          <details class="pl-grupo" ${abrir ? "open" : ""}>
            <summary><span>${escapar(etiquetaCategoria(c))}</span><span class="pl-cuantas">${porCat[c].length} hoja${porCat[c].length === 1 ? "" : "s"} ▾</span></summary>
            <div>${porCat[c].map(fila).join("")}</div>
          </details>`
          )
          .join("");
      }
      conectarDescargas(contLista, opciones);
    }

    inputBuscar.addEventListener("input", () => {
      busqueda = inputBuscar.value;
      pintarLista();
    });

    pintarEdades();
    pintarChips();
    pintarLista();
    cont.dataset.plHay = "1";
    cont.dataset.plTotal = String(todas.length);
  }

  /**
   * Las hojas que embonan con ESTE tema. Para todos los planes.
   * opciones: { cont, API_BASE, token, contenido }
   */
  async function delTema(opciones) {
    const { cont, API_BASE, token, contenido } = opciones;
    if (!cont) return;
    meterEstilos();
    try {
      const params = new URLSearchParams({ tema: contenido?.tema || "" });
      if (contenido?.nivel) params.set("nivel", contenido.nivel);
      if (contenido?.enfoque) params.set("enfoque", contenido.enfoque);

      const res = await fetch(`${API_BASE}/api/recursos/plantillas/para-tema?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      const lista = data.plantillas || [];
      if (!lista.length) return;

      // Pudo re-dibujarse mientras llegaba la respuesta.
      if (!document.body.contains(cont)) return;

      cont.innerHTML = `
        <div style="margin-top:18px; border-top:2px solid var(--linea,#dfe7ef); padding-top:14px;">
          <h3 style="margin:0 0 2px; font-size:1rem;">📎 Para imprimir</h3>
          <p class="pl-nota" style="margin:0 0 10px; font-size:0.85rem;">Imprimibles de nuestra biblioteca que le quedan a este tema.</p>
          ${lista.map(fila).join("")}
        </div>`;
      conectarDescargas(cont, opciones);
    } catch (err) {
      /* el material extra nunca puede tumbar el tema */
    }
  }

  window.EnsenaiPlantillas = { biblioteca, delTema };
})();
