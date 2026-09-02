/**
 * Botón flotante de comentarios — piloto de septiembre 2026.
 *
 * Vive en un archivo aparte, y no pegado dentro de cada HTML, para que los
 * tres paneles (tema.html, grupo.html, comprador.html) compartan exactamente
 * el mismo widget: durante un piloto esto se ajusta a diario, y mantener
 * tres copias en tres archivos de miles de líneas termina en tres versiones
 * distintas.
 *
 * Se carga DESPUÉS del <script> principal de cada página, así que puede leer
 * sus variables de nivel superior (API_BASE, sesionActual) por nombre. Aun
 * así las lee a la defensiva: si algún día se carga antes o en una página
 * que no las declara, cae a valores propios en vez de tronar y llevarse la
 * página entera.
 */
(function () {
  "use strict";

  var API = typeof API_BASE !== "undefined" ? API_BASE : "https://ensenai-backend.onrender.com";
  var LLAVE_SESION = "sb-azslvqfgeghhzghfxmdh-auth-token";

  /** El token se lee al momento de enviar, no al cargar: cuando el widget se
   *  monta la sesión todavía no existe (init() es asíncrono). */
  function token() {
    try {
      if (typeof sesionActual !== "undefined" && sesionActual && sesionActual.access_token) {
        return sesionActual.access_token;
      }
    } catch (e) {
      /* sesionActual no declarada en esta página */
    }
    try {
      var guardada = JSON.parse(localStorage.getItem(LLAVE_SESION) || "null");
      return guardada && guardada.access_token ? guardada.access_token : null;
    } catch (e) {
      return null;
    }
  }

  function pagina() {
    var p = (location.pathname.split("/").pop() || "").trim();
    return p || "index.html";
  }

  var ESTILOS =
    // z-index 55, por DEBAJO del aviso flotante de generación (que usa 60):
    // si empatan, este botón le tapa la ✕ y deja el aviso sin forma de
    // cerrarse. Y cuando ese aviso aparece, el botón se sube (.subido) para
    // que no se estorben — los dos viven abajo a 16px.
    '#fb-lanzador{position:fixed;right:16px;bottom:16px;z-index:55;border:none;border-radius:999px;' +
    'padding:11px 16px;cursor:pointer;font-family:inherit;font-weight:700;font-size:.85rem;' +
    'background:#1E3A8A;color:#fff;box-shadow:0 6px 20px rgba(30,58,138,.28);' +
    'transition:bottom .2s ease}' +
    '#fb-lanzador.subido{bottom:78px}' +
    '#fb-lanzador:hover{background:#16296B}' +
    '#fb-fondo{position:fixed;inset:0;z-index:71;background:rgba(18,35,63,.45);display:flex;' +
    'align-items:flex-end;justify-content:center;padding:16px}' +
    '@media(min-width:560px){#fb-fondo{align-items:center}}' +
    '#fb-caja{background:#fff;border-radius:20px;width:100%;max-width:440px;padding:20px;' +
    'box-shadow:0 20px 60px rgba(18,35,63,.3);font-family:inherit;color:#1E3A8A;max-height:92vh;overflow:auto}' +
    '#fb-caja h3{font-family:inherit;margin:0 0 4px;font-size:1.15rem;color:#1E3A8A}' +
    '#fb-caja p.fb-ayuda{margin:0 0 14px;color:#4A6A85;font-size:.87rem;line-height:1.5}' +
    '.fb-tipos{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}' +
    '.fb-tipo{border:2px solid #DCEEFC;background:#fff;border-radius:14px;padding:12px 8px;cursor:pointer;' +
    'font-family:inherit;font-size:.85rem;font-weight:700;color:#4A6A85;line-height:1.35;text-align:center}' +
    '.fb-tipo span{display:block;font-size:1.4rem;margin-bottom:4px}' +
    '.fb-tipo[aria-pressed="true"]{border-color:#34D399;background:#F0FDF4;color:#065F46}' +
    '#fb-texto{width:100%;box-sizing:border-box;border:2px solid #DCEEFC;border-radius:12px;padding:12px 14px;' +
    'font-family:inherit;font-size:1rem;min-height:110px;resize:vertical;color:#1E3A8A}' +
    '#fb-texto:focus{outline:2px solid #60A5FA;outline-offset:1px}' +
    '.fb-acciones{display:flex;gap:8px;margin-top:14px}' +
    '.fb-acciones button{flex:1;border:none;border-radius:999px;padding:12px;cursor:pointer;' +
    'font-family:inherit;font-weight:700;font-size:.9rem}' +
    '#fb-cancelar{background:#fff;border:2px solid #DCEEFC;color:#4A6A85}' +
    '#fb-enviar{background:#34D399;color:#fff}' +
    '#fb-enviar:disabled{opacity:.6;cursor:default}' +
    '#fb-aviso{margin:12px 0 0;font-size:.85rem;line-height:1.5}' +
    '#fb-aviso.error{color:#B94A2E}' +
    '#fb-aviso.ok{color:#065F46}' +
    '@media print{#fb-lanzador,#fb-fondo{display:none!important}}';

  var estilo = document.createElement("style");
  estilo.textContent = ESTILOS;
  document.head.appendChild(estilo);

  var lanzador = document.createElement("button");
  lanzador.id = "fb-lanzador";
  lanzador.type = "button";
  lanzador.textContent = "💬 Contarle a Claudia";
  lanzador.title = "Mándame un comentario o repórtame una falla";
  document.body.appendChild(lanzador);

  var fondo = null;
  var tipo = null;

  function cerrar() {
    if (fondo) {
      fondo.remove();
      fondo = null;
    }
    tipo = null;
    lanzador.hidden = false;
  }

  function abrir() {
    if (fondo) return;
    lanzador.hidden = true;
    fondo = document.createElement("div");
    fondo.id = "fb-fondo";
    fondo.innerHTML =
      '<div id="fb-caja" role="dialog" aria-modal="true" aria-labelledby="fb-titulo">' +
      '<h3 id="fb-titulo">¿Cómo te fue?</h3>' +
      '<p class="fb-ayuda">Estoy en pleno piloto y me sirve todo: lo que te gustó, lo que no se entendió, lo que de plano falló. Va directo a mi correo.</p>' +
      '<div class="fb-tipos">' +
      '<button type="button" class="fb-tipo" data-tipo="bien" aria-pressed="false"><span>💚</span>Algo me gustó</button>' +
      '<button type="button" class="fb-tipo" data-tipo="bug" aria-pressed="false"><span>🐞</span>Algo falló</button>' +
      "</div>" +
      '<textarea id="fb-texto" placeholder="Cuéntame con tus palabras…"></textarea>' +
      '<p id="fb-aviso"></p>' +
      '<div class="fb-acciones">' +
      '<button type="button" id="fb-cancelar">Ahora no</button>' +
      '<button type="button" id="fb-enviar">Enviar</button>' +
      "</div></div>";
    document.body.appendChild(fondo);

    var caja = fondo.querySelector("#fb-caja");
    var texto = fondo.querySelector("#fb-texto");
    var aviso = fondo.querySelector("#fb-aviso");
    var enviar = fondo.querySelector("#fb-enviar");

    function marcar(msg, clase) {
      aviso.textContent = msg || "";
      aviso.className = clase || "";
    }

    Array.prototype.forEach.call(fondo.querySelectorAll(".fb-tipo"), function (btn) {
      btn.addEventListener("click", function () {
        tipo = btn.getAttribute("data-tipo");
        Array.prototype.forEach.call(fondo.querySelectorAll(".fb-tipo"), function (otro) {
          otro.setAttribute("aria-pressed", String(otro === btn));
        });
        // El texto guía cambia según el tipo: preguntar "¿qué pasó?" saca
        // reportes útiles; un cuadro en blanco saca "no sirve".
        texto.placeholder =
          tipo === "bug"
            ? "¿Qué estabas haciendo y qué pasó? Con que me digas en qué pantalla fue, ya me ayudaste un montón."
            : "¿Qué te gustó o qué te resolvió? Aunque sea una línea.";
        marcar("");
        texto.focus();
      });
    });

    fondo.querySelector("#fb-cancelar").addEventListener("click", cerrar);
    fondo.addEventListener("click", function (ev) {
      if (ev.target === fondo) cerrar();
    });
    caja.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") cerrar();
    });

    enviar.addEventListener("click", async function () {
      if (!tipo) return marcar("Primero dime si es algo que te gustó o algo que falló.", "error");
      var mensaje = texto.value.trim();
      if (!mensaje) {
        marcar("Escríbeme aunque sea una línea 🙏", "error");
        return texto.focus();
      }
      var t = token();
      if (!t) return marcar("Parece que tu sesión se cerró. Vuelve a entrar y me lo mandas.", "error");

      enviar.disabled = true;
      enviar.textContent = "Enviando…";
      marcar("");
      try {
        var res = await fetch(API + "/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + t },
          body: JSON.stringify({
            tipo: tipo,
            mensaje: mensaje,
            pagina: pagina(),
            contexto: {
              url: location.href,
              navegador: navigator.userAgent,
              pantalla: window.innerWidth + "x" + window.innerHeight,
              idioma: navigator.language,
            },
          }),
        });
        var data = await res.json().catch(function () {
          return {};
        });
        if (!res.ok) throw new Error(data.error || "No se pudo enviar tu comentario.");

        caja.innerHTML =
          '<h3>¡Gracias de verdad! 💚</h3>' +
          '<p class="fb-ayuda">Ya me llegó. Si necesito preguntarte algo te escribo por correo.</p>' +
          '<div class="fb-acciones"><button type="button" id="fb-listo">Cerrar</button></div>';
        caja.querySelector("#fb-listo").style.background = "#34D399";
        caja.querySelector("#fb-listo").style.color = "#fff";
        caja.querySelector("#fb-listo").addEventListener("click", cerrar);
        setTimeout(cerrar, 3500);
      } catch (err) {
        marcar(err.message, "error");
        enviar.disabled = false;
        enviar.textContent = "Enviar";
      }
    });

    texto.focus();
  }

  lanzador.addEventListener("click", abrir);

  // El aviso flotante de "se está generando" (tema.html y grupo.html) vive
  // también abajo, así que se vigila su entrada y salida para subir o bajar
  // este botón. Sin esto, el botón queda encima de la ✕ del aviso.
  function acomodar() {
    lanzador.classList.toggle("subido", !!document.getElementById("aviso-generacion"));
  }
  acomodar();
  if (window.MutationObserver) {
    new MutationObserver(acomodar).observe(document.body, { childList: true });
  }
})();
