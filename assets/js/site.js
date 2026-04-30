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
  var diamondAura = document.getElementById('diamond-aura');
  var diamondShape = document.getElementById('diamond-shape');
  var diamondTable = document.getElementById('diamond-table');
  var diamondFacetLeft = document.getElementById('diamond-facet-left');
  var diamondFacetRight = document.getElementById('diamond-facet-right');
  var diamondFacetBottom = document.getElementById('diamond-facet-bottom');
  var diamondFacetLines = document.getElementById('diamond-facet-lines');
  var diamondGlow = document.getElementById('diamond-glow');
  var diamondSparkleTop = document.getElementById('diamond-sparkle-top');
  var diamondSparkleLeft = document.getElementById('diamond-sparkle-left');
  var diamondSparkleRight = document.getElementById('diamond-sparkle-right');
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

  function pointString(point) {
    return point.x.toFixed(1) + ',' + point.y.toFixed(1);
  }

  function pathPoint(point) {
    return point.x.toFixed(1) + ' ' + point.y.toFixed(1);
  }

  function pointsString(points) {
    return points.map(pointString).join(' ');
  }

  function buildDiamondGeometry(size) {
    var cx = 220;
    var cy = 94 - (size - 28) * 0.16;

    return {
      cx: cx,
      cy: cy,
      top: { x: cx, y: cy - size * 1.12 },
      upperRight: { x: cx + size * 0.86, y: cy - size * 0.34 },
      right: { x: cx + size * 0.62, y: cy + size * 0.36 },
      lowerRight: { x: cx + size * 0.28, y: cy + size * 1.06 },
      bottom: { x: cx, y: cy + size * 1.58 },
      lowerLeft: { x: cx - size * 0.28, y: cy + size * 1.06 },
      left: { x: cx - size * 0.62, y: cy + size * 0.36 },
      upperLeft: { x: cx - size * 0.86, y: cy - size * 0.34 },
      tableTop: { x: cx, y: cy - size * 0.58 },
      tableRight: { x: cx + size * 0.44, y: cy - size * 0.04 },
      tableBottom: { x: cx, y: cy + size * 0.28 },
      tableLeft: { x: cx - size * 0.44, y: cy - size * 0.04 },
      innerRight: { x: cx + size * 0.52, y: cy + size * 0.58 },
      innerLeft: { x: cx - size * 0.52, y: cy + size * 0.58 }
    };
  }

  function diamondFacetPath(geometry) {
    return [
      'M ' + pathPoint(geometry.top) + ' L ' + pathPoint(geometry.tableTop),
      'M ' + pathPoint(geometry.upperLeft) + ' L ' + pathPoint(geometry.tableLeft),
      'M ' + pathPoint(geometry.upperRight) + ' L ' + pathPoint(geometry.tableRight),
      'M ' + pathPoint(geometry.tableLeft) + ' L ' + pathPoint(geometry.tableTop) + ' L ' + pathPoint(geometry.tableRight),
      'M ' + pathPoint(geometry.tableTop) + ' L ' + pathPoint(geometry.tableBottom),
      'M ' + pathPoint(geometry.left) + ' L ' + pathPoint(geometry.innerLeft),
      'M ' + pathPoint(geometry.right) + ' L ' + pathPoint(geometry.innerRight),
      'M ' + pathPoint(geometry.tableBottom) + ' L ' + pathPoint(geometry.innerLeft) + ' L ' + pathPoint(geometry.bottom) + ' L ' + pathPoint(geometry.innerRight) + ' Z'
    ].join(' ');
  }

  function sparklePath(cx, cy, size) {
    return [
      'M ' + cx.toFixed(1) + ' ' + (cy - size).toFixed(1),
      'L ' + (cx + size * 0.22).toFixed(1) + ' ' + (cy - size * 0.22).toFixed(1),
      'L ' + (cx + size).toFixed(1) + ' ' + cy.toFixed(1),
      'L ' + (cx + size * 0.22).toFixed(1) + ' ' + (cy + size * 0.22).toFixed(1),
      'L ' + cx.toFixed(1) + ' ' + (cy + size).toFixed(1),
      'L ' + (cx - size * 0.22).toFixed(1) + ' ' + (cy + size * 0.22).toFixed(1),
      'L ' + (cx - size).toFixed(1) + ' ' + cy.toFixed(1),
      'L ' + (cx - size * 0.22).toFixed(1) + ' ' + (cy - size * 0.22).toFixed(1),
      'Z'
    ].join(' ');
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
    var geometry = buildDiamondGeometry(size);
    var sparkleScale = 0.9 + ((state.carat - 0.5) / 2.5) * 0.35;

    metalStop1.setAttribute('stop-color', metal.gradient[0]);
    metalStop2.setAttribute('stop-color', metal.gradient[1]);
    metalStop3.setAttribute('stop-color', metal.gradient[2]);
    diamondShape.setAttribute('points', pointsString([
      geometry.top,
      geometry.upperRight,
      geometry.right,
      geometry.lowerRight,
      geometry.bottom,
      geometry.lowerLeft,
      geometry.left,
      geometry.upperLeft
    ]));
    diamondTable.setAttribute('points', pointsString([
      geometry.tableTop,
      geometry.tableRight,
      geometry.tableBottom,
      geometry.tableLeft
    ]));
    diamondFacetLeft.setAttribute('points', pointsString([
      geometry.upperLeft,
      geometry.tableLeft,
      geometry.tableBottom,
      geometry.innerLeft,
      geometry.left
    ]));
    diamondFacetRight.setAttribute('points', pointsString([
      geometry.tableRight,
      geometry.upperRight,
      geometry.right,
      geometry.innerRight,
      geometry.tableBottom
    ]));
    diamondFacetBottom.setAttribute('points', pointsString([
      geometry.tableBottom,
      geometry.innerRight,
      geometry.bottom,
      geometry.innerLeft
    ]));
    diamondFacetLines.setAttribute('d', diamondFacetPath(geometry));
    diamondAura.setAttribute('r', (size * 1.55).toFixed(1));
    diamondAura.setAttribute('cy', geometry.cy.toFixed(1));
    diamondAura.setAttribute('opacity', (0.34 + sparkleScale * 0.14).toFixed(2));
    diamondGlow.setAttribute('r', (size * 1.28).toFixed(1));
    diamondGlow.setAttribute('cy', geometry.cy.toFixed(1));
    diamondGlow.setAttribute('opacity', (0.54 + sparkleScale * 0.18).toFixed(2));
    diamondSparkleTop.setAttribute('d', sparklePath(geometry.cx + size * 0.96, geometry.cy - size * 0.82, size * (0.2 * sparkleScale)));
    diamondSparkleLeft.setAttribute('d', sparklePath(geometry.cx - size * 1.02, geometry.cy - size * 0.02, size * (0.14 * sparkleScale)));
    diamondSparkleRight.setAttribute('d', sparklePath(geometry.cx + size * 1.08, geometry.cy + size * 0.42, size * (0.16 * sparkleScale)));

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
