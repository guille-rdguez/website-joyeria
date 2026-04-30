(function () {
  'use strict';

  var QUOTE_EMAIL = 'ventas@example.com';
  var METAL_LABELS = {
    yellow: 'Oro Amarillo',
    white: 'Oro Blanco',
    rose: 'Oro Rosa',
    platinum: 'Platino'
  };

  var METAL = {
    yellow:   { color: 0xd6b25e, roughness: 0.24, envMapIntensity: 1.35, clearcoat: 0.06, clearcoatRoughness: 0.18 },
    white:    { color: 0xd8dbe1, roughness: 0.20, envMapIntensity: 1.5, clearcoat: 0.05, clearcoatRoughness: 0.14 },
    rose:     { color: 0xd2a089, roughness: 0.26, envMapIntensity: 1.25, clearcoat: 0.06, clearcoatRoughness: 0.18 },
    platinum: { color: 0xc7ced6, roughness: 0.18, envMapIntensity: 1.6, clearcoat: 0.05, clearcoatRoughness: 0.12 }
  };

  var BASE_PRICE = { yellow: 3800, white: 4200, rose: 4000, platinum: 5500 };

  var MODEL_LIBRARY = {
    bandas: [
      {
        id: 'banda-base-01',
        label: 'Solitario Clasico',
        caption: 'Base',
        price: 0,
        file: './assets/models/bandas/banda-base-01.glb',
        transform: { scale: 0.1, rotation: [0, 0, 0], position: [0, 0, 0] }
      },
      {
        id: 'banda-base-02',
        label: 'Perfil Contour',
        caption: 'Variante',
        price: 250,
        file: './assets/models/bandas/banda-base-02.glb',
        transform: { scale: 0.1, rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }
      }
    ],
    engastes: [
      {
        id: 'engaste-garras-clasico',
        label: 'Garras Clasicas',
        caption: 'Clasico',
        price: 0,
        file: './assets/models/engastes/engaste-garras-clasico.glb',
        transform: { scale: 0.1, rotation: [0, 0, 0], position: [0, 0, 0], anchorBottom: 6.214 }
      },
      {
        id: 'engaste-leaf',
        label: 'Leaf Organico',
        caption: 'Nuevo',
        price: 420,
        file: './assets/models/engastes/engaste-leaf.glb',
        transform: { scale: 0.1, rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], anchorBottom: 6.214, stoneOffset: [0, -0.20, 0], stoneScale: 1.28 }
      }
    ],
    piedras: [
      {
        id: 'piedra-diamante-base',
        label: 'Diamante Base',
        caption: 'Clasico',
        price: 0,
        file: './assets/models/piedras/piedra-diamante-base.glb',
        transform: {
          scale: 0.1,
          rotation: [0, 0, 0],
          position: [0, 0, 0],
          anchorBottom: 10.70
        }
      },
      {
        id: 'piedra-variante-01',
        label: 'Piedra Signature',
        caption: 'Variante',
        price: 680,
        file: './assets/models/piedras/piedra-variante-01.glb',
        transform: {
          scale: 0.087,
          rotation: [0, 0, 0],
          position: [0, -0.015, 0],
          anchorBottom: 10.70
        }
      }
    ]
  };

  var CATEGORY_STATE_KEY = {
    bandas: 'banda',
    engastes: 'engaste',
    piedras: 'piedra'
  };

  var state = {
    metal: 'yellow',
    carat: 1.0,
    banda: MODEL_LIBRARY.bandas[0].id,
    engaste: MODEL_LIBRARY.engastes[0].id,
    piedra: MODEL_LIBRARY.piedras[0].id
  };

  var canvas = document.getElementById('three-canvas');
  var loading = document.getElementById('loading');
  var loadingCopy = document.getElementById('loading-copy');
  var caratSlider = document.getElementById('carat-slider');
  var caratDisplay = document.getElementById('carat-display');
  var priceDisplay = document.getElementById('price-display');
  var quoteButton = document.getElementById('quote-btn');
  var resetViewButton = document.getElementById('reset-view-btn');
  var currentBandLabel = document.getElementById('current-band-label');
  var currentSettingLabel = document.getElementById('current-setting-label');
  var currentStoneLabel = document.getElementById('current-stone-label');
  var summaryBand = document.getElementById('summary-band');
  var summarySetting = document.getElementById('summary-setting');
  var summaryStone = document.getElementById('summary-stone');
  var optionContainers = {
    bandas: document.getElementById('band-options'),
    engastes: document.getElementById('setting-options'),
    piedras: document.getElementById('stone-options')
  };

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb0b0b0);

  var camera = new THREE.PerspectiveCamera(32, 1, 0.01, 500);
  var controls = new THREE.OrbitControls(camera, canvas);
  var ringGroup = new THREE.Group();
  scene.add(ringGroup);

  var shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.55 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, -1.28, 0);
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // PMREM env map for metal materials only — neutral warm tones so gold looks gold.
  // Vivid studio colors live exclusively in diamondEnvRaw (used by the diamond shader).
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envScene = new THREE.Scene();
  [
    [[70,  10,  20],  0xd8cec1],  // warm white — key side
    [[-70, 14, -18],  0xc3ced8],  // cool white — fill side
    [[0,   80,  18],  0xf7f5f1],  // overhead: bright neutral
    [[0,  -70,   0],  0x262220],  // floor: dark charcoal
    [[0,    8,  70],  0xbcae9d],  // front: warm neutral
    [[0,    0, -70],  0x6f6459],  // back: mid warm brown
  ].forEach(function (face) {
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshBasicMaterial({ color: face[1], side: THREE.DoubleSide })
    );
    mesh.position.set(face[0][0], face[0][1], face[0][2]);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
  });
  scene.environment = pmrem.fromScene(envScene, 0).texture;

  // Diamond env map — spots sized to cover large facets (signature stone) without
  // blending into a white mass. Dark blue base prevents absolute-black reflections.
  var diamondEnvRaw = (function () {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    var ctx = c.getContext('2d');
    // Dark blue-violet base — no pure black so large facets always have some color
    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, 512, 512);
    [
      // White hot spots — vivid cores, steep falloff to keep separation
      { x: 90,  y: 90,  r: 80,  col: '255,255,255' },
      { x: 422, y: 90,  r: 70,  col: '255,255,255' },
      { x: 256, y: 34,  r: 62,  col: '255,255,255' },
      { x: 90,  y: 422, r: 58,  col: '255,255,255' },
      { x: 422, y: 422, r: 54,  col: '255,255,255' },
      // Cyan
      { x: 298, y: 98,  r: 88,  col: '0,225,255'   },
      { x: 118, y: 358, r: 76,  col: '0,195,240'   },
      { x: 430, y: 260, r: 68,  col: '30,210,255'  },
      // Orange / gold
      { x: 338, y: 458, r: 84,  col: '255,155,0'   },
      { x: 168, y: 238, r: 72,  col: '255,115,10'  },
      { x: 460, y: 390, r: 62,  col: '255,140,0'   },
      // Magenta / pink
      { x: 85,  y: 278, r: 80,  col: '255,65,160'  },
      { x: 375, y: 428, r: 68,  col: '215,45,195'  },
      // Sky blue
      { x: 178, y: 148, r: 76,  col: '95,180,255'  },
      { x: 448, y: 148, r: 64,  col: '85,160,245'  },
      // Violet / indigo
      { x: 338, y: 318, r: 72,  col: '75,55,240'   },
      { x: 200, y: 480, r: 60,  col: '110,40,220'  },
      // Green
      { x: 198, y: 398, r: 66,  col: '30,210,75'   },
      // Red
      { x: 460, y: 370, r: 60,  col: '255,30,50'   },
    ].forEach(function (l) {
      var g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0,    'rgba(' + l.col + ',1)');
      g.addColorStop(0.18, 'rgba(' + l.col + ',0.85)');
      g.addColorStop(0.45, 'rgba(' + l.col + ',0.35)');
      g.addColorStop(0.72, 'rgba(' + l.col + ',0.08)');
      g.addColorStop(1,    'rgba(' + l.col + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    });
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }());

  // RenderTarget captures the scene (without diamond) for screen-space refraction
  var sceneRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat
  });

  // Active diamond ShaderMaterial instances — updated each frame with uSceneTexture
  var diamondShaderMaterials = [];

  // Luces de escena — todas neutras/blancas para no teñir el metal.
  // Los colores de estudio (cyan, naranja, magenta) viven solo en el env map
  // y en diamondEnvRaw: afectan reflexiones/refracciones sin pintar el metal.

  // AMBIENT — base mínima
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  // KEY — luz principal, blanco puro, define forma y brillos nítidos
  var key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(6, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 80;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.bias = -0.0005;
  scene.add(key);

  // FILL — blanco-frío muy suave, rellena sombras sin teñir
  var fill = new THREE.DirectionalLight(0xeef4ff, 0.38);
  fill.position.set(-5, 3, 3);
  scene.add(fill);

  // RIM — blanco-cálido muy suave, separa el anillo del fondo oscuro
  var rim = new THREE.DirectionalLight(0xfff6ee, 0.3);
  rim.position.set(-8, 1, -8);
  scene.add(rim);

  var loader = new THREE.GLTFLoader();
  var modelCache = {};
  var currentMeshes = { banda: null, engaste: null, piedra: null };
  var loadToken = 0;
  var ringBasePosition = new THREE.Vector3(0, -0.18, 0);
  var autoRotateTimer = null;
  var tick = 0;

  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 0.85;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = 2.45;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.95;
  camera.position.set(1.2, 2.05, 4.7);
  controls.target.set(0, 0.2, 0);
  controls.update();

  function optionFor(category, id) {
    return MODEL_LIBRARY[category].find(function (item) {
      return item.id === id;
    });
  }

  function selectedOption(category) {
    return optionFor(category, state[CATEGORY_STATE_KEY[category]]);
  }

  function setLoading(active, copy) {
    if (copy) loadingCopy.textContent = copy;
    loading.style.display = active ? 'flex' : 'none';
  }

  function makeMetalMat(config) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.color),
      metalness: 1,
      roughness: config.roughness,
      envMapIntensity: config.envMapIntensity,
      clearcoat: config.clearcoat,
      clearcoatRoughness: config.clearcoatRoughness,
      reflectivity: 1
    });
  }

  var DIAMOND_VERT = `
varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldViewDir;
varying vec4 vClipPos;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  // World-space normal (valid for uniformly scaled objects)
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 viewPos = viewMatrix * worldPos;
  vViewPos     = viewPos.xyz;
  // View-space normal uses Three.js normalMatrix (transpose-inverse of modelViewMatrix)
  vViewNormal  = normalize(normalMatrix * normal);
  // World-space direction from vertex toward camera
  vWorldViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position  = projectionMatrix * viewPos;
  vClipPos     = gl_Position;
}
`;

  var DIAMOND_FRAG = `
#define PI 3.14159265359

uniform sampler2D uSceneTexture;    // Scene without diamond (background for refraction)
uniform sampler2D uEnvMap;          // High-contrast equirectangular env map
uniform float     uIOR;             // Index of refraction (2.417 = diamond, 1.5 = glass)
uniform float     uThickness;       // Screen-space refraction strength
uniform float     uChromaticAberration; // Blue refracts more than red (dispersion / fire)
uniform float     uEnvMapIntensity; // Reflection brightness multiplier
uniform float     uFresnelPower;    // Schlick exponent (5 = physically accurate)

varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldViewDir;
varying vec4 vClipPos;

// Sample equirectangular 2D texture from a 3D direction vector
vec3 sampleEquirect(sampler2D map, vec3 dir) {
  float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
  return texture2D(map, vec2(u, v)).rgb;
}

// Schlick approximation: F0 derived from IOR, rises to 1 at grazing angle
float schlickFresnel(float cosTheta, float ior) {
  float F0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), uFresnelPower);
}

void main() {
  vec3 N_w = normalize(vWorldNormal);
  vec3 N_v = normalize(vViewNormal);
  // Back faces: flip normals so exit refraction behaves correctly (TIR on pavilion)
  if (!gl_FrontFacing) { N_w = -N_w; N_v = -N_v; }

  vec3 V_w = normalize(vWorldViewDir);
  // View-space view direction: camera is at origin, fragment is at vViewPos
  vec3 V_v = normalize(-vViewPos);

  // --- Screen UV: convert clip-space position to 0..1 range ---
  vec2 screenUV = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;

  // --- Screen-space refraction ---
  // eta = n_incoming / n_outgoing
  float eta = gl_FrontFacing ? (1.0 / uIOR) : uIOR;
  vec3 rDir = refract(-V_v, N_v, eta);
  // refract() returns vec3(0) on total internal reflection — zero offset in that case
  float validRefract = step(0.001, length(rDir));
  vec2 refractOffset = rDir.xy * uThickness * validRefract;

  // --- Chromatic aberration: blue light refracts more than red (like a real prism) ---
  float ca = uChromaticAberration * 0.5;
  float bkgR = texture2D(uSceneTexture, clamp(screenUV + refractOffset * (1.0 - ca), 0.002, 0.998)).r;
  float bkgG = texture2D(uSceneTexture, clamp(screenUV + refractOffset,              0.002, 0.998)).g;
  float bkgB = texture2D(uSceneTexture, clamp(screenUV + refractOffset * (1.0 + ca), 0.002, 0.998)).b;
  vec3 refractColor = vec3(bkgR, bkgG, bkgB);

  // --- Reflection with chromatic dispersion ---
  // Offset the reflection direction slightly per channel to simulate prism dispersion
  vec3 rD  = reflect(-V_w, N_w);
  float cd = uChromaticAberration * 0.06;
  // Perturb along a tangent direction so R/B spread apart in the env map
  vec3 tang = normalize(cross(N_w, vec3(0.0, 1.0, 0.001)));
  vec3 reflR = sampleEquirect(uEnvMap, normalize(rD + tang *  cd));
  vec3 reflG = sampleEquirect(uEnvMap, rD);
  vec3 reflB = sampleEquirect(uEnvMap, normalize(rD - tang *  cd));
  // Tiny ambient floor prevents pure-black on large facets without washing out colors
  vec3 reflectColor = (vec3(reflR.r, reflG.g, reflB.b) + vec3(0.012, 0.012, 0.02)) * uEnvMapIntensity;

  // --- Fresnel blend: grazing angles fully reflective ---
  // Floor of 0.18 ensures visible color even on face-on facets against a dark background
  float F = max(schlickFresnel(max(dot(V_w, N_w), 0.0), uIOR), 0.18);

  gl_FragColor = vec4(mix(refractColor, reflectColor, F), 1.0);
}
`;

  function makeDiamondShader() {
    var mat = new THREE.ShaderMaterial({
      vertexShader: DIAMOND_VERT,
      fragmentShader: DIAMOND_FRAG,
      uniforms: {
        uSceneTexture:        { value: null },
        uEnvMap:              { value: diamondEnvRaw },
        uIOR:                 { value: 2.417 },
        uThickness:           { value: 0.42 },
        uChromaticAberration: { value: 0.22 },
        uEnvMapIntensity:     { value: 11.0 },
        uFresnelPower:        { value: 4.0 }
      },
      side: THREE.DoubleSide
    });
    diamondShaderMaterials.push(mat);
    return mat;
  }

  function applyMaterial(group, mat, receiveShadow) {
    group.traverse(function (child) {
      if (!child.isMesh) return;
      child.material = mat.clone();
      child.castShadow = true;
      child.receiveShadow = receiveShadow;
    });
  }

  function cloneScene(sceneRoot) {
    return sceneRoot.clone(true);
  }

  function loadModel(url) {
    return new Promise(function (resolve, reject) {
      if (modelCache[url]) {
        resolve(cloneScene(modelCache[url]));
        return;
      }
      loader.load(url, function (gltf) {
        modelCache[url] = gltf.scene;
        resolve(cloneScene(gltf.scene));
      }, undefined, function (error) {
        reject(error);
      });
    });
  }

  function applyTransform(object, option) {
    var transform = option.transform || {};
    object.scale.setScalar(transform.scale || 0.1);
    object.rotation.set.apply(object.rotation, transform.rotation || [0, 0, 0]);
    object.position.set.apply(object.position, transform.position || [0, 0, 0]);
  }

  function applyState() {
    if (!currentMeshes.banda || !currentMeshes.engaste || !currentMeshes.piedra) return;

    var metalConfig = METAL[state.metal];
    var metalMaterial = makeMetalMat(metalConfig);
    applyMaterial(currentMeshes.banda, metalMaterial, true);
    applyMaterial(currentMeshes.engaste, metalMaterial, true);

    // Dispose previous diamond shaders and clear tracking array
    diamondShaderMaterials.forEach(function (m) { m.dispose(); });
    diamondShaderMaterials.length = 0;

    // Apply custom diamond shader to every mesh in the stone group
    var stoneMeshes = [];
    currentMeshes.piedra.traverse(function (child) {
      if (child.isMesh) stoneMeshes.push(child);
    });
    stoneMeshes.forEach(function (mesh) {
      mesh.material = makeDiamondShader();
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });

    applyTransform(currentMeshes.banda, selectedOption('bandas'));
    applyTransform(currentMeshes.engaste, selectedOption('engastes'));
    applyTransform(currentMeshes.piedra, selectedOption('piedras'));

    // Apply per-engaste stone adjustments (offset + optional scale multiplier)
    var engT = selectedOption('engastes').transform || {};
    if (engT.stoneOffset) {
      currentMeshes.piedra.position.x += engT.stoneOffset[0];
      currentMeshes.piedra.position.y += engT.stoneOffset[1];
      currentMeshes.piedra.position.z += engT.stoneOffset[2];
    }
    if (engT.stoneScale) {
      currentMeshes.piedra.scale.multiplyScalar(engT.stoneScale);
    }

    ringGroup.scale.setScalar(Math.pow(state.carat, 1 / 3));

    centerSelection();
    updateSummary();
  }

  function setMeshes(meshes) {
    Object.keys(currentMeshes).forEach(function (key) {
      if (currentMeshes[key]) ringGroup.remove(currentMeshes[key]);
    });

    currentMeshes.banda = meshes.banda;
    currentMeshes.engaste = meshes.engaste;
    currentMeshes.piedra = meshes.piedra;

    ringGroup.add(currentMeshes.banda);
    ringGroup.add(currentMeshes.engaste);
    ringGroup.add(currentMeshes.piedra);

    applyState();
    frameSelection();
  }

  function loadSelection() {
    var activeToken = ++loadToken;
    setLoading(true, 'Cargando piezas seleccionadas');

    Promise.all([
      loadModel(selectedOption('bandas').file),
      loadModel(selectedOption('engastes').file),
      loadModel(selectedOption('piedras').file)
    ]).then(function (models) {
      if (activeToken !== loadToken) return;
      setMeshes({
        banda: models[0],
        engaste: models[1],
        piedra: models[2]
      });
      setLoading(false);
    }).catch(function (error) {
      console.error('GLB load error:', error);
      loadingCopy.textContent = 'No pudimos cargar esta combinacion';
    });
  }

  function buildOptions(category, container) {
    container.innerHTML = '';

    MODEL_LIBRARY[category].forEach(function (option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'option-btn';
      button.setAttribute('data-category', category);
      button.setAttribute('data-id', option.id);
      button.innerHTML =
        '<span class="option-caption">' + option.caption + '</span>' +
        '<span class="option-label">' + option.label + '</span>';
      button.addEventListener('click', function () {
        state[CATEGORY_STATE_KEY[category]] = option.id;
        syncOptionButtons();
        loadSelection();
      });
      container.appendChild(button);
    });
  }

  function syncOptionButtons() {
    Object.keys(optionContainers).forEach(function (category) {
      var selectedId = state[CATEGORY_STATE_KEY[category]];
      optionContainers[category].querySelectorAll('.option-btn').forEach(function (button) {
        button.classList.toggle('active', button.getAttribute('data-id') === selectedId);
      });
    });
  }

  function totalPrice() {
    var extras =
      selectedOption('bandas').price +
      selectedOption('engastes').price +
      selectedOption('piedras').price;

    return BASE_PRICE[state.metal] + Math.round(state.carat * 800) + extras;
  }

  function updateSummary() {
    var band = selectedOption('bandas');
    var setting = selectedOption('engastes');
    var stone = selectedOption('piedras');
    var total = totalPrice();

    currentBandLabel.textContent = band.label;
    currentSettingLabel.textContent = setting.label;
    currentStoneLabel.textContent = stone.label;

    summaryBand.textContent = band.label;
    summarySetting.textContent = setting.label;
    summaryStone.textContent = stone.label;
    priceDisplay.innerHTML = '<sup>$</sup>' + total.toLocaleString();
  }

  function updateQuote() {
    var total = totalPrice();
    var band = selectedOption('bandas');
    var setting = selectedOption('engastes');
    var stone = selectedOption('piedras');
    var subject = 'Solicitud de cotizacion - ' + band.label + ' - ' + state.carat.toFixed(1) + ' ct';
    var body = [
      'Hola, me gustaria recibir una cotizacion para esta configuracion del demo:',
      '',
      'Metal: ' + METAL_LABELS[state.metal],
      'Banda: ' + band.label,
      'Engaste: ' + setting.label,
      'Piedra: ' + stone.label,
      'Quilates: ' + state.carat.toFixed(1) + ' ct',
      'Precio estimado demo: $' + total.toLocaleString(),
      '',
      'Enviado desde el configurador web.'
    ].join('\n');

    window.location.href =
      'mailto:' + QUOTE_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function updateSliderBackground() {
    var pct = ((caratSlider.value - 5) / 25 * 100).toFixed(1);
    caratSlider.style.background =
      'linear-gradient(to right,#c9a84c ' + pct + '%,rgba(26,24,20,0.1) ' + pct + '%)';
  }

  function scheduleAutoRotateResume() {
    clearTimeout(autoRotateTimer);
    autoRotateTimer = setTimeout(function () {
      controls.autoRotate = true;
    }, 3200);
  }

  function centerSelection() {
    ringGroup.position.set(0, 0, 0);
    var box = new THREE.Box3().setFromObject(ringGroup);
    var center = box.getCenter(new THREE.Vector3());
    ringBasePosition.set(-center.x, -center.y, -center.z);
    ringGroup.position.copy(ringBasePosition);
  }

  function frameSelection() {
    var box = new THREE.Box3().setFromObject(ringGroup);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    var distance = Math.max(3.8, maxDim * 2.7);

    controls.target.copy(center);
    controls.target.y += size.y * 0.08;
    camera.position.set(
      center.x + distance * 0.22,
      center.y + distance * 0.34,
      center.z + distance * 0.92
    );
    controls.minDistance = Math.max(2.6, maxDim * 1.15);
    controls.maxDistance = Math.max(7.4, maxDim * 3.2);
    controls.update();
    scheduleAutoRotateResume();
  }

  function resize() {
    var parent = canvas.parentElement;
    var w = parent.clientWidth, h = parent.clientHeight;
    renderer.setSize(w, h, false);
    var dpr = renderer.getPixelRatio();
    sceneRenderTarget.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    controls.update();
  }

  function animate() {
    requestAnimationFrame(animate);
    tick += 0.004;
    ringGroup.position.set(
      ringBasePosition.x,
      ringBasePosition.y + Math.sin(tick) * 0.015,
      ringBasePosition.z
    );
    controls.update();

    if (currentMeshes.piedra && diamondShaderMaterials.length > 0) {
      // Pass 1: render scene WITHOUT diamond → captures background for refraction UV
      currentMeshes.piedra.visible = false;
      renderer.setRenderTarget(sceneRenderTarget);
      renderer.render(scene, camera);

      // Feed captured background to all active diamond shader materials
      var bgTex = sceneRenderTarget.texture;
      for (var i = 0; i < diamondShaderMaterials.length; i++) {
        diamondShaderMaterials[i].uniforms.uSceneTexture.value = bgTex;
      }

      // Pass 2: render full scene WITH diamond using the captured background
      currentMeshes.piedra.visible = true;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    } else {
      renderer.render(scene, camera);
    }
  }

  function initMetalButtons() {
    ['yellow', 'white', 'rose', 'platinum'].forEach(function (metalKey) {
      var button = document.getElementById('btn-metal-' + metalKey);
      button.addEventListener('click', function () {
        state.metal = metalKey;
        document.querySelectorAll('.metal-btn').forEach(function (item) {
          item.classList.remove('active');
        });
        button.classList.add('active');
        applyState();
      });
    });
  }

  function init() {
    buildOptions('bandas', optionContainers.bandas);
    buildOptions('engastes', optionContainers.engastes);
    buildOptions('piedras', optionContainers.piedras);
    syncOptionButtons();
    initMetalButtons();

    controls.addEventListener('start', function () {
      clearTimeout(autoRotateTimer);
      controls.autoRotate = false;
    });
    controls.addEventListener('end', scheduleAutoRotateResume);

    canvas.addEventListener('dblclick', frameSelection);
    resetViewButton.addEventListener('click', frameSelection);

    caratSlider.addEventListener('input', function () {
      state.carat = Number(caratSlider.value) / 10;
      caratDisplay.textContent = state.carat.toFixed(1) + ' ct';
      updateSliderBackground();
      applyState();
    });

    quoteButton.addEventListener('click', updateQuote);

    resize();
    updateSliderBackground();
    loadSelection();
    animate();
    window.addEventListener('resize', resize);
  }

  init();
}());
