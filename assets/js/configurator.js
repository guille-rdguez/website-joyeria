(function () {
  'use strict';

  var QUOTE_EMAIL = 'ventas@example.com';
  var ASSET_VERSION = 'diamond-hdri-1';
  var STUDIO_HDR_PATH = './assets/hdr/studio_jewelry.hdr';

  var METAL_LABELS = {
    yellow: 'Oro Amarillo',
    white: 'Oro Blanco',
    rose: 'Oro Rosa',
    platinum: 'Platino'
  };

  function versionedAsset(path) {
    return path + '?v=' + ASSET_VERSION;
  }

  // Diamond render controls. Tweak these first when balancing the stone:
  // IOR = optical bend, roughness = micro-softening, env = brightness,
  // thickness = screen-space refraction depth, dispersion = subtle RGB fire.
  var DIAMOND_RENDER_PARAMS = {
    diamondIOR: 2.42,
    diamondRoughness: 0.008,
    diamondEnvIntensity: 4.25,
    diamondThickness: 0.085,
    diamondDispersionStrength: 0.024
  };

  // Central PBR material tuning for jewelry. These values are intentionally easy
  // to adjust: color, roughness, metalness and envMapIntensity define the metal
  // read; diamond uniforms below control IOR, dispersion and reflective fire.
  var JEWELRY_MATERIALS = {
    metal_yellow: {
      color: 0xd4af37,
      metalness: 1,
      roughness: 0.17,
      envMapIntensity: 3.45
    },
    metal_white: {
      color: 0xe8e8e3,
      metalness: 1,
      roughness: 0.14,
      envMapIntensity: 3.65
    },
    metal_rose: {
      color: 0xc58a7a,
      metalness: 1,
      roughness: 0.17,
      envMapIntensity: 3.55
    },
    metal_platinum: {
      color: 0xc9c9c5,
      metalness: 1,
      roughness: 0.12,
      envMapIntensity: 3.8
    },
    diamond_center: {
      ior: DIAMOND_RENDER_PARAMS.diamondIOR,
      roughness: DIAMOND_RENDER_PARAMS.diamondRoughness,
      thickness: DIAMOND_RENDER_PARAMS.diamondThickness,
      chromaticAberration: DIAMOND_RENDER_PARAMS.diamondDispersionStrength,
      envMapIntensity: DIAMOND_RENDER_PARAMS.diamondEnvIntensity,
      fresnelPower: 4.45,
      opacity: 1
    }
  };

  var METAL_MATERIAL_KEY = {
    yellow: 'metal_yellow',
    white: 'metal_white',
    rose: 'metal_rose',
    platinum: 'metal_platinum'
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
      },
      {
        id: 'banda-premium',
        label: 'Banda Premium',
        caption: 'Premium',
        price: 950,
        file: versionedAsset('./assets/models/bandas/banda-premium.glb'),
        transform: { scale: 0.1, rotation: [0, 0, 0], position: [0, 0.036, 0] }
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
      },
      {
        id: 'engaste-garras-premium',
        label: 'Garras Premium',
        caption: 'Premium',
        price: 880,
        file: versionedAsset('./assets/models/engastes/engaste-garras-premium.glb'),
        transform: { scale: 0.092, rotation: [0, 0, 0], position: [0, 0.055, 0], anchorBottom: 6.214, stoneOffset: [0, 0, 0], stoneScale: 1 }
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
      },
      {
        id: 'diamante-premium',
        label: 'Diamante Premium',
        caption: 'Premium',
        price: 1250,
        file: versionedAsset('./assets/models/piedras/diamante-premium.glb'),
        transform: {
          scale: 0.081,
          rotation: [0, 0, 0],
          position: [-0.006, 0.245, -0.002],
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
    metal: 'rose',
    bandMetal: 'rose',
    settingMetal: 'rose',
    centerStoneMaterial: 'diamond_center',
    carat: 1.0,
    banda: 'banda-premium',
    engaste: 'engaste-garras-premium',
    piedra: 'diamante-premium'
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
  if (THREE.ColorManagement) THREE.ColorManagement.enabled = true;
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.46;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7b7b5);

  var camera = new THREE.PerspectiveCamera(32, 1, 0.01, 500);
  var controls = new THREE.OrbitControls(camera, canvas);
  var ringGroup = new THREE.Group();
  scene.add(ringGroup);

  var shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.30 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, -1.28, 0);
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Procedural studio PMREM. This replaces a flat environment with large reflected
  // softboxes and dark cards, which is what makes polished jewelry read as metal.
  var pmrem = new THREE.PMREMGenerator(renderer);
  var envScene = new THREE.Scene();
  [
    [[58,  14,  22],  0xffffff, 42, 20], // broad white key strip
    [[-58, 18, -18],  0xf6f8ff, 38, 20], // cool fill strip
    [[0,   72,  18],  0xfffcf5, 48, 24], // warm overhead softbox
    [[0,  -60,   0],  0x7a7771, 80, 80], // softened floor card
    [[0,    8,  62],  0xfff7ee, 46, 26], // large warm front card
    [[0,    2, -60],  0x85817a, 42, 26], // softened rear card
    [[38,  -2,  44],  0xf8d7bd, 26, 18], // warm rose/gold accent
    [[-38, -2,  44],  0xf0f4f8, 26, 18], // cool silver accent
    [[0,    0,  46],  0xffffff, 70, 16], // long front ribbon highlight
    [[0,   18,  38],  0xffffff, 58, 26]  // frontal overhead broad fill
  ].forEach(function (face) {
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(face[2], face[3]),
      new THREE.MeshBasicMaterial({ color: face[1], side: THREE.DoubleSide })
    );
    mesh.position.set(face[0][0], face[0][1], face[0][2]);
    mesh.lookAt(0, 0, 0);
    envScene.add(mesh);
  });
  var studioEnvironment = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = studioEnvironment;

  // Diamond env map — mostly white/gray studio reflections with only tiny color
  // hints. The goal is a clean premium diamond, not a holographic rainbow stone.
  var diamondEnvRaw = (function () {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    var ctx = c.getContext('2d');
    // Neutral charcoal base gives facets contrast without turning them neon.
    ctx.fillStyle = '#1b1c20';
    ctx.fillRect(0, 0, 512, 512);
    [
      // White softboxes and gray cards: these define the premium crystalline read.
      { x: 92,  y: 92,  r: 98,  col: '255,255,255', strength: 1.0 },
      { x: 420, y: 88,  r: 92,  col: '255,255,255', strength: 1.0 },
      { x: 256, y: 34,  r: 84,  col: '255,255,252', strength: 0.96 },
      { x: 118, y: 396, r: 94,  col: '240,244,250', strength: 0.64 },
      { x: 424, y: 400, r: 90,  col: '250,247,241', strength: 0.58 },
      { x: 260, y: 260, r: 112, col: '226,232,240', strength: 0.48 },
      { x: 252, y: 126, r: 64,  col: '255,255,255', strength: 0.74 },
      { x: 238, y: 314, r: 66,  col: '250,252,255', strength: 0.54 },
      // Tiny spectral hints only, kept weak so facets stay white/crystal.
      { x: 144, y: 210, r: 40,  col: '120,205,255', strength: 0.11 },
      { x: 342, y: 182, r: 38,  col: '255,216,135', strength: 0.10 },
      { x: 372, y: 326, r: 32,  col: '210,150,235', strength: 0.055 }
    ].forEach(function (l) {
      var g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      var strength = l.strength || 0.3;
      g.addColorStop(0,    'rgba(' + l.col + ',' + strength + ')');
      g.addColorStop(0.22, 'rgba(' + l.col + ',' + (strength * 0.72) + ')');
      g.addColorStop(0.52, 'rgba(' + l.col + ',' + (strength * 0.22) + ')');
      g.addColorStop(0.82, 'rgba(' + l.col + ',' + (strength * 0.04) + ')');
      g.addColorStop(1,    'rgba(' + l.col + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    });
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }());
  var diamondEnvironmentMap = diamondEnvRaw;
  // Active diamond ShaderMaterial instances — updated each frame with uSceneTexture.
  // The optional HDRI is used only by the diamond shader, not by scene.environment,
  // so band and setting metals keep their established studio-metal reflections.
  var diamondShaderMaterials = [];

  function updateDiamondEnvironment(map, isRGBE) {
    diamondEnvironmentMap = map || diamondEnvRaw;
    diamondShaderMaterials.forEach(function (mat) {
      if (mat.uniforms && mat.uniforms.uEnvMap) {
        mat.uniforms.uEnvMap.value = diamondEnvironmentMap;
        mat.uniforms.uEnvMapIsRGBE.value = isRGBE ? 1 : 0;
        mat.needsUpdate = true;
      }
    });
  }

  function loadHDRIEnvironment() {
    if (!THREE.RGBELoader) return;
    var loadHDR = function () {
      new THREE.RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load(STUDIO_HDR_PATH, function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          updateDiamondEnvironment(texture, true);
        }, undefined, function () {
          updateDiamondEnvironment(diamondEnvRaw, false);
        });
    };

    if (window.fetch) {
      window.fetch(STUDIO_HDR_PATH, { method: 'HEAD' })
        .then(function (response) {
          if (response.ok) loadHDR();
        })
        .catch(function () {
          updateDiamondEnvironment(diamondEnvRaw, false);
        });
    } else {
      loadHDR();
    }
  }
  loadHDRIEnvironment();

  // RenderTarget captures the scene (without diamond) for screen-space refraction
  var sceneRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat
  });

  // Luces de escena — todas neutras/blancas para no teñir el metal.
  // Los colores de estudio (cyan, naranja, magenta) viven solo en el env map
  // y en diamondEnvRaw: afectan reflexiones/refracciones sin pintar el metal.

  // AMBIENT — very low; the PMREM softboxes should do most of the reflective work.
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  // KEY — large, clean studio highlight for polished metal edges.
  var key = new THREE.DirectionalLight(0xffffff, 2.55);
  key.position.set(4.5, 8.5, 6.5);
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

  // FILL — cool and soft, preserves contrast while keeping white metals crisp.
  var fill = new THREE.DirectionalLight(0xf9fbff, 1.55);
  fill.position.set(-4.2, 5.0, 6.2);
  scene.add(fill);

  var frontFill = new THREE.DirectionalLight(0xfffbf5, 0.75);
  frontFill.position.set(0, 2.8, 6.5);
  scene.add(frontFill);

  // RIM — long warm reflection along rose/yellow gold silhouettes.
  var rim = new THREE.DirectionalLight(0xfff4ea, 0.58);
  rim.position.set(-8, 3, -7);
  scene.add(rim);

  if (THREE.RectAreaLight && THREE.RectAreaLightUniformsLib) {
    THREE.RectAreaLightUniformsLib.init();
    var topSoftbox = new THREE.RectAreaLight(0xffffff, 3.2, 5.2, 2.4);
    topSoftbox.position.set(0, 4.6, 2.8);
    topSoftbox.lookAt(0, 0.7, 0);
    scene.add(topSoftbox);
    var diamondTableSoftbox = new THREE.RectAreaLight(0xffffff, 2.0, 2.8, 1.35);
    diamondTableSoftbox.position.set(0, 3.35, 3.7);
    diamondTableSoftbox.lookAt(0, 1.25, 0);
    scene.add(diamondTableSoftbox);
    var frontRibbon = new THREE.RectAreaLight(0xfff8f0, 2.85, 6.8, 1.35);
    frontRibbon.position.set(0, 1.15, 4.35);
    frontRibbon.lookAt(0, 0.55, 0);
    scene.add(frontRibbon);
    var sideStrip = new THREE.RectAreaLight(0xffffff, 1.6, 1.1, 4.2);
    sideStrip.position.set(-3.8, 1.4, 2.4);
    sideStrip.lookAt(0, 0.45, 0);
    scene.add(sideStrip);
  }

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

  function makeMetalMat(metalKey) {
    var config = JEWELRY_MATERIALS[METAL_MATERIAL_KEY[metalKey] || 'metal_yellow'];
    return new THREE.MeshPhysicalMaterial({
      name: METAL_MATERIAL_KEY[metalKey] || 'metal_yellow',
      color: new THREE.Color(config.color),
      metalness: config.metalness,
      roughness: config.roughness,
      envMapIntensity: config.envMapIntensity,
      clearcoat: 0,
      clearcoatRoughness: 0,
      reflectivity: 1,
      side: THREE.DoubleSide
    });
  }

  function makeDiamondPhysicalFallback() {
    var config = JEWELRY_MATERIALS.diamond_center;
    var materialConfig = {
      name: 'diamond_center_physical_fallback',
      color: new THREE.Color(0xffffff),
      metalness: 0,
      roughness: config.roughness,
      envMapIntensity: config.envMapIntensity,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide
    };

    // Three r128 supports these MeshPhysicalMaterial properties in modern browsers.
    // They are left centralized here so the diamond can fall back gracefully if the
    // custom shader is disabled during tuning.
    materialConfig.transmission = 1;
    materialConfig.thickness = config.thickness;
    materialConfig.ior = config.ior;
    materialConfig.attenuationColor = new THREE.Color(0xffffff);
    materialConfig.attenuationDistance = 2.8;
    materialConfig.specularIntensity = 0.95;
    materialConfig.specularColor = new THREE.Color(0xffffff);

    return new THREE.MeshPhysicalMaterial(materialConfig);
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
uniform float     uEnvMapIsRGBE;    // 1 when uEnvMap comes from RGBELoader .hdr
uniform float     uIOR;             // Index of refraction (2.417 = diamond, 1.5 = glass)
uniform float     uThickness;       // Screen-space refraction strength
uniform float     uChromaticAberration; // Blue refracts more than red (dispersion / fire)
uniform float     uEnvMapIntensity; // Reflection brightness multiplier
uniform float     uFresnelPower;    // Schlick exponent (5 = physically accurate)
uniform float     uRoughness;       // Micro-softening for non-mirror diamond reflections

varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldViewDir;
varying vec4 vClipPos;

vec3 decodeEnvironmentTexel(vec4 texel) {
  if (uEnvMapIsRGBE > 0.5) {
    vec3 hdr = texel.rgb * exp2(texel.a * 255.0 - 128.0);
    return hdr / (hdr + vec3(1.0));
  }
  return texel.rgb;
}

// Sample equirectangular 2D texture from a 3D direction vector
vec3 sampleEquirect(sampler2D map, vec3 dir) {
  float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
  return decodeEnvironmentTexel(texture2D(map, vec2(u, v)));
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

  // --- Subtle chromatic aberration ---
  // Keep dispersion restrained; high values make the diamond look holographic.
  float ca = uChromaticAberration * 0.24;
  float bkgR = texture2D(uSceneTexture, clamp(screenUV + refractOffset * (1.0 - ca), 0.002, 0.998)).r;
  float bkgG = texture2D(uSceneTexture, clamp(screenUV + refractOffset,              0.002, 0.998)).g;
  float bkgB = texture2D(uSceneTexture, clamp(screenUV + refractOffset * (1.0 + ca), 0.002, 0.998)).b;
  vec3 refractColor = vec3(bkgR, bkgG, bkgB);
  float refractLuma = dot(refractColor, vec3(0.299, 0.587, 0.114));
  // Real diamonds do not behave like a chrome mirror. Keep scene refraction as
  // optical depth, but bleach/desaturate it so prongs are not copied literally.
  refractColor = mix(vec3(refractLuma), refractColor, 0.22);
  refractColor = mix(refractColor, vec3(0.985, 0.992, 1.0), 0.30);

  // --- Reflection with very subtle chromatic dispersion ---
  vec3 rD  = reflect(-V_w, N_w);
  float cd = uChromaticAberration * 0.026;
  // Perturb along a tangent direction so R/B spread apart in the env map
  vec3 tang = normalize(cross(N_w, vec3(0.0, 1.0, 0.001)));
  vec3 reflR = sampleEquirect(uEnvMap, normalize(rD + tang *  cd));
  vec3 reflG = sampleEquirect(uEnvMap, rD);
  vec3 reflB = sampleEquirect(uEnvMap, normalize(rD - tang *  cd));
  // Tiny ambient floor prevents pure-black on large facets without washing out colors
  vec3 reflectColor = (vec3(reflR.r, reflG.g, reflB.b) + vec3(0.034)) * uEnvMapIntensity;
  float reflectLuma = dot(reflectColor, vec3(0.299, 0.587, 0.114));
  reflectColor = mix(vec3(reflectLuma), reflectColor, 0.28);
  reflectColor = pow(clamp(reflectColor, 0.0, 4.0), vec3(0.86));
  reflectColor *= 1.0 - clamp(uRoughness * 5.0, 0.0, 0.18);

  // Faceted internal contrast: white/gray/charcoal shards from normals and view,
  // not literal mirror reflections. This keeps the cut readable and crystalline.
  float facetA = pow(abs(dot(N_w, normalize(vec3(0.45, 0.82, 0.35)))), 7.0);
  float facetB = pow(abs(dot(N_w, normalize(vec3(-0.72, 0.28, 0.62)))), 5.0);
  float pavilion = pow(clamp(1.0 - abs(dot(N_w, V_w)), 0.0, 1.0), 2.8);
  float sparkle = pow(max(facetA, facetB), 2.08);
  float fireMask = pow(clamp(facetA * 0.65 + facetB * 0.85 + pavilion * 0.15, 0.0, 1.0), 3.6);
  vec3 spectralFire = vec3(0.70, 0.92, 1.0) * fireMask * uChromaticAberration * 3.2;
  spectralFire += vec3(1.0, 0.78, 0.36) * pow(facetB, 4.2) * uChromaticAberration * 2.5;
  vec3 internalFacets = mix(vec3(0.08, 0.09, 0.105), vec3(1.0), clamp(facetA + facetB * 0.86, 0.0, 1.0));
  internalFacets = mix(internalFacets, vec3(0.86, 0.89, 0.94), pavilion * 0.18);
  internalFacets += vec3(1.0, 0.985, 0.95) * sparkle * 0.42;

  // --- Fresnel blend: grazing angles fully reflective ---
  // Low floor avoids chrome-like direct reflection; grazing facets still sparkle.
  float F = max(schlickFresnel(max(dot(V_w, N_w), 0.0), uIOR), 0.088);

  vec3 diamondColor = mix(refractColor, internalFacets, 0.38);
  diamondColor = mix(diamondColor, reflectColor, F * 0.88);
  diamondColor += vec3(1.0) * sparkle * 0.12;
  diamondColor += spectralFire;
  gl_FragColor = vec4(diamondColor, 1.0);
}
`;

  function makeDiamondShader() {
    var config = JEWELRY_MATERIALS.diamond_center;
    var mat = new THREE.ShaderMaterial({
      name: 'diamond_center',
      vertexShader: DIAMOND_VERT,
      fragmentShader: DIAMOND_FRAG,
      uniforms: {
        uSceneTexture:        { value: null },
        uEnvMap:              { value: diamondEnvironmentMap },
        uEnvMapIsRGBE:        { value: 0 },
        uIOR:                 { value: config.ior },
        uThickness:           { value: config.thickness },
        uChromaticAberration: { value: config.chromaticAberration },
        uEnvMapIntensity:     { value: config.envMapIntensity },
        uFresnelPower:        { value: config.fresnelPower },
        uRoughness:           { value: config.roughness }
      },
      side: THREE.DoubleSide
    });
    diamondShaderMaterials.push(mat);
    return mat;
  }

  function applyMaterial(group, mat, receiveShadow) {
    group.traverse(function (child) {
      if (!child.isMesh) return;
      if (child.material && child.material.dispose) child.material.dispose();
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

    var bandMetalMaterial = makeMetalMat(state.bandMetal || state.metal);
    var settingMetalMaterial = makeMetalMat(state.settingMetal || state.metal);
    applyMaterial(currentMeshes.banda, bandMetalMaterial, true);
    applyMaterial(currentMeshes.engaste, settingMetalMaterial, true);

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
        state.bandMetal = metalKey;
        state.settingMetal = metalKey;
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
