(function () {
  'use strict';

  var slider = document.getElementById('hero-carat-slider');
  var metalButtons = Array.prototype.slice.call(document.querySelectorAll('.metal-pill'));

  if (!slider || !metalButtons.length) return;

  var state = { metal: 'yellow', carat: 1.0 };

  var METALS = {
    yellow: {
      label: 'Oro Amarillo',
      basePrice: 3800,
      gradient: ['#f4e29a', '#d6b25e', '#886820']
    },
    white: {
      label: 'Oro Blanco',
      basePrice: 4200,
      gradient: ['#f7f8fa', '#d8dbe1', '#8e949d']
    },
    rose: {
      label: 'Oro Rosa',
      basePrice: 4000,
      gradient: ['#f2d3c5', '#d2a089', '#875c4c']
    },
    platinum: {
      label: 'Platino',
      basePrice: 5500,
      gradient: ['#f3f5f7', '#c7ced6', '#7e858d']
    }
  };

  var metalStop1 = document.getElementById('metal-stop-1');
  var metalStop2 = document.getElementById('metal-stop-2');
  var metalStop3 = document.getElementById('metal-stop-3');
  var diamondShape = document.getElementById('diamond-shape');
  var diamondFacets = document.getElementById('diamond-facets');
  var diamondGlow = document.getElementById('diamond-glow');
  var metalLabel = document.getElementById('selected-metal-label');
  var caratLabel = document.getElementById('selected-carat-label');
  var previewMetalLabel = document.getElementById('preview-metal-label');
  var previewCaratLabel = document.getElementById('preview-carat-label');
  var summaryConfig = document.getElementById('summary-config');
  var summaryPrice = document.getElementById('summary-price');
  var heroQuoteLink = document.getElementById('hero-quote-link');

  function formatPrice(value) {
    return '$' + value.toLocaleString('en-US');
  }

  function diamondPoints(size) {
    var cx = 220;
    var cy = 96 - (size - 28) * 0.15;
    return [
      cx + ',' + (cy - size),
      (cx + size * 0.72) + ',' + (cy - size * 0.18),
      (cx + size * 0.44) + ',' + (cy + size * 0.92),
      cx + ',' + (cy + size * 1.45),
      (cx - size * 0.44) + ',' + (cy + size * 0.92),
      (cx - size * 0.72) + ',' + (cy - size * 0.18)
    ].map(function (point) {
      var parts = point.split(',');
      return Number(parts[0]).toFixed(1) + ',' + Number(parts[1]).toFixed(1);
    }).join(' ');
  }

  function facetPolyline(size) {
    var cx = 220;
    var cy = 96 - (size - 28) * 0.15;
    return [
      cx + ',' + (cy - size),
      cx + ',' + (cy + size * 1.45),
      (cx + size * 0.72) + ',' + (cy - size * 0.18),
      (cx - size * 0.72) + ',' + (cy - size * 0.18),
      (cx + size * 0.44) + ',' + (cy + size * 0.92),
      (cx - size * 0.44) + ',' + (cy + size * 0.92),
      cx + ',' + (cy - size)
    ].map(function (point) {
      var parts = point.split(',');
      return Number(parts[0]).toFixed(1) + ',' + Number(parts[1]).toFixed(1);
    }).join(' ');
  }

  function buildMailto(total) {
    var metal = METALS[state.metal];
    var subject = 'Solicitud de anillo personalizado - ' + metal.label + ' - ' + state.carat.toFixed(1) + ' ct';
    var body = [
      'Hola, me interesa esta configuracion:',
      '',
      'Metal: ' + metal.label,
      'Quilataje: ' + state.carat.toFixed(1) + ' ct',
      'Precio demo: ' + formatPrice(total),
      '',
      'Quiero continuar con la siguiente etapa.'
    ].join('\n');

    heroQuoteLink.href = 'mailto:ventas@example.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function paintRange() {
    var pct = ((slider.value - 5) / 25 * 100).toFixed(1);
    slider.style.background = 'linear-gradient(to right, #bf9b53 ' + pct + '%, rgba(24, 21, 18, 0.12) ' + pct + '%)';
  }

  function render() {
    var metal = METALS[state.metal];
    var total = metal.basePrice + Math.round(state.carat * 800);
    var size = 24 + ((state.carat - 0.5) / 2.5) * 20;
    var cy = 96 - (size - 28) * 0.15;

    metalStop1.setAttribute('stop-color', metal.gradient[0]);
    metalStop2.setAttribute('stop-color', metal.gradient[1]);
    metalStop3.setAttribute('stop-color', metal.gradient[2]);
    diamondShape.setAttribute('points', diamondPoints(size));
    diamondFacets.setAttribute('points', facetPolyline(size));
    diamondGlow.setAttribute('r', (size * 1.2).toFixed(1));
    diamondGlow.setAttribute('cy', cy.toFixed(1));

    metalLabel.textContent = metal.label;
    caratLabel.textContent = state.carat.toFixed(1) + ' ct';
    previewMetalLabel.textContent = metal.label;
    previewCaratLabel.textContent = state.carat.toFixed(1) + ' ct';
    summaryConfig.textContent = metal.label + ' · ' + state.carat.toFixed(1) + ' ct';
    summaryPrice.textContent = formatPrice(total);

    metalButtons.forEach(function (button) {
      var active = button.getAttribute('data-metal') === state.metal;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    paintRange();
    buildMailto(total);
  }

  metalButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      state.metal = button.getAttribute('data-metal');
      render();
    });
  });

  slider.addEventListener('input', function () {
    state.carat = Number(slider.value) / 10;
    render();
  });

  render();
}());
