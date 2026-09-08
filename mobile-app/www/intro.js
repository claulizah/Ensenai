/**
 * intro.js — "Qué puedes hacer aquí"
 *
 * Pedido de la usuaria (2-sep-2026): "que tenga un intro que permita
 * entender bien todo lo que puede hacer — intro para sección de alumnos y
 * papás y otro para maestros". Alguien que entra por primera vez ve un
 * formulario y no se entera de que existen la trivia, el simulacro de
 * examen, el PDF imprimible o el progreso.
 *
 * Cómo se usa (igual de simple que feedback.js — una línea por página):
 *   <script src="intro.js"></script>   ← antes del <script> de la página
 *   ...y dentro de la plantilla:  ${window.introHTML("individual")}
 *
 * Dos detalles pensados para cómo están hechas estas páginas:
 * - Devuelve un STRING, no monta nada por su cuenta: tema.html y grupo.html
 *   re-escriben #contenido completo muy seguido (cargarGrupos, volver al
 *   formulario...), así que cualquier nodo montado aparte se perdería.
 * - El clic se escucha con delegación en document, UNA sola vez: sobrevive
 *   a que la tarjeta se vuelva a pintar sin acumular listeners.
 *
 * El estado (abierta/cerrada) vive en localStorage por variante, así que la
 * primera vez se ve completa y después queda como una línea que se puede
 * volver a abrir cuando quieras. Todo va en try/catch: en navegación
 * privada localStorage truena y eso no debe tumbar la página.
 */
(function () {
  "use strict";

  var CONTENIDO = {
    individual: {
      clave: "ensenai_intro_individual_v1",
      titulo: "👋 Qué puedes hacer aquí",
      resumen: "Cómo funciona EnseñAI en 4 pasos",
      pasos: [
        {
          icono: "🧠",
          titulo: "Dinos cómo aprende",
          texto:
            "Son 12 preguntas, menos de dos minutos. Con eso sabemos si le funciona mejor ver, escuchar, moverse o razonar. Puedes tener un perfil por cada hijo/a.",
        },
        {
          icono: "✨",
          titulo: "Escribe cualquier tema",
          texto:
            "El de la tarea o el que quieras aprender tú. Si le tomas foto a los apuntes o al libro, el material sale parecido a lo que están viendo en clase.",
        },
        {
          icono: "📘",
          titulo: "Recibes tres cosas, no solo un resumen",
          texto:
            "La explicación contada a su manera, ejercicios con pista y solución paso a paso, y una trivia que se califica sola.",
        },
        {
          icono: "📊",
          titulo: "Se te queda guardado",
          texto:
            "Tus temas, tu progreso (qué ya domina y qué conviene repasar) y tu racha de días, en la franja de hasta arriba.",
        },
      ],
      extras: [
        "🎯 Junta varios temas y te arma un simulacro de examen",
        "🖨️ Todo se puede imprimir: material, tarjetas y PDF",
        "🔍 Súbele foto a un ejercicio ya resuelto y te decimos en qué paso está el error",
      ],
    },

    maestro: {
      clave: "ensenai_intro_maestro_v1",
      titulo: "👋 Qué puedes hacer aquí",
      resumen: "Cómo funciona EnseñAI con tu grupo en 4 pasos",
      pasos: [
        {
          icono: "🏫",
          titulo: "Crea tu grupo",
          texto: "Uno por salón, por materia o por paciente — como te acomode. Cada grupo tiene su propia liga.",
        },
        {
          icono: "✨",
          titulo: "Agrega un tema",
          texto:
            "Sale una actividad pensada para que la haga todo el grupo (hablando, escribiendo, dibujando o moviéndose). Si quieres más, “Adaptar por inteligencia” genera las 8 versiones.",
        },
        {
          icono: "🔗",
          titulo: "Comparte la liga",
          texto: "Tus alumnos o pacientes entran sin cuenta y sin pagar nada — solo escriben su nombre y ya.",
        },
        {
          icono: "👀",
          titulo: "Revisa cómo van",
          texto:
            "Ves cuántos entraron, cómo contestaron la trivia y qué ejercicios marcaron como resueltos, tema por tema.",
        },
      ],
      extras: [
        "🖨️ PDF listo para imprimir y repartir, con o sin hoja de respuestas",
        "🎯 Modo examen: junta temas y arma un simulacro",
        "🧠 Enfoque psicoeducativo si trabajas en consulta, no en salón",
      ],
    },
  };

  /**
   * ¿Se pinta abierta o plegada? (4-sep-2026)
   *
   * La primera visita se ve completa —es la que enseña el producto—, pero
   * de la segunda en adelante arranca plegada: ayuda una vez y estorba
   * siempre después, y en celular se comía la pantalla entera.
   *
   * Tres estados en localStorage bajo la misma clave:
   *   (vacío)   nunca la ha visto  -> abierta
   *   "vista"   ya la vio una vez  -> plegada
   *   "abierta" / "cerrada"        -> lo que la persona eligió, manda
   *
   * El detalle fino: esta función se llama MUCHAS veces por sesión (las
   * páginas repintan #contenido a cada rato). Si marcara "vista" en la
   * primera llamada, la tarjeta se cerraría sola a media primera visita.
   * Por eso la decisión de la sesión se guarda en sessionStorage y se
   * respeta hasta que la persona cierre la pestaña.
   */
  function leerAbierta(clave) {
    try {
      var guardado = localStorage.getItem(clave);
      if (guardado === "cerrada") return false;
      if (guardado === "abierta") return true;

      // Sin elección explícita: se decide una sola vez por sesión.
      var claveSesion = clave + "_sesion";
      var deLaSesion = sessionStorage.getItem(claveSesion);
      if (deLaSesion !== null) return deLaSesion === "1";

      var primeraVez = guardado !== "vista";
      sessionStorage.setItem(claveSesion, primeraVez ? "1" : "0");
      if (primeraVez) localStorage.setItem(clave, "vista");
      return primeraVez;
    } catch (e) {
      // Navegación privada o almacenamiento bloqueado: se ve completa,
      // que es el peor caso aceptable (informa de más, no de menos).
      return true;
    }
  }

  function guardarAbierta(clave, abierta) {
    try {
      localStorage.setItem(clave, abierta ? "abierta" : "cerrada");
    } catch (e) {
      /* navegación privada: se queda abierta esta sesión, no pasa nada */
    }
  }

  function escapar(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Los estilos se cuelgan de <head>, NO se devuelven dentro del string:
   * la tarjeta vive dentro de #contenido y esa zona se reescribe entera muy
   * seguido — un <style> ahí adentro se borraría en el siguiente re-pintado
   * (y como introHTML() se arma ANTES de asignar el innerHTML, la comprobación
   * de "ya existe" habría dicho que sí justo antes de que desapareciera).
   */
  function montarEstilos() {
    if (document.getElementById("estilos-intro-ensenai")) return;
    var etiqueta = document.createElement("style");
    etiqueta.id = "estilos-intro-ensenai";
    etiqueta.textContent =
      ".intro-ensenai{background:#fff;border:2px solid #DDE7F5;border-radius:18px;padding:18px 20px;margin-bottom:18px;box-shadow:0 3px 0 #DDE7F5;}" +
      ".intro-cabecera{display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;}" +
      ".intro-cabecera h2{font-family:'Grandstander',sans-serif;font-size:1.1rem;margin:0;color:#123A5E;}" +
      ".intro-cabecera .intro-flecha{font-size:0.85rem;color:#5B7899;white-space:nowrap;background:none;border:0;cursor:pointer;font-family:inherit;padding:4px;}" +
      ".intro-resumen{margin:4px 0 0;font-size:0.85rem;color:#5B7899;}" +
      ".intro-pasos{list-style:none;margin:16px 0 0;padding:0;}" +
      ".intro-paso{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;}" +
      ".intro-paso:last-child{margin-bottom:0;}" +
      ".intro-paso .ico{font-size:1.3rem;line-height:1.2;flex:0 0 auto;width:28px;text-align:center;}" +
      ".intro-paso .cuerpo{flex:1 1 auto;min-width:0;}" +
      ".intro-paso .titulo{font-weight:700;color:#123A5E;font-size:0.95rem;margin-bottom:2px;}" +
      ".intro-paso .texto{font-size:0.88rem;line-height:1.5;color:#3E5C7A;}" +
      ".intro-extras{margin-top:16px;padding-top:14px;border-top:1px dashed #DDE7F5;}" +
      ".intro-extras p{margin:0 0 8px;font-weight:700;font-size:0.85rem;color:#123A5E;}" +
      ".intro-extras ul{margin:0;padding:0;list-style:none;}" +
      ".intro-extras li{font-size:0.85rem;line-height:1.5;color:#3E5C7A;margin-bottom:5px;}" +
      ".intro-cerrar{margin-top:16px;width:100%;background:#EAF1FE;border:2px solid #DDE7F5;color:#123A5E;font-family:inherit;font-weight:700;border-radius:12px;padding:10px;cursor:pointer;}";
    (document.head || document.documentElement).appendChild(etiqueta);
  }

  window.introHTML = function (variante) {
    montarEstilos();
    var c = CONTENIDO[variante] || CONTENIDO.individual;
    var abierta = leerAbierta(c.clave);

    var cuerpo = abierta
      ? '<ul class="intro-pasos">' +
        c.pasos
          .map(function (p) {
            return (
              '<li class="intro-paso"><span class="ico">' +
              escapar(p.icono) +
              '</span><div class="cuerpo"><div class="titulo">' +
              escapar(p.titulo) +
              '</div><div class="texto">' +
              escapar(p.texto) +
              "</div></div></li>"
            );
          })
          .join("") +
        "</ul>" +
        '<div class="intro-extras"><p>Y además:</p><ul>' +
        c.extras
          .map(function (e) {
            return "<li>" + escapar(e) + "</li>";
          })
          .join("") +
        "</ul></div>" +
        '<button type="button" class="intro-cerrar" data-intro-accion="cerrar" data-intro-variante="' +
        escapar(variante) +
        '">Ya entendí, ocúltalo</button>'
      : "";

    return (
      '<div class="intro-ensenai" data-intro="' +
      escapar(variante) +
      '">' +
      '<div class="intro-cabecera" data-intro-accion="alternar" data-intro-variante="' +
      escapar(variante) +
      '">' +
      "<div><h2>" +
      escapar(c.titulo) +
      "</h2>" +
      (abierta ? "" : '<p class="intro-resumen">' + escapar(c.resumen) + "</p>") +
      "</div>" +
      '<button type="button" class="intro-flecha" data-intro-accion="alternar" data-intro-variante="' +
      escapar(variante) +
      '">' +
      (abierta ? "Ocultar ▲" : "Ver cómo ▼") +
      "</button>" +
      "</div>" +
      cuerpo +
      "</div>"
    );
  };

  // Un solo listener para toda la página: la tarjeta se vuelve a pintar
  // muchas veces y así nunca se acumulan ni se quedan huérfanos.
  document.addEventListener("click", function (ev) {
    var disparador = ev.target.closest("[data-intro-accion]");
    if (!disparador) return;
    var variante = disparador.getAttribute("data-intro-variante");
    var c = CONTENIDO[variante];
    if (!c) return;

    var accion = disparador.getAttribute("data-intro-accion");
    var abierta = accion === "cerrar" ? false : !leerAbierta(c.clave);
    guardarAbierta(c.clave, abierta);

    var tarjeta = document.querySelector('[data-intro="' + variante + '"]');
    if (!tarjeta) return;
    // Se reemplaza solo la tarjeta, sin tocar el resto de la pantalla.
    var envoltura = document.createElement("div");
    envoltura.innerHTML = window.introHTML(variante);
    var nueva = envoltura.querySelector(".intro-ensenai");
    if (nueva) tarjeta.replaceWith(nueva);
  });
})();
