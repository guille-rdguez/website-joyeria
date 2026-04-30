(function () {
  'use strict';

  // Diamond material: inline PBR replication of the color/refraction palette
  // from Roland Csibrei's babylonjs-diamond-sphere (github.com/RolandCsibrei/babylonjs-diamond-sphere).
  // No remote snippet dependency — all parameters are embedded here.

  var QUOTE_EMAIL = 'ventas@example.com';

  var METAL_LABELS = {
    yellow: 'Oro Amarillo',
    white: 'Oro Blanco',
    rose: 'Oro Rosa',
    platinum: 'Platino'
  };

  var METAL = {
    yellow: { color: [0.82, 0.67, 0.23], roughness: 0.22, environmentIntensity: 1.05, clearcoat: 0.58, clearcoatRoughness: 0.16 },
    white: { color: [0.92, 0.94, 0.97], roughness: 0.16, environmentIntensity: 1.14, clearcoat: 0.65, clearcoatRoughness: 0.12 },
    rose: { color: [0.83, 0.58, 0.47], roughness: 0.2, environmentIntensity: 1.02, clearcoat: 0.56, clearcoatRoughness: 0.16 },
    platinum: { color: [0.85, 0.88, 0.92], roughness: 0.12, environmentIntensity: 1.18, clearcoat: 0.66, clearcoatRoughness: 0.1 }
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
        transform: { scale: 0.1, rotation: [0, 0, 0], position: [0, 0, 0] },
        stoneYOffset: 0,
        stoneScaleMult: 1.0
      },
      {
        id: 'engaste-leaf',
        label: 'Leaf Organico',
        caption: 'Nuevo',
        price: 420,
        file: './assets/models/engastes/engaste-leaf.glb',
        transform: { scale: 0.1, rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] },
        stoneYOffset: 0.05,
        stoneScaleMult: 1.3
      }
    ],
    piedras: [
      {
        id: 'piedra-diamante-base',
        label: 'Diamante Babylon',
        caption: 'Babylon',
        price: 0,
        file: './assets/models/piedras/piedra-diamante-base.glb',
        transform: { scale: 1, rotation: [0, 0, 0], position: [0, 0, 0] },
        source: 'babylon-node-material'
      },
      {
        id: 'piedra-variante-01',
        label: 'Piedra Signature',
        caption: 'Variante',
        price: 680,
        file: './assets/models/piedras/piedra-variante-01.glb',
        transform: { scale: 1, rotation: [0, 0, 0], position: [0, -0.01, 0] },
        source: 'babylon-node-material'
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

  var engine = null;
  var scene = null;
  var camera = null;
  var shadowGenerator = null;
  var ringRoot = null;
  var shadowGround = null;
  var sunMesh = null;
  var autoRotateEnabled = true;
  var autoRotateTimer = null;
  var tick = 0;
  var ringBasePosition = null;
  var loadToken = 0;

  var currentNodes = {
    banda: null,
    engaste: null,
    piedra: null
  };

  function showInitError(message, error) {
    console.error(message, error || '');
    if (loadingCopy) loadingCopy.textContent = message;
    if (loading) loading.style.display = 'flex';
  }

  function setLoading(active, copy) {
    if (copy) loadingCopy.textContent = copy;
    if (loading) loading.style.display = active ? 'flex' : 'none';
  }

  function optionFor(category, id) {
    return MODEL_LIBRARY[category].find(function (item) {
      return item.id === id;
    });
  }

  function selectedOption(category) {
    return optionFor(category, state[CATEGORY_STATE_KEY[category]]);
  }

  function isBabylonDiamondOption(option) {
    return Boolean(option && option.source === 'babylon-node-material');
  }

  function formatColor(rgb) {
    return new BABYLON.Color3(rgb[0], rgb[1], rgb[2]);
  }

  function formatPrice(value) {
    return '$' + value.toLocaleString();
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
      'Precio estimado demo: ' + formatPrice(total),
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
      autoRotateEnabled = true;
    }, 3200);
  }

  function splitUrl(url) {
    var lastSlash = url.lastIndexOf('/');
    return {
      rootUrl: url.slice(0, lastSlash + 1),
      fileName: url.slice(lastSlash + 1)
    };
  }

  // ---------------------------------------------------------------------------
  // Diamond material — inline PBR replication of the babylonjs-diamond-sphere
  // color palette: IOR 2.42, near-zero roughness, refractive sub-surface,
  // cool albedo tint (0.76 / 0.84 / 0.98) and high environment intensity.
  // ---------------------------------------------------------------------------
  function createDiamondMaterial(name) {
    var mat = new BABYLON.PBRMaterial(name || ('diamond-' + Date.now()), scene);
    mat.metallic = 0;
    mat.roughness = 0;
    mat.microSurface = 0.998;
    mat.alpha = 0.12;
    mat.indexOfRefraction = 2.42;
    mat.directIntensity = 0.28;
    mat.environmentIntensity = 3.4;
    mat.reflectivityColor = new BABYLON.Color3(0.94, 0.96, 1.0);
    mat.albedoColor = new BABYLON.Color3(0.76, 0.84, 0.98);
    mat.backFaceCulling = false;
    mat.separateCullingPass = true;
    mat.twoSidedLighting = true;

    if (mat.subSurface) {
      mat.subSurface.isRefractionEnabled = true;
      mat.subSurface.refractionIntensity = 0.88;
      mat.subSurface.indexOfRefraction = 2.42;
      mat.subSurface.tintColor = new BABYLON.Color3(0.84, 0.9, 1.0);
    }

    return mat;
  }

  function createScene() {
    scene = new BABYLON.Scene(engine);
    scene.useRightHandedSystem = true;
    // Transparent clear so the CSS studio gradient shows through
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    scene.imageProcessingConfiguration.exposure = 1.0;

    camera = new BABYLON.ArcRotateCamera(
      'camera',
      -1.18,
      1.18,
      5.4,
      new BABYLON.Vector3(0, 0.12, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 3.1;
    camera.upperRadiusLimit = 8.5;
    camera.lowerBetaLimit = 0.5;
    camera.upperBetaLimit = 2.35;
    camera.wheelPrecision = 28;
    camera.panningSensibility = 0;

    ringRoot = new BABYLON.TransformNode('ring-root', scene);
    ringBasePosition = BABYLON.Vector3.Zero();

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData('./assets/env/decor-shop.env', scene);

    var hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.7;

    var key = new BABYLON.DirectionalLight('key', new BABYLON.Vector3(1, -1, -1), scene);
    key.intensity = 2.1;
    key.position = new BABYLON.Vector3(-16, 16, 16);

    shadowGenerator = new BABYLON.ShadowGenerator(2048, key);
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.useContactHardeningShadow = true;
    shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
    shadowGenerator.contactHardeningLightSizeUVRatio = 0.22;

    var fill = new BABYLON.DirectionalLight('fill', new BABYLON.Vector3(-0.6, -0.55, -0.55), scene);
    fill.intensity = 0.55;
    fill.diffuse = new BABYLON.Color3(0.9, 0.95, 1.0);

    var rim = new BABYLON.DirectionalLight('rim', new BABYLON.Vector3(-0.2, -0.35, 0.94), scene);
    rim.intensity = 0.38;
    rim.diffuse = new BABYLON.Color3(1.0, 0.95, 0.88);

    shadowGround = BABYLON.MeshBuilder.CreateGround('shadow-ground', { width: 10, height: 10 }, scene);
    shadowGround.position.y = -1.28;
    shadowGround.receiveShadows = true;

    var groundMat = new BABYLON.StandardMaterial('shadow-mat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.03);
    groundMat.specularColor = BABYLON.Color3.Black();
    groundMat.alpha = 0.18;
    shadowGround.material = groundMat;

    createSunRays();
    enablePipeline();

    scene.onPointerObservable.add(function (pointerInfo) {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        clearTimeout(autoRotateTimer);
        autoRotateEnabled = false;
      }
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
        scheduleAutoRotateResume();
      }
    });
  }

  function createSunRays() {
    sunMesh = BABYLON.MeshBuilder.CreatePlane('diamond-rays', { size: 0.12 }, scene);
    sunMesh.parent = ringRoot;
    sunMesh.position = new BABYLON.Vector3(0, 0.72, -0.06);
    sunMesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
    sunMesh.scaling = new BABYLON.Vector3(0.42, 0.42, 0.42);
    sunMesh.isPickable = false;

    var sunMat = new BABYLON.StandardMaterial('diamond-rays-mat', scene);
    sunMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    sunMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    sunMat.backFaceCulling = false;
    sunMat.disableLighting = true;
    sunMat.diffuseTexture = new BABYLON.Texture('./assets/textures/rainbow.png', scene);
    sunMat.diffuseTexture.hasAlpha = true;
    sunMesh.material = sunMat;

    var rays = new BABYLON.VolumetricLightScatteringPostProcess(
      'diamond-sun-rays',
      1,
      camera,
      sunMesh,
      100,
      BABYLON.Texture.BILINEAR_SAMPLINGMODE,
      engine,
      false
    );
    rays.exposure = 0.045;
    rays.decay = 0.92;
    rays.weight = 0.22;
    rays.density = 0.18;
  }

  function enablePipeline() {
    var pipeline = new BABYLON.DefaultRenderingPipeline('diamond-pipeline', true, scene, [camera]);
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.2;
    pipeline.bloomWeight = 0.01;
    pipeline.bloomKernel = 4;
    pipeline.bloomScale = 0.05;
    pipeline.imageProcessingEnabled = false;
    pipeline.fxaaEnabled = true;
    pipeline.samples = 2;
  }

  function makeMetalMaterial(key) {
    var config = METAL[key];
    var material = new BABYLON.PBRMaterial('metal-' + key + '-' + Date.now(), scene);
    material.albedoColor = formatColor(config.color);
    material.metallic = 1;
    material.roughness = config.roughness;
    material.environmentIntensity = config.environmentIntensity;
    material.directIntensity = 0.9;
    material.microSurface = 1 - Math.min(config.roughness * 0.82, 0.88);
    material.reflectivityColor = new BABYLON.Color3(1, 1, 1);

    if (material.clearCoat) {
      material.clearCoat.isEnabled = true;
      material.clearCoat.intensity = config.clearcoat;
      material.clearCoat.roughness = config.clearcoatRoughness;
    }

    return material;
  }

  function disposeNode(node) {
    if (!node) return;

    var childMeshes = node.getChildMeshes ? node.getChildMeshes(false) : [];
    childMeshes.forEach(function (mesh) {
      if (mesh.material && mesh.material.dispose) {
        mesh.material.dispose(false, true);
      }
      mesh.dispose(false, true);
    });

    var childTransforms = node.getChildTransformNodes ? node.getChildTransformNodes(false) : [];
    childTransforms.forEach(function (child) {
      if (child !== node) {
        child.dispose();
      }
    });

    node.dispose();
  }

  function applyMaterialToNode(node, material, receiveShadows) {
    node.getChildMeshes(false).forEach(function (mesh) {
      if (mesh.material && mesh.material.dispose) {
        mesh.material.dispose(false, true);
      }
      mesh.material = material.clone(mesh.name + '-mat');
      mesh.receiveShadows = receiveShadows;
      mesh.isPickable = false;
      shadowGenerator.addShadowCaster(mesh);
    });

    material.dispose(false, false);
  }

  function loadModelNode(url, name, option) {
    var split = splitUrl(url);

    return BABYLON.SceneLoader.ImportMeshAsync('', split.rootUrl, split.fileName, scene).then(function (loaded) {
      var wrapper = new BABYLON.TransformNode(name, scene);

      // Pass 1 — remove BabylonJS's synthetic __root__ without destroying its children.
      // doNotRecurse=true detaches children (parent→null) instead of recursively disposing them.
      // __root__ can live in loaded.meshes (Mesh type) or loaded.transformNodes (TransformNode type).
      loaded.meshes.forEach(function (mesh) {
        if (mesh.name === '__root__') mesh.dispose(true);
      });
      if (loaded.transformNodes) {
        loaded.transformNodes.forEach(function (node) {
          if (node.name === '__root__') node.dispose(true);
        });
      }

      // Pass 2 — re-parent every surviving parentless geometry mesh to wrapper.
      loaded.meshes.forEach(function (mesh) {
        if (mesh !== shadowGround && !mesh.isDisposed() && !mesh.parent) {
          mesh.parent = wrapper;
        }
      });

      loaded.animationGroups.forEach(function (group) {
        group.stop();
      });

      wrapper.parent = ringRoot;
      return wrapper;
    });
  }

  function applyTransform(node, option, category) {
    var transform = option.transform || {};
    var baseScale = transform.scale || 0.1;
    var rotation = transform.rotation || [0, 0, 0];
    var position = transform.position || [0, 0, 0];
    var scale = baseScale;
    var y = position[1];

    if (category === 'engastes') {
      scale = baseScale - 0.02 + state.carat * 0.02;
    }

    if (category === 'piedras') {
      var engaste = selectedOption('engastes');
      scale = (baseScale - 0.02 + state.carat * 0.02) * (engaste.stoneScaleMult || 1.0);
      y += engaste.stoneYOffset || 0;
    }

    if (category === 'bandas') {
      scale = baseScale - 0.01 + state.carat * 0.01;
    }

    node.position.copyFromFloats(position[0], y, position[2]);
    node.scaling.copyFromFloats(scale, scale, scale);
    node.rotationQuaternion = null;
    node.rotation.copyFromFloats(rotation[0], rotation[1], rotation[2]);
  }

  function fitStoneToSetting(stoneNode) {
    var stoneOption = selectedOption('piedras');
    var engasteOption = selectedOption('engastes');
    var engasteBounds = getHierarchyBounds(currentNodes.engaste);
    var rawStoneBounds = getHierarchyBounds(stoneNode);
    var rawStoneHeight = Math.max(rawStoneBounds.size.y, 0.0001);
    var normalizedCarat = (state.carat - 0.5) / 2.5;
    // targetHeight calibrated for actual diamond GLB (no cell-sphere reduction factor)
    var targetHeight = (0.28 + normalizedCarat * 0.16) * (engasteOption.stoneScaleMult || 1.0);

    var fitScale = targetHeight / rawStoneHeight;
    stoneNode.scaling.scaleInPlace(fitScale);

    var fittedBounds = getHierarchyBounds(stoneNode);
    var xCenter = engasteBounds.center.x;
    var zCenter = engasteBounds.center.z;
    var lift = isBabylonDiamondOption(stoneOption) ? 0.015 : 0;
    var yBase = engasteBounds.max.y - fittedBounds.min.y + (engasteOption.stoneYOffset || 0) + lift;

    stoneNode.position.x = xCenter;
    stoneNode.position.z = zCenter;
    stoneNode.position.y = yBase;

    if (sunMesh) {
      sunMesh.position.x = xCenter;
      // fittedBounds.max.y is in world space; subtract ringRoot offset to get ringRoot-local coord
      sunMesh.position.y = fittedBounds.max.y - ringRoot.position.y + yBase + targetHeight * 0.1;
      sunMesh.position.z = zCenter - 0.09;
      var rayScale = isBabylonDiamondOption(stoneOption) ? 0.26 + normalizedCarat * 0.08 : 0.1;
      sunMesh.scaling.copyFromFloats(rayScale, rayScale, rayScale);
      sunMesh.setEnabled(isBabylonDiamondOption(stoneOption));
    }
  }

  function getHierarchyBounds(node) {
    var min = new BABYLON.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    var max = new BABYLON.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    var meshes = node.getChildMeshes(false);

    meshes.forEach(function (mesh) {
      // Skip empty meshes (e.g. BabylonJS's synthetic __root__ wrapper)
      if (mesh.getTotalVertices() === 0) return;
      mesh.computeWorldMatrix(true);
      var box = mesh.getBoundingInfo().boundingBox;
      min = BABYLON.Vector3.Minimize(min, box.minimumWorld);
      max = BABYLON.Vector3.Maximize(max, box.maximumWorld);
    });

    if (!meshes.length) {
      min = BABYLON.Vector3.Zero();
      max = BABYLON.Vector3.Zero();
    }

    return {
      min: min,
      max: max,
      center: min.add(max).scale(0.5),
      size: max.subtract(min)
    };
  }

  function centerSelection() {
    ringRoot.position.copyFromFloats(0, 0, 0);
    var bounds = getHierarchyBounds(ringRoot);
    ringBasePosition = bounds.center.scale(-1);
    ringRoot.position.copyFrom(ringBasePosition);
  }

  function frameSelection() {
    var bounds = getHierarchyBounds(ringRoot);
    var center = bounds.center;
    var size = bounds.size;
    var maxDim = Math.max(size.x, size.y, size.z, 1);
    var distance = Math.max(4.1, maxDim * 2.95);

    camera.setTarget(center.add(new BABYLON.Vector3(0, size.y * 0.08, 0)));
    camera.radius = distance;
    camera.alpha = -1.1;
    camera.beta = 1.14;
    scheduleAutoRotateResume();
  }

  function syncShadowGround() {
    shadowGround.position.x = ringRoot.position.x;
    shadowGround.position.z = ringRoot.position.z;
  }

  function applyState() {
    if (!currentNodes.banda || !currentNodes.engaste || !currentNodes.piedra) {
      return Promise.resolve();
    }

    var metalMaterial = makeMetalMaterial(state.metal);
    applyMaterialToNode(currentNodes.banda, metalMaterial, true);
    applyMaterialToNode(currentNodes.engaste, metalMaterial, true);

    currentNodes.piedra.getChildMeshes(false).forEach(function (mesh) {
      if (mesh.material && mesh.material.dispose) {
        mesh.material.dispose(false, true);
      }
      mesh.material = createDiamondMaterial(mesh.name + '-diamond');
      mesh.receiveShadows = false;
      mesh.isPickable = false;
    });

    applyTransform(currentNodes.banda, selectedOption('bandas'), 'bandas');
    applyTransform(currentNodes.engaste, selectedOption('engastes'), 'engastes');
    applyTransform(currentNodes.piedra, selectedOption('piedras'), 'piedras');
    fitStoneToSetting(currentNodes.piedra);

    centerSelection();
    frameSelection();
    syncShadowGround();
    updateSummary();

    return Promise.resolve();
  }

  function setNodes(nodes) {
    Object.keys(currentNodes).forEach(function (key) {
      disposeNode(currentNodes[key]);
      currentNodes[key] = null;
    });

    currentNodes.banda = nodes.banda;
    currentNodes.engaste = nodes.engaste;
    currentNodes.piedra = nodes.piedra;

    return applyState();
  }

  function loadSelection() {
    var activeToken = ++loadToken;
    setLoading(true, 'Cargando configuracion');

    return Promise.all([
      loadModelNode(selectedOption('bandas').file, 'banda-node', selectedOption('bandas')),
      loadModelNode(selectedOption('engastes').file, 'engaste-node', selectedOption('engastes')),
      loadModelNode(selectedOption('piedras').file, 'piedra-node', selectedOption('piedras'))
    ]).then(function (nodes) {
      if (activeToken !== loadToken) {
        nodes.forEach(disposeNode);
        return;
      }

      return setNodes({
        banda: nodes[0],
        engaste: nodes[1],
        piedra: nodes[2]
      }).then(function () {
        setLoading(false);
      });
    }).catch(function (error) {
      showInitError('No pudimos cargar los modelos', error);
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

  function initMetalButtons() {
    ['yellow', 'white', 'rose', 'platinum'].forEach(function (metalKey) {
      var button = document.getElementById('btn-metal-' + metalKey);
      button.addEventListener('click', function () {
        state.metal = metalKey;
        document.querySelectorAll('.metal-btn').forEach(function (item) {
          item.classList.remove('active');
        });
        button.classList.add('active');
        applyState().catch(function (error) {
          showInitError('No pudimos aplicar el metal', error);
        });
      });
    });
  }

  function animate() {
    engine.runRenderLoop(function () {
      tick += 0.005;

      if (ringRoot) {
        ringRoot.position.x = ringBasePosition.x;
        ringRoot.position.z = ringBasePosition.z;
        ringRoot.position.y = ringBasePosition.y + Math.sin(tick) * 0.015;
      }

      if (shadowGround) {
        syncShadowGround();
      }

      if (autoRotateEnabled && camera) {
        camera.alpha += 0.0032;
      }

      scene.render();
    });
  }

  function resize() {
    if (!engine) return;
    engine.resize();
  }

  function initUi() {
    buildOptions('bandas', optionContainers.bandas);
    buildOptions('engastes', optionContainers.engastes);
    buildOptions('piedras', optionContainers.piedras);
    syncOptionButtons();
    initMetalButtons();

    caratSlider.addEventListener('input', function () {
      state.carat = Number(caratSlider.value) / 10;
      caratDisplay.textContent = state.carat.toFixed(1) + ' ct';
      updateSliderBackground();
      applyState().catch(function (error) {
        showInitError('No pudimos actualizar el quilataje', error);
      });
    });

    quoteButton.addEventListener('click', updateQuote);
    resetViewButton.addEventListener('click', function () {
      frameSelection();
    });
    canvas.addEventListener('dblclick', frameSelection);
  }

  function initEngine() {
    if (!window.BABYLON) {
      throw new Error('BabylonJS no cargo en el navegador');
    }

    engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
      disableWebGL2Support: false
    });
  }

  function init() {
    initUi();
    updateSliderBackground();
    updateSummary();
    initEngine();
    createScene();

    return loadSelection().then(function () {
      animate();
      window.addEventListener('resize', resize);
    });
  }

  window.addEventListener('error', function (event) {
    showInitError('Error de render Babylon', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', function (event) {
    showInitError('Error interno Babylon', event.reason);
  });

  try {
    init().catch(function (error) {
      showInitError('No pudimos iniciar el configurador', error);
    });
  } catch (error) {
    showInitError('No pudimos iniciar el configurador', error);
  }
}());
