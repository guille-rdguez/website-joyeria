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
        transform: { scale: 0.1, rotation: [0, 0, 0], position: [0, 0, 0] }
      },
      {
        id: 'engaste-leaf',
        label: 'Leaf Organico',
        caption: 'Nuevo',
        price: 420,
        file: './assets/models/engastes/engaste-leaf.glb',
        transform: { scale: 0.1, rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }
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
  renderer.toneMappingExposure = 0.96;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8d1c7);

  var camera = new THREE.PerspectiveCamera(32, 1, 0.01, 500);
  var controls = new THREE.OrbitControls(camera, canvas);
  var ringGroup = new THREE.Group();
  scene.add(ringGroup);

  var shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.16 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, -1.28, 0);
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  var pmrem = new THREE.PMREMGenerator(renderer);
  var envScene = new THREE.Scene();
  [
    [[70, 10, 20], 0xd8cec1],
    [[-70, 14, -18], 0xc3ced8],
    [[0, 80, 18], 0xf7f5f1],
    [[0, -70, 0], 0x262220],
    [[0, 8, 70], 0xbcae9d],
    [[0, 0, -70], 0x6f6459]
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

  scene.add(new THREE.AmbientLight(0xf7f2ea, 0.14));
  scene.add(new THREE.HemisphereLight(0xf5f3ef, 0x8f8173, 0.24));

  var key = new THREE.DirectionalLight(0xfff4e8, 1.6);
  key.position.set(18, 34, 28);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 200;
  key.shadow.camera.left = -30;
  key.shadow.camera.right = 30;
  key.shadow.camera.top = 30;
  key.shadow.camera.bottom = -30;
  key.shadow.bias = -0.0005;
  scene.add(key);

  var fill = new THREE.DirectionalLight(0xd6dee8, 0.32);
  fill.position.set(-24, 10, -18);
  scene.add(fill);

  var rim = new THREE.PointLight(0xe7d5b0, 0.7, 120);
  rim.position.set(22, 10, -26);
  scene.add(rim);

  var top = new THREE.PointLight(0xffffff, 0.38, 90);
  top.position.set(0, 48, 8);
  scene.add(top);

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

  function makeDiamondMat() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      envMapIntensity: 2.4,
      transmission: 0.22,
      thickness: 0.42,
      ior: 2.15,
      reflectivity: 1,
      clearcoat: 0.28,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide
    });
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

  function applyTransform(object, option, category) {
    var transform = option.transform || {};
    var scale = transform.scale || 0.1;
    var rotation = transform.rotation || [0, 0, 0];
    var position = transform.position || [0, 0, 0];

    object.scale.setScalar(scale);
    object.rotation.set(rotation[0], rotation[1], rotation[2]);
    object.position.set(position[0], position[1], position[2]);

    if (category === 'piedras') {
      var caratScale = scale - 0.02 + state.carat * 0.02;
      object.scale.setScalar(caratScale);
      object.position.y = position[1] + (transform.anchorBottom || 10.7) * (scale - caratScale);
    }
  }

  function applyState() {
    if (!currentMeshes.banda || !currentMeshes.engaste || !currentMeshes.piedra) return;

    var metalConfig = METAL[state.metal];
    var metalMaterial = makeMetalMat(metalConfig);
    applyMaterial(currentMeshes.banda, metalMaterial, true);
    applyMaterial(currentMeshes.engaste, metalMaterial, true);

    currentMeshes.piedra.traverse(function (child) {
      if (!child.isMesh) return;
      child.material = makeDiamondMat();
      child.castShadow = true;
      child.receiveShadow = false;
    });

    applyTransform(currentMeshes.banda, selectedOption('bandas'), 'bandas');
    applyTransform(currentMeshes.engaste, selectedOption('engastes'), 'engastes');
    applyTransform(currentMeshes.piedra, selectedOption('piedras'), 'piedras');

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
    renderer.setSize(parent.clientWidth, parent.clientHeight, false);
    camera.aspect = parent.clientWidth / parent.clientHeight;
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
    renderer.render(scene, camera);
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
