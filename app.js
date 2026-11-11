/**
 * CECiD - Centro de Estudiantes de Analista Universitario en Ciencias de Datos (UNLu)
 * Interactive logic: Data Network Canvas, Interactive Map & Campus, Digital Library, Study Plan, Modals, Forms
 */

document.addEventListener('DOMContentLoaded', () => {
  initNetworkCanvas();
  initInteractiveMap();
  initCampusCroquis();
  initBibliotecaDigital();
  initPlanDeEstudios();
  initModals();
  initContactForm();
  initSupabaseBlog();
  initBlogComments();
  initHomeNews();
  initSupabaseTeam();
  initSupabaseProposals();
  initSupabaseEvents();
  initSocialTools();
  initMobileMenu();
  initScrollSpy();
});

async function supabaseRequest(table, { method = 'GET', query = '', body = null } = {}) {
  const config = window.CECID_SUPABASE_CONFIG;
  if (!config || !config.url || !config.publishableKey) {
    throw new Error('Falta la configuración pública de Supabase.');
  }

  if (!/^[a-z_]+$/.test(table)) {
    throw new Error('Nombre de tabla no válido.');
  }

  const response = await fetch(`${config.url}/rest/v1/${table}${query ? `?${query}` : ''}`, {
    method,
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${config.publishableKey}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=minimal' : 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase respondió ${response.status}: ${detail}`);
  }

  if (response.status === 204 || method === 'POST') return null;
  return response.json();
}

function setSupabaseStatus(target, message, state = 'info') {
  if (!target) return;
  target.textContent = message;
  target.className = `supabase-status ${state}`;
}

function showSupabaseError(target, context, error) {
  console.error(`${context}:`, error);
  setSupabaseStatus(
    target,
    'No se pudo conectar con Supabase. Verificá que las tablas y políticas RLS estén configuradas y que la página se abra desde un servidor web.',
    'error'
  );
}

function safeExternalUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

/* ==========================================================================
   1. Interactive Data Science Network Canvas (Connected Nodes)
   ========================================================================== */
function initNetworkCanvas() {
  const canvas = document.getElementById('data-network-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const nodeCount = Math.floor((width * height) / 22000);
  const nodes = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2 + 1.5,
      alpha: Math.random() * 0.5 + 0.3,
    });
  }

  let mouse = { x: null, y: null, maxDist: 150 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 210, 106, ${n.alpha})`;
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n.x - n2.x;
        const dy = n.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          const lineAlpha = (1 - dist / 110) * 0.18;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      if (mouse.x !== null && mouse.y !== null) {
        const mdx = n.x - mouse.x;
        const mdy = n.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < mouse.maxDist) {
          const mAlpha = (1 - mdist / mouse.maxDist) * 0.35;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 210, 106, ${mAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   2. Mapa Interactivo de la UNLu & Sedes (Leaflet)
   ========================================================================== */
const SEDES_DATA = {
  'lujan': {
    name: 'Sede Central Luján',
    tag: 'Sede Central',
    coords: [-34.5802, -59.0838],
    zoom: 16,
    address: 'Cruce Rutas Nac. 5 y 7, Luján, Prov. de Buenos Aires',
    features: [
      'Cursada: Presencial & Semi-presencial (Híbrida)',
      'Atención CECiD: 10:00 hs — 18:00 hs (Hall Central)',
      'Infraestructura: Pabellón de Informática, Biblioteca Central, Comedor Universitario, Paradas de Colectivos'
    ],
    gmaps: 'https://maps.google.com/?q=Universidad+Nacional+de+Lujan'
  },
  'san-miguel': {
    name: 'Centro Regional San Miguel',
    tag: 'Centro Regional',
    coords: [-34.5422, -58.7186],
    zoom: 16,
    address: 'Fariña 111, San Miguel (Cursadas en el Colegio Máximo)',
    features: [
      'Cursada: Presencial y semi-presencial en aulas del Colegio Máximo',
      'Atención CECiD: 13:00 hs — 17:00 hs',
      'Infraestructura: Laboratorios de computación, salas de estudio y buffet'
    ],
    gmaps: 'https://maps.google.com/?q=UNLu+Centro+Regional+San+Miguel'
  },
  'chivilcoy': {
    name: 'Centro Regional Chivilcoy',
    tag: 'Centro Regional',
    coords: [-34.8973, -60.0167],
    zoom: 16,
    address: 'El Maestro y 9 de Julio, Chivilcoy, Prov. de Buenos Aires',
    features: [
      'Cursada: Presencial y evaluaciones de materias híbridas',
      'Atención CECiD: 14:00 hs — 18:00 hs',
      'Infraestructura: Aulas informatizadas, biblioteca regional y atención de alumnos'
    ],
    gmaps: 'https://maps.google.com/?q=Centro+Regional+Chivilcoy+UNLu'
  }
};

function initInteractiveMap() {
  const mapContainer = document.getElementById('unlu-interactive-map');
  if (!mapContainer || typeof L === 'undefined') return;

  const defaultSede = SEDES_DATA['lujan'];
  const map = L.map('unlu-interactive-map', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView(defaultSede.coords, 15);

  // Tile Layers sin bloqueos (CartoDB & Esri)
  const darkMatterLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  });

  const voyagerLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  });

  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

  // Agregar capa inicial (Dark Matter para coincidir con la estética del sitio)
  darkMatterLayer.addTo(map);

  // Control de capas para que el usuario elija estilo de mapa
  const baseMaps = {
    '🌙 Mapa Oscuro (Tech)': darkMatterLayer,
    '🗺️ Calles y Sedes (Voyager)': voyagerLayer,
    '🛰️ Satelital': satelliteLayer
  };
  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

  // Helper para crear pines estilizados con íconos temáticos
  function createPin(iconChar, bgColor = '#00d26a') {
    return L.divIcon({
      className: 'custom-campus-pin',
      html: `<div style="background: ${bgColor}; color: #0b111e; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.6); cursor: pointer; transition: transform 0.2s ease;">${iconChar}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32]
    });
  }

  // Marcadores de las Sedes y Puntos Clave
  const markers = {};

  // Sede Central Luján
  markers['lujan'] = L.marker(SEDES_DATA['lujan'].coords, { icon: createPin('🏛️', '#00d26a') }).addTo(map)
    .bindPopup('<h4>🏛️ UNLu Sede Central Luján</h4><p>Rutas 5 y 7. Pabellones de Informática y Ciencias Básicas.</p>');

  // Puntos del Campus Luján
  L.marker([-34.5808, -59.0844], { icon: createPin('💻', '#38bdf8') }).addTo(map)
    .bindPopup('<h4>💻 Pabellón de Informática</h4><p>Aulas de computación donde se cursa Ciencia de Datos.</p>');

  L.marker([-34.5798, -59.0835], { icon: createPin('🤝', '#4ade80') }).addTo(map)
    .bindPopup('<h4>🤝 Hall Central & CECiD</h4><p>Mesa de atención del Centro de Estudiantes.</p>');

  L.marker([-34.5803, -59.0828], { icon: createPin('📖', '#f59e0b') }).addTo(map)
    .bindPopup('<h4>📖 Biblioteca Central</h4><p>Salas de lectura, préstamos y biblioteca digital.</p>');

  L.marker([-34.5792, -59.0850], { icon: createPin('🚌', '#06b6d4') }).addTo(map)
    .bindPopup('<h4>🚌 Parada de Colectivos</h4><p>Líneas 57, 203, 350, 365 y locales.</p>');

  // Sede San Miguel
  markers['san-miguel'] = L.marker(SEDES_DATA['san-miguel'].coords, { icon: createPin('📍', '#38bdf8') }).addTo(map)
    .bindPopup('<h4>📍 UNLu Centro Regional San Miguel</h4><p>Fariña 111 (Colegio Máximo). Cursadas de Ciencia de Datos.</p>');

  // Sede Chivilcoy
  markers['chivilcoy'] = L.marker(SEDES_DATA['chivilcoy'].coords, { icon: createPin('📍', '#a855f7') }).addTo(map)
    .bindPopup('<h4>📍 UNLu Centro Regional Chivilcoy</h4><p>El Maestro y 9 de Julio.</p>');



  // Sede Chip Buttons
  const chipButtons = document.querySelectorAll('.btn-sede-chip');
  const overlayTag = document.getElementById('overlay-tag');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayAddress = document.getElementById('overlay-address');
  const overlayFeatures = document.getElementById('overlay-features');
  const overlayLink = document.getElementById('overlay-gmaps-link');

  function updateOverlay(sede) {
    if (!sede || !overlayTitle) return;
    overlayTag.textContent = sede.tag;
    overlayTitle.textContent = sede.name;
    overlayAddress.textContent = sede.address;
    overlayFeatures.innerHTML = sede.features.map((f) => `<div>• ${f}</div>`).join('');
    if (overlayLink) overlayLink.setAttribute('href', sede.gmaps);
  }

  chipButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      chipButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const sedeId = btn.dataset.sedeId;

      if (sedeId === 'todas') {
        const group = new L.featureGroup([markers['lujan'], markers['san-miguel'], markers['chivilcoy']]);
        map.fitBounds(group.getBounds().pad(0.2));
        if (overlayTitle) {
          overlayTag.textContent = 'Red Regional UNLu';
          overlayTitle.textContent = '3 Sedes Universitarias';
          overlayAddress.textContent = 'Luján (Central) • San Miguel • Chivilcoy';
          overlayFeatures.innerHTML = `
            <div>• Cursadas distribuidas en el corredor oeste y norte bonaerense.</div>
            <div>• Todas las sedes cuentan con acceso a SIU Guaraní y Campus Virtual.</div>
          `;
        }
      } else if (SEDES_DATA[sedeId]) {
        const target = SEDES_DATA[sedeId];
        map.flyTo(target.coords, target.zoom, { duration: 1.2 });
        markers[sedeId].openPopup();
        updateOverlay(target);
      }
    });
  });

  // Tab View Switcher (Leaflet Map vs Campus Croquis)
  const tabBtnSedes = document.getElementById('tab-btn-sedes');
  const tabBtnCampus = document.getElementById('tab-btn-campus');
  const mapWrapper = document.getElementById('leaflet-map-wrapper');
  const croquisWrapper = document.getElementById('campus-croquis-wrapper');
  const sedeButtonsContainer = document.getElementById('sede-buttons-container');

  if (tabBtnSedes && tabBtnCampus) {
    tabBtnSedes.addEventListener('click', () => {
      tabBtnSedes.classList.add('active');
      tabBtnCampus.classList.remove('active');
      if (mapWrapper) mapWrapper.classList.remove('hidden');
      if (croquisWrapper) croquisWrapper.classList.add('hidden');
      if (sedeButtonsContainer) sedeButtonsContainer.style.display = 'flex';
      setTimeout(() => map.invalidateSize(), 200);
    });

    tabBtnCampus.addEventListener('click', () => {
      tabBtnCampus.classList.add('active');
      tabBtnSedes.classList.remove('active');
      if (mapWrapper) mapWrapper.classList.add('hidden');
      if (croquisWrapper) croquisWrapper.classList.remove('hidden');
      if (sedeButtonsContainer) sedeButtonsContainer.style.display = 'none';
    });
  }
}

/* ==========================================================================
   3. Croquis Interactivo del Campus Luján
   ========================================================================== */
const CAMPUS_ZONES = {
  'labs': {
    tag: 'Sector Académico Clave',
    title: 'Pabellón de Informática & Laboratorios de Datos',
    desc: 'Aquí se desarrollan las clases prácticas de Introducción a la Programación, Laboratorio de Ciencias de Datos, Bases de Datos y Machine Learning. Cuenta con computadoras equipadas con entornos de desarrollo en Python, R y Jupyter Notebooks.',
    meta: [
      'Turnos: Mañana, Tarde y Noche',
      'Conectividad: WiFi Universitario libre (Red UNLu Estudiantes)',
      'Equipamiento: Servidores locales y PCs con Linux/Windows'
    ]
  },
  'hall': {
    tag: 'Punto de Encuentro y Gestión',
    title: 'Hall Central & Mesa del CECiD',
    desc: 'Espacio principal de tránsito estudiantil donde funciona la mesa de atención del Centro de Estudiantes de Ciencias de Datos. Acercate para consultar dudas de inscripción, retirar material de estudio impreso o charlar con las autoridades del Centro.',
    meta: [
      'Horario de Atención: 10:00 a 18:00 hs',
      'Servicios: Asesoría de trámites, reclamos de cupos y canal de sugerencias'
    ]
  },
  'biblio': {
    tag: 'Estudio y Recursos',
    title: 'Biblioteca Central UNLu',
    desc: 'Edificio dedicado al estudio silencioso, salas grupales con conexión eléctrica para notebooks y acceso al repositorio bibliográfico físico e institucional de la universidad.',
    meta: [
      'Horario: Lunes a Viernes de 8:00 a 20:00 hs',
      'Servicios: Préstamo de libros de matemática, estadística y computación'
    ]
  },
  'comedor': {
    tag: 'Bienestar Estudiantil',
    title: 'Comedor Universitario & Centro de Copiado',
    desc: 'Punto de descanso y almuerzo para estudiantes y docentes con menú accesible. Al lado funciona el servicio de fotocopiadora y apuntes del campus.',
    meta: [
      'Horarios: Almuerzo y merienda',
      'Beneficios: Descuentos para estudiantes regulares'
    ]
  },
  'depto': {
    tag: 'Administración y Docencia',
    title: 'Departamento de Ciencias Básicas & Alumnos',
    desc: 'Sede administrativa de los departamentos docentes donde se gestionan las comisiones de la carrera, equivalencias, actas de examen y certificados de alumno regular.',
    meta: [
      'Gestión: Departamento de Ciencias Básicas UNLu',
      'Trámites: Homologaciones y mesas de examen'
    ]
  },
  'acceso': {
    tag: 'Ingreso & Transporte',
    title: 'Acceso Principal & Paradas de Colectivos',
    desc: 'Entrada principal sobre Ruta Nacional 5 y Ruta 7. Aquí descienden y parten todas las líneas de transporte hacia Moreno, Once, Palermo, Pilar, San Miguel y Mercedes.',
    meta: [
      'Líneas: 57, 203, 350, 365, 410, 500, 501',
      'Seguridad: Acceso peatonal iluminado y garitas de espera'
    ]
  }
};

function initCampusCroquis() {
  const zoneBoxes = document.querySelectorAll('.campus-zone-box');
  const detailTag = document.getElementById('detail-tag');
  const detailTitle = document.getElementById('detail-title');
  const detailDesc = document.getElementById('detail-desc');
  const detailMeta = document.getElementById('detail-meta');

  if (!zoneBoxes.length || !detailTitle) return;

  zoneBoxes.forEach((box) => {
    box.addEventListener('click', () => {
      zoneBoxes.forEach((b) => b.classList.remove('active-zone'));
      box.classList.add('active-zone');

      const zoneKey = box.dataset.zone;
      const zoneData = CAMPUS_ZONES[zoneKey];

      if (zoneData) {
        detailTag.textContent = zoneData.tag;
        detailTitle.textContent = zoneData.title;
        detailDesc.textContent = zoneData.desc;
        detailMeta.innerHTML = zoneData.meta.map((m) => `<div>• <strong>${m.split(':')[0]}:</strong>${m.split(':')[1] || ''}</div>`).join('');
      }
    });
  });
}

/* ==========================================================================
   4. Biblioteca Digital Abierta & Materiales de Estudio
   ========================================================================== */
const DEFAULT_RESOURCES = [
  {
    id: 'res-1',
    category: 'apuntes',
    categoryLabel: 'Apunte',
    format: 'PDF • 4.2 MB',
    materia: '11271 • Introducción a la Programación',
    title: 'Fundamentos de Algoritmos y Sintaxis Python',
    desc: 'Guía introductoria completa: variables, estructuras de control (if, for, while), funciones y primeros scripts en Python.',
    author: 'Aportado por Sec. Académica CECiD',
    link: '#'
  },
  {
    id: 'res-2',
    category: 'guias',
    categoryLabel: 'Guía Resuelta',
    format: 'PDF • 2.8 MB',
    materia: '13014 • Matemática Básica',
    title: 'Guía Práctica N° 1 y 2: Conjuntos, Ecuaciones e Inecuaciones',
    desc: 'Ejercicios tipo parcial resueltos paso a paso con explicaciones metodológicas para afianzar la base algebraica inicial.',
    author: 'Colaboración Estudiantil UNLu',
    link: '#'
  },
  {
    id: 'res-3',
    category: 'cheatsheets',
    categoryLabel: 'Cheat Sheet',
    format: 'PDF / Markdown',
    materia: '11282 • Lab. de Ciencias de Datos',
    title: 'Cheat Sheet: Pandas & Manipulación de DataFrames',
    desc: 'Resumen ultrarrápido de funciones: .loc, .iloc, groupby, merge, manejo de valores nulos y operaciones estadísticas.',
    author: 'Comunidad CECiD',
    link: '#'
  },
  {
    id: 'res-4',
    category: 'apuntes',
    categoryLabel: 'Apunte Teórico',
    format: 'PDF • 5.1 MB',
    materia: '13021 • Álgebra Lineal y Geometría',
    title: 'Espacios Vectoriales, Matrices y Transformaciones Lineales',
    desc: 'Resumen orientado a ciencias de datos: operaciones matriciales, determinantes, autovalores y autovectores.',
    author: 'Tutorías CECiD',
    link: '#'
  },
  {
    id: 'res-5',
    category: 'examenes',
    categoryLabel: 'Parcial Modelo',
    format: 'PDF • 1.4 MB',
    materia: '11274 • Programación Estructurada',
    title: 'Modelo de 1° Parcial Resuelto y Comentado',
    desc: 'Enunciados de exámenes anteriores resueltos con modularización de código, manejo de punteros y buenas prácticas.',
    author: 'Estudiantes Avanzados',
    link: '#'
  },
  {
    id: 'res-6',
    category: 'cheatsheets',
    categoryLabel: 'Cheat Sheet',
    format: 'PDF • 1.9 MB',
    materia: '11277 • Bases de Datos Relacionales',
    title: 'SQL Cheat Sheet: Queries, JOINs y Normalización',
    desc: 'Chuleta de sintaxis: SELECT, INNER/LEFT JOIN, subqueries, índices y diseño de esquemas en PostgreSQL/MySQL.',
    author: 'Sec. Académica CECiD',
    link: '#'
  },
  {
    id: 'res-7',
    category: 'cheatsheets',
    categoryLabel: 'Cheat Sheet',
    format: 'PDF • 3.5 MB',
    materia: '11283 • Aprendizaje Automático (ML)',
    title: 'Pipeline de Scikit-Learn y Métricas de Clasificación/Regresión',
    desc: 'Guía de referencia rápida: Preprocesamiento, Train/Test Split, Regresión Lineal, Árboles, Random Forest, Matriz de Confusión y ROC-AUC.',
    author: 'Taller Extracurricular CECiD',
    link: '#'
  },
  {
    id: 'res-8',
    category: 'propuestas',
    categoryLabel: 'Propuesta CECiD',
    format: 'Documento Oficial',
    materia: 'Gestión Estudiantil 2024-2026',
    title: 'Plan Integral de Talleres, Tutorías y Proyectos CECiD',
    desc: 'Documento con las propuestas aprobadas: calendario de talleres extracurriculares, red de tutorías pares y creación de la hackathon.',
    author: 'Comisión Directiva CECiD',
    link: '#'
  },
  {
    id: 'res-9',
    category: 'apuntes',
    categoryLabel: 'Apunte',
    format: 'PDF • 3.1 MB',
    materia: '11275 • Estructuras de Datos y Algoritmos I',
    title: 'Complejidad Algorítmica (Big O), Listas Enlazadas, Pilas y Colas',
    desc: 'Conceptos fundamentales de análisis de algoritmos con implementaciones prácticas y visualizaciones paso a paso.',
    author: 'Aporte de Alumnos',
    link: '#'
  },
  {
    id: 'res-10',
    category: 'guias',
    categoryLabel: 'Guía Resuelta',
    format: 'PDF • 2.6 MB',
    materia: '11083 • Estadística y Probabilidad',
    title: 'Guía Práctica de Distribuciones de Probabilidad y Tests de Hipótesis',
    desc: 'Ejercicios explicados de probabilidad condicional, Teorema de Bayes, distribución Normal, Binomial y Test t de Student.',
    author: 'Sec. Académica CECiD',
    link: '#'
  }
];

function initBibliotecaDigital() {
  const grid = document.getElementById('library-grid');
  const searchInput = document.getElementById('library-search-input');
  const filterBtns = document.querySelectorAll('.library-category-filters .lib-filter-btn');

  if (!grid) return;

  let allResources = [...DEFAULT_RESOURCES];

  let currentCategory = 'all';
  let searchTerm = '';

  function render() {
    grid.innerHTML = '';

    const filtered = allResources.filter((item) => {
      const matchCategory = currentCategory === 'all' || item.category === currentCategory;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.desc.toLowerCase().includes(term) ||
        item.materia.toLowerCase().includes(term) ||
        item.categoryLabel.toLowerCase().includes(term);

      return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 0.5rem;">🔍 No se encontraron materiales que coincidan con tu búsqueda.</p>
          <p style="font-size: 0.85rem; color: var(--text-dim);">Probá buscando por materia (ej: Python, Álgebra, SQL) o aportá el primer material de este tema.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'resource-card';

      card.innerHTML = `
        <div>
          <div class="resource-header">
            <span class="resource-type-badge type-${escapeHtml(item.category)}">${escapeHtml(item.categoryLabel)}</span>
            <span class="resource-format-tag">${escapeHtml(item.format)}</span>
          </div>
          <p class="resource-materia">${escapeHtml(item.materia)}</p>
          <h4 class="resource-title">${escapeHtml(item.title)}</h4>
          <p class="resource-desc">${escapeHtml(item.desc)}</p>
        </div>
        <div class="resource-footer">
          <span class="resource-author">${escapeHtml(item.author)}</span>
          <button class="btn-download-resource" data-id="${item.id}">
            <span>Consultar material</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      `;

      const downloadBtn = card.querySelector('.btn-download-resource');
      const resourceUrl = safeExternalUrl(item.link);
      if (resourceUrl) downloadBtn.textContent = 'Abrir material';
      downloadBtn.addEventListener('click', () => {
        if (resourceUrl) {
          window.open(resourceUrl, '_blank', 'noopener,noreferrer');
        } else {
          alert(`"${item.title}"\n\nPara consultar este recurso, escribinos a cecid.unlu@gmail.com o a través del Discord oficial.`);
        }
      });

      grid.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      render();
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      render();
    });
  });

  render();

  async function loadResources() {
    const status = document.querySelector('[data-supabase-status]');
    try {
      const rows = await supabaseRequest('resources', {
        query: new URLSearchParams({
          select: 'id,title,description,category,subject,author,format,file_url,link_url',
          is_published: 'eq.true',
          order: 'created_at.desc'
        }).toString()
      });
      if (!rows.length) {
        setSupabaseStatus(status, 'Supabase está conectada; se muestran los materiales actuales hasta que publiques recursos desde el panel.', 'info');
        return;
      }

      const categoryLabels = {
        apuntes: 'Apunte',
        guias: 'Guía Resuelta',
        examenes: 'Examen / Parcial',
        cheatsheets: 'Cheat Sheet',
        propuestas: 'Propuesta CECiD',
        libros: 'Bibliografía'
      };
      allResources = rows.map((row) => ({
        id: row.id,
        category: categoryLabels[row.category] ? row.category : 'apuntes',
        categoryLabel: categoryLabels[row.category] || 'Material',
        format: row.format || 'Recurso digital',
        materia: row.subject || '',
        title: row.title,
        desc: row.description || '',
        author: row.author || 'Comunidad CECiD',
        link: row.file_url || row.link_url || ''
      }));
      setSupabaseStatus(status, 'Biblioteca conectada con Supabase.', 'success');
    } catch (error) {
      showSupabaseError(status, 'No se pudo cargar la biblioteca', error);
    }
    render();
  }

  loadResources();
}

/* ==========================================================================
   5. Plan de Estudios Interactivo (Plan 20.01 UNLu)
   ========================================================================== */
const PLAN_DATA = [
  { code: '19054', name: 'Competencias Básicas en Informática', cuatri: 'prev', cuatriLabel: 'Requisito de Acreditación', correlativas: [] },
  { code: '39553', name: 'Competencias Básicas en Idioma Inglés', cuatri: 'prev', cuatriLabel: 'Requisito de Acreditación', correlativas: [] },
  { code: '11271', name: 'Introducción a la Programación', cuatri: '1', cuatriLabel: '1º Cuatrimestre', correlativas: [] },
  { code: '11280', name: 'Organización de la Información', cuatri: '1', cuatriLabel: '1º Cuatrimestre', correlativas: [] },
  { code: '13014', name: 'Matemática Básica', cuatri: '1', cuatriLabel: '1º Cuatrimestre', correlativas: [] },
  { code: '11281', name: 'Introducción a las Ciencias de Datos', cuatri: '2', cuatriLabel: '2º Cuatrimestre', correlativas: ['11271'] },
  { code: '11274', name: 'Programación Estructurada', cuatri: '2', cuatriLabel: '2º Cuatrimestre', correlativas: ['11271'] },
  { code: '13022', name: 'Análisis Matemático I', cuatri: '2', cuatriLabel: '2º Cuatrimestre', correlativas: ['13014'] },
  { code: '13021', name: 'Álgebra Lineal y Geometría', cuatri: '2', cuatriLabel: '2º Cuatrimestre', correlativas: ['13014'] },
  { code: '11282', name: 'Laboratorio de Ciencias de Datos', cuatri: '3', cuatriLabel: '3º Cuatrimestre', correlativas: ['11281', '19054', '39553'] },
  { code: '11275', name: 'Estructuras de Datos y Algoritmos I', cuatri: '3', cuatriLabel: '3º Cuatrimestre', correlativas: ['11274', '19054', '39553'] },
  { code: '11083', name: 'Estadística y Probabilidad', cuatri: '3', cuatriLabel: '3º Cuatrimestre', correlativas: ['13022', '19054', '39553'] },
  { code: '11283', name: 'Aprendizaje Automático (Machine Learning)', cuatri: '4', cuatriLabel: '4º Cuatrimestre', correlativas: ['11282'] },
  { code: '11276', name: 'Programación Orientada a Objetos', cuatri: '4', cuatriLabel: '4º Cuatrimestre', correlativas: ['11274'] },
  { code: '41407', name: 'Organización de Computadoras', cuatri: '4', cuatriLabel: '4º Cuatrimestre', correlativas: ['11281'] },
  { code: '11277', name: 'Bases de Datos Relacionales', cuatri: '4', cuatriLabel: '4º Cuatrimestre', correlativas: ['11274'] },
  { code: '21279', name: 'Gestión de Soluciones Innovadoras', cuatri: '5', cuatriLabel: '5º Cuatrimestre', correlativas: ['11283', '11277'] },
  { code: '11278', name: 'Bases de Datos Distribuidas', cuatri: '5', cuatriLabel: '5º Cuatrimestre', correlativas: ['11277'] },
  { code: '11285', name: 'Proyecto Integrador de Ciencias de Datos', cuatri: '5', cuatriLabel: '5º Cuatrimestre', correlativas: ['11283', '11277'] }
];

function initPlanDeEstudios() {
  const grid = document.getElementById('subjects-grid');
  const progressPercentEl = document.getElementById('progress-percent');
  const progressCountEl = document.getElementById('progress-count');
  const progressBarEl = document.getElementById('progress-bar-fill');
  const filterBtns = document.querySelectorAll('.cuatri-filters .filter-btn');
  const resetBtn = document.getElementById('btn-reset-plan');

  if (!grid) return;

  let approvedSet = new Set(JSON.parse(localStorage.getItem('cecid_aprobadas') || '[]'));
  let currentFilter = 'all';

  function render() {
    grid.innerHTML = '';

    const filteredSubjects = PLAN_DATA.filter((s) => {
      if (currentFilter === 'all') return true;
      return s.cuatri === currentFilter;
    });

    filteredSubjects.forEach((subject) => {
      const isApproved = approvedSet.has(subject.code);
      const isAvailable = !isApproved && subject.correlativas.every((c) => approvedSet.has(c));
      const isLocked = !isApproved && !isAvailable;

      let statusClass = 'locked';
      let statusText = 'Bloqueada por correlativas';

      if (isApproved) {
        statusClass = 'approved';
        statusText = 'Aprobada';
      } else if (isAvailable) {
        statusClass = 'available';
        statusText = 'Habilitada para cursar';
      }

      const correlativasText = subject.correlativas.length
        ? 'Correlativas: ' +
          subject.correlativas
            .map((cCode) => {
              const match = PLAN_DATA.find((p) => p.code === cCode);
              const isMet = approvedSet.has(cCode);
              return `${match ? match.name : cCode} ${isMet ? '✓' : '✗'}`;
            })
            .join(', ')
        : 'Sin correlativas previas';

      const card = document.createElement('div');
      card.className = `subject-card ${statusClass}`;
      card.setAttribute('role', 'checkbox');
      card.setAttribute('aria-checked', isApproved ? 'true' : 'false');
      card.setAttribute('tabindex', '0');

      card.innerHTML = `
        <div>
          <div class="subject-top">
            <span class="subject-code">Cód. ${subject.code}</span>
            <div class="subject-checkbox" title="Marcar como aprobada"></div>
          </div>
          <h4 class="subject-name">${subject.name}</h4>
          <p class="subject-cuatri">${subject.cuatriLabel}</p>
        </div>
        <div>
          <div class="subject-correlatives">${correlativasText}</div>
          <span class="subject-status-badge">${statusText}</span>
        </div>
      `;

      const toggle = () => {
        if (approvedSet.has(subject.code)) {
          approvedSet.delete(subject.code);
        } else {
          approvedSet.add(subject.code);
        }
        localStorage.setItem('cecid_aprobadas', JSON.stringify([...approvedSet]));
        render();
        updateProgress();
      };

      card.addEventListener('click', toggle);
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      });

      grid.appendChild(card);
    });

    updateProgress();
  }

  function updateProgress() {
    const total = PLAN_DATA.length;
    const approvedCount = approvedSet.size;
    const percent = Math.round((approvedCount / total) * 100);

    if (progressCountEl) progressCountEl.textContent = approvedCount;
    if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('¿Querés reiniciar la selección de materias aprobadas?')) {
        approvedSet.clear();
        localStorage.removeItem('cecid_aprobadas');
        render();
      }
    });
  }

  render();
}

/* ==========================================================================
   6. Modals (Folleto & Aportar Material)
   ========================================================================== */
function initModals() {
  const modalFolleto = document.getElementById('modal-folleto');
  const openFolletoBtn = document.getElementById('btn-ver-folleto');
  const closeFolletoBtn = document.getElementById('modal-close');
  const closeFolletoSecBtn = document.getElementById('btn-modal-cerrar');
  const backdropFolleto = document.getElementById('modal-backdrop');

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (openFolletoBtn) openFolletoBtn.addEventListener('click', () => openModal(modalFolleto));
  if (closeFolletoBtn) closeFolletoBtn.addEventListener('click', () => closeModal(modalFolleto));
  if (closeFolletoSecBtn) closeFolletoSecBtn.addEventListener('click', () => closeModal(modalFolleto));
  if (backdropFolleto) backdropFolleto.addEventListener('click', () => closeModal(modalFolleto));

  const modalAportar = document.getElementById('modal-aportar');
  const openAportarBtn = document.getElementById('btn-aportar-material');
  const closeAportarBtn = document.getElementById('modal-aportar-close');
  const backdropAportar = document.getElementById('modal-aportar-backdrop');
  const aportarForm = document.getElementById('aportar-form');
  const aportarFeedback = document.getElementById('aportar-feedback');

  if (openAportarBtn) openAportarBtn.addEventListener('click', () => openModal(modalAportar));
  if (closeAportarBtn) closeAportarBtn.addEventListener('click', () => closeModal(modalAportar));
  if (backdropAportar) backdropAportar.addEventListener('click', () => closeModal(modalAportar));

  if (aportarForm) {
    aportarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const materiaName = document.getElementById('aportar-materia')?.selectedOptions[0]?.text;
      const tipo = document.getElementById('aportar-tipo')?.value;
      const titulo = document.getElementById('aportar-titulo')?.value.trim();
      const enlace = document.getElementById('aportar-enlace')?.value.trim();
      const autor = document.getElementById('aportar-autor')?.value.trim() || 'Estudiante anónimo';
      const consentimiento = document.getElementById('aportar-consentimiento');
      const submitButton = aportarForm.querySelector('[type="submit"]');

      if (!titulo) {
        if (aportarFeedback) {
          aportarFeedback.textContent = 'Por favor ingresá al menos el título de tu apunte.';
          aportarFeedback.className = 'form-feedback error';
          aportarFeedback.classList.remove('hidden');
        }
        return;
      }

      if (!consentimiento?.checked) {
        aportarFeedback.textContent = 'Confirmá que tenés autorización para compartir el material y aceptás su revisión antes de enviarlo.';
        aportarFeedback.className = 'form-feedback error';
        aportarFeedback.classList.remove('hidden');
        return;
      }

      if (enlace && !safeExternalUrl(enlace)) {
        aportarFeedback.textContent = 'Ingresá un enlace web válido o dejá ese campo vacío.';
        aportarFeedback.className = 'form-feedback error';
        aportarFeedback.classList.remove('hidden');
        return;
      }

      if (submitButton) submitButton.disabled = true;
      try {
        await supabaseRequest('resource_submissions', {
          method: 'POST',
          body: {
            subject: materiaName || '',
            category: tipo || '',
            title: titulo,
            link_url: enlace || null,
            submitter_name: autor
          }
        });

        aportarFeedback.textContent = '¡Gracias! Tu aporte se envió al CECiD y quedará pendiente de revisión antes de publicarse.';
        aportarFeedback.className = 'form-feedback success';
        aportarFeedback.classList.remove('hidden');
        aportarForm.reset();
        setTimeout(() => closeModal(modalAportar), 3000);
      } catch (error) {
        console.error('No se pudo enviar el aporte de biblioteca:', error);
        aportarFeedback.textContent = 'No se pudo enviar tu aporte. Probá nuevamente más tarde o escribinos por correo.';
        aportarFeedback.className = 'form-feedback error';
        aportarFeedback.classList.remove('hidden');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(modalFolleto);
      closeModal(modalAportar);
    }
  });
}

/* ==========================================================================
   7. Formulario de Contacto / Buzón Estudiantil
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');

  if (!form || !feedback) return;

  const topicSelect = document.getElementById('form-tipo');
  const verificationFields = document.getElementById('student-verification-fields');
  const legajoInput = document.getElementById('form-legajo');
  const dniInput = document.getElementById('form-dni');
  const verificationConsent = document.getElementById('student-verification-consent');

  const updateVerificationFields = () => {
    const isVerificationRequest = topicSelect?.value === 'verificacion';
    if (verificationFields) verificationFields.hidden = !isVerificationRequest;
    if (legajoInput) legajoInput.required = isVerificationRequest;
    if (dniInput) dniInput.required = isVerificationRequest;
    if (verificationConsent) verificationConsent.required = isVerificationRequest;
  };

  if (topicSelect && new URLSearchParams(window.location.search).get('tema') === 'verificacion') {
    topicSelect.value = 'verificacion';
  }

  topicSelect?.addEventListener('change', updateVerificationFields);
  updateVerificationFields();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('form-nombre')?.value.trim();
    const apellido = document.getElementById('form-apellido')?.value.trim();
    const email = document.getElementById('form-email')?.value.trim();
    const sede = document.getElementById('form-sede')?.value;
    const tipo = topicSelect?.value;
    const mensaje = document.getElementById('form-mensaje')?.value.trim();
    const legajo = legajoInput?.value.trim();
    const dni = dniInput?.value.trim();
    const verificationRequested = tipo === 'verificacion';

    if (!nombre || !apellido || !email || !mensaje) {
      feedback.textContent = 'Completá nombre, apellido, correo electrónico y mensaje.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    if (nombre.length > 80 || apellido.length > 80 || email.length > 254 || mensaje.length > 5000) {
      feedback.textContent = 'Revisá los campos: nombre y apellido (máx. 80 caracteres), correo (máx. 254) y mensaje (máx. 5000).';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    if (verificationRequested && (!legajo || !dni || !verificationConsent?.checked)) {
      feedback.textContent = 'Para solicitar la verificación, completá tu legajo y DNI y autorizá su uso para el cotejo con el padrón.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    if (verificationRequested && (legajo.length > 30 || !/^\d{7,8}$/.test(dni))) {
      feedback.textContent = 'Ingresá un legajo de hasta 30 caracteres y un DNI de 7 u 8 números, sin puntos.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      await supabaseRequest('contact_messages', {
        method: 'POST',
        body: {
          name: nombre,
          surname: apellido,
          email,
          student_id: verificationRequested ? legajo : null,
          dni: verificationRequested ? dni : null,
          student_verification_status: verificationRequested ? 'pending' : 'not_requested',
          campus: sede || '',
          topic: tipo || '',
          message: mensaje
        }
      });

      feedback.textContent = '¡Mensaje recibido! Se guardó correctamente y el equipo del CECiD podrá revisarlo.';
      feedback.className = 'form-feedback success';
      feedback.classList.remove('hidden');
      form.reset();
      updateVerificationFields();
    } catch (error) {
      console.error('No se pudo guardar el mensaje de contacto:', error);
      feedback.textContent = 'No se pudo enviar el mensaje. Probá nuevamente más tarde o escribinos por correo.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

function initBlogComments() {
  const form = document.getElementById('blog-comment-form');
  const filter = document.getElementById('comments-post-filter');
  const list = document.getElementById('comments-list');
  const status = document.getElementById('comments-status');
  const feedback = document.getElementById('comment-feedback');

  if (!form || !filter || !list || !status || !feedback) return;

  async function loadComments() {
    try {
      const rows = await supabaseRequest('blog_comments', {
        query: new URLSearchParams({
          select: 'post_slug,display_name,body,author_type,created_at',
          post_slug: `eq.${filter.value}`,
          moderation_status: 'eq.approved',
          order: 'created_at.desc',
          limit: '50'
        }).toString()
      });

      rows.sort((a, b) => Number(b.author_type === 'student') - Number(a.author_type === 'student'));
      list.replaceChildren();

      if (!rows.length) {
        setSupabaseStatus(status, 'Todavía no hay comentarios publicados en este espacio.', 'info');
        return;
      }

      rows.forEach((comment) => {
        const card = document.createElement('article');
        card.className = 'comment-card';

        const header = document.createElement('div');
        header.className = 'comment-card-header';
        const name = document.createElement('h3');
        name.textContent = comment.display_name;
        header.append(name);

        if (comment.author_type === 'student') {
          const badge = document.createElement('span');
          badge.className = 'comment-student-badge';
          badge.textContent = 'Estudiante verificado';
          header.append(badge);
        }

        const body = document.createElement('p');
        body.textContent = comment.body;
        card.append(header, body);
        list.append(card);
      });

      setSupabaseStatus(status, 'Comentarios publicados; los comentarios de estudiantes verificados aparecen primero.', 'success');
    } catch (error) {
      showSupabaseError(status, 'No se pudieron cargar los comentarios', error);
    }
  }

  filter.addEventListener('change', loadComments);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('comment-name').value.trim();
    const postSlug = document.getElementById('comment-post').value;
    const body = document.getElementById('comment-body').value.trim();
    const consent = document.getElementById('comment-consent');

    if (!name || !body || !consent.checked) {
      feedback.textContent = 'Completá tu nombre o alias, el comentario y la autorización de publicación.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    if (name.length > 80 || body.length > 2000) {
      feedback.textContent = 'El nombre o alias admite hasta 80 caracteres y el comentario hasta 2000.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      await supabaseRequest('blog_comments', {
        method: 'POST',
        body: {
          post_slug: postSlug,
          display_name: name,
          body,
          author_type: 'public',
          moderation_status: 'pending'
        }
      });

      feedback.textContent = 'Gracias. Tu comentario quedó pendiente de revisión antes de publicarse.';
      feedback.className = 'form-feedback success';
      feedback.classList.remove('hidden');
      form.reset();
    } catch (error) {
      console.error('No se pudo enviar el comentario:', error);
      feedback.textContent = 'No se pudo enviar el comentario. Probá nuevamente más tarde.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  loadComments();
}

/* ==========================================================================
   8. Herramientas Sociales (Copiar Email)
   ========================================================================== */
function initSocialTools() {
  const copyBtn = document.getElementById('btn-copy-email');
  const copyText = document.getElementById('copy-text');
  const emailVal = 'cecid.unlu@gmail.com';

  if (!copyBtn || !copyText) return;

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailVal);
      copyText.textContent = '¡Copiado!';
      copyBtn.style.borderColor = 'var(--primary)';
      copyBtn.style.color = 'var(--primary)';
      setTimeout(() => {
        copyText.textContent = 'Copiar';
        copyBtn.style.borderColor = '';
        copyBtn.style.color = '';
      }, 2500);
    } catch (err) {
      prompt('Copiá el correo del CECiD:', emailVal);
    }
  });
}

/* ==========================================================================
   9. Mobile Menu & ScrollSpy
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (!toggle || !navMenu) return;

  const closeMenu = () => {
    navMenu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
  };

  toggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  });

  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!navMenu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });
}

function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach((section) => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

async function initSupabaseBlog() {
  const grid = document.querySelector('.blog-grid');
  const articles = document.querySelector('.blog-articles');
  if (!grid || !articles) return;

  const status = grid.parentElement.querySelector('[data-supabase-status]');
  try {
    const rows = await supabaseRequest('blog_posts', {
      query: new URLSearchParams({
        select: 'id,slug,title,excerpt,body,category,cover_url,published_at',
        is_published: 'eq.true',
        order: 'published_at.desc'
      }).toString()
    });

    addBlogCommentOptions(rows);

    if (!rows.length) {
      setSupabaseStatus(status, 'Supabase está conectada; se muestran los artículos actuales hasta que publiques entradas desde el panel.', 'info');
      return;
    }

    grid.replaceChildren();
    articles.replaceChildren();
    rows.forEach((post, index) => {
      const articleId = `post-${post.id}`;
      const card = document.createElement('article');
      card.className = `blog-card${index === 0 ? ' blog-card-featured' : ''}`;
      const visual = document.createElement('div');
      visual.className = `blog-card-visual${index % 2 ? ' blog-visual-data' : ' blog-visual-study'}`;
      visual.setAttribute('aria-hidden', 'true');
      const coverUrl = safeExternalUrl(post.cover_url);
      if (coverUrl) {
        const image = document.createElement('img');
        image.src = coverUrl;
        image.alt = '';
        visual.replaceChildren(image);
      } else {
        const number = document.createElement('span');
        number.textContent = String(index + 1).padStart(2, '0');
        visual.append(number);
      }

      const content = document.createElement('div');
      content.className = 'blog-card-content';
      const category = document.createElement('span');
      category.className = 'blog-category';
      category.textContent = post.category || 'Comunidad';
      const heading = document.createElement('h2');
      const titleLink = document.createElement('a');
      titleLink.href = `#${articleId}`;
      titleLink.textContent = post.title;
      heading.append(titleLink);
      const excerpt = document.createElement('p');
      excerpt.textContent = post.excerpt || '';
      const readLink = document.createElement('a');
      readLink.className = 'blog-read-link';
      readLink.href = `#${articleId}`;
      readLink.textContent = 'Leer artículo →';
      content.append(category, heading, excerpt, readLink);
      card.append(visual, content);
      grid.append(card);

      const fullArticle = document.createElement('article');
      fullArticle.className = 'blog-article';
      fullArticle.id = articleId;
      const articleCategory = document.createElement('span');
      articleCategory.className = 'blog-category';
      articleCategory.textContent = post.category || 'Comunidad';
      const articleTitle = document.createElement('h2');
      articleTitle.textContent = post.title;
      fullArticle.append(articleCategory, articleTitle);
      (post.body || post.excerpt || '')
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .forEach((paragraph) => {
          const element = document.createElement('p');
          element.textContent = paragraph;
          fullArticle.append(element);
        });
      articles.append(fullArticle);
    });

    setSupabaseStatus(status, 'Publicaciones cargadas desde Supabase.', 'success');
  } catch (error) {
    showSupabaseError(status, 'No se pudo cargar el blog', error);
  }
}

function addBlogCommentOptions(posts) {
  const selectors = [
    document.getElementById('comment-post'),
    document.getElementById('comments-post-filter')
  ].filter(Boolean);

  posts.forEach((post) => {
    if (!post.slug) return;

    selectors.forEach((selector) => {
      if (Array.from(selector.options).some((option) => option.value === post.slug)) return;
      const option = document.createElement('option');
      option.value = post.slug;
      option.textContent = post.title;
      selector.append(option);
    });
  });
}

async function initHomeNews() {
  const grid = document.querySelector('[data-home-news]');
  if (!grid) return;

  const status = document.querySelector('[data-home-news-status]');
  try {
    const rows = await supabaseRequest('blog_posts', {
      query: new URLSearchParams({
        select: 'id,title,excerpt,category,cover_url,published_at',
        is_published: 'eq.true',
        order: 'published_at.desc',
        limit: '3'
      }).toString()
    });

    grid.replaceChildren();
    if (!rows.length) {
      setSupabaseStatus(status, 'Todavía no hay publicaciones del blog para mostrar.', 'info');
      return;
    }

    rows.forEach((post, index) => {
      const card = document.createElement('article');
      card.className = 'blog-card home-news-card';

      const visual = document.createElement('div');
      visual.className = `blog-card-visual${index % 2 ? ' blog-visual-data' : ' blog-visual-study'}`;
      visual.setAttribute('aria-hidden', 'true');
      const coverUrl = safeExternalUrl(post.cover_url);
      if (coverUrl) {
        const image = document.createElement('img');
        image.src = coverUrl;
        image.alt = '';
        visual.append(image);
      } else {
        const number = document.createElement('span');
        number.textContent = String(index + 1).padStart(2, '0');
        visual.append(number);
      }

      const content = document.createElement('div');
      content.className = 'blog-card-content';
      const category = document.createElement('span');
      category.className = 'blog-category';
      category.textContent = post.category || 'Comunidad';
      const heading = document.createElement('h2');
      const titleLink = document.createElement('a');
      titleLink.href = `blog.html#post-${encodeURIComponent(post.id)}`;
      titleLink.textContent = post.title;
      heading.append(titleLink);
      const excerpt = document.createElement('p');
      excerpt.textContent = post.excerpt || '';
      const readLink = document.createElement('a');
      readLink.className = 'blog-read-link';
      readLink.href = titleLink.href;
      readLink.textContent = 'Leer artículo →';
      content.append(category, heading, excerpt, readLink);
      card.append(visual, content);
      grid.append(card);
    });

    setSupabaseStatus(status, 'Publicaciones recientes del blog.', 'success');
  } catch (error) {
    showSupabaseError(status, 'No se pudieron cargar las novedades del inicio', error);
  }
}

async function initSupabaseTeam() {
  const grid = document.querySelector('.team-grid');
  if (!grid) return;

  const status = grid.parentElement.querySelector('[data-supabase-status]');
  try {
    const rows = await supabaseRequest('team_members', {
      query: new URLSearchParams({
        select: 'id,name,role,bio,photo_url,sort_order',
        is_published: 'eq.true',
        order: 'sort_order.asc'
      }).toString()
    });

    if (!rows.length) {
      setSupabaseStatus(status, 'Supabase está conectada; se muestra el equipo actual hasta que publiques integrantes desde el panel.', 'info');
      return;
    }

    grid.replaceChildren();
    rows.forEach((member) => {
      const card = document.createElement('article');
      card.className = 'team-card';
      const avatarBox = document.createElement('div');
      avatarBox.className = 'team-avatar-box';
      const photoUrl = safeExternalUrl(member.photo_url);
      if (photoUrl) {
        const image = document.createElement('img');
        image.src = photoUrl;
        image.alt = `Foto de ${member.name}`;
        image.className = 'team-avatar-gradient';
        avatarBox.append(image);
      } else {
        const initials = document.createElement('div');
        initials.className = 'team-avatar-gradient';
        initials.textContent = member.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
        avatarBox.append(initials);
      }
      const roleTag = document.createElement('span');
      roleTag.className = 'team-role-tag';
      roleTag.textContent = member.role || 'Equipo CECiD';
      avatarBox.append(roleTag);

      const content = document.createElement('div');
      content.className = 'team-content';
      const name = document.createElement('h3');
      name.className = 'team-name';
      name.textContent = member.name;
      const role = document.createElement('p');
      role.className = 'team-cargo';
      role.textContent = member.role || '';
      const bio = document.createElement('p');
      bio.className = 'team-desc';
      bio.textContent = member.bio || '';
      content.append(name, role, bio);
      card.append(avatarBox, content);
      grid.append(card);
    });

    setSupabaseStatus(status, 'Integrantes cargados desde Supabase.', 'success');
  } catch (error) {
    showSupabaseError(status, 'No se pudo cargar el equipo', error);
  }
}

async function initSupabaseProposals() {
  const grid = document.getElementById('proposals-grid');
  if (!grid) return;

  const status = grid.parentElement.querySelector('[data-supabase-status]');
  try {
    const rows = await supabaseRequest('proposals', {
      query: new URLSearchParams({
        select: 'id,title,description,status,sort_order',
        is_published: 'eq.true',
        order: 'sort_order.asc'
      }).toString()
    });

    if (!rows.length) {
      setSupabaseStatus(status, 'Supabase está conectada; se muestran las propuestas actuales hasta que publiques registros desde el panel.', 'info');
      return;
    }

    grid.replaceChildren();
    rows.forEach((proposal) => {
      const card = document.createElement('article');
      card.className = 'proposal-card';
      const badge = document.createElement('div');
      badge.className = `proposal-badge ${/ejecuci|permanente|activa/i.test(proposal.status) ? 'status-active' : 'status-progress'}`;
      badge.textContent = proposal.status || 'En propuesta';
      const icon = document.createElement('div');
      icon.className = 'proposal-icon';
      icon.textContent = '💡';
      const title = document.createElement('h3');
      title.className = 'proposal-title';
      title.textContent = proposal.title;
      const description = document.createElement('p');
      description.className = 'proposal-desc';
      description.textContent = proposal.description || '';
      card.append(badge, icon, title, description);
      grid.append(card);
    });

    setSupabaseStatus(status, 'Propuestas cargadas desde Supabase.', 'success');
  } catch (error) {
    showSupabaseError(status, 'No se pudieron cargar las propuestas', error);
  }
}

async function initSupabaseEvents() {
  const grid = document.getElementById('database-events-grid');
  const section = document.getElementById('database-events-section');
  if (!grid || !section) return;

  const status = section.querySelector('[data-supabase-status]');
  try {
    const rows = await supabaseRequest('events', {
      query: new URLSearchParams({
        select: 'id,title,summary,body,starts_at,location,cover_url',
        is_published: 'eq.true',
        order: 'starts_at.asc'
      }).toString()
    });

    if (!rows.length) return;
    section.classList.remove('hidden');
    rows.forEach((event) => {
      const card = document.createElement('article');
      card.className = 'database-event-card';
      const coverUrl = safeExternalUrl(event.cover_url);
      if (coverUrl) {
        const image = document.createElement('img');
        image.className = 'database-event-cover';
        image.src = coverUrl;
        image.alt = '';
        card.append(image);
      }

      const content = document.createElement('div');
      content.className = 'database-event-content';
      const date = document.createElement('span');
      date.className = 'event-date';
      const startDate = event.starts_at ? new Date(event.starts_at) : null;
      date.textContent = [startDate && !Number.isNaN(startDate.valueOf())
        ? new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(startDate)
        : '', event.location].filter(Boolean).join(' • ');
      const title = document.createElement('h3');
      title.className = 'event-title';
      title.textContent = event.title;
      content.append(date, title);
      if (event.summary) {
        const summary = document.createElement('p');
        summary.className = 'event-lead';
        summary.textContent = event.summary;
        content.append(summary);
      }
      if (event.body) {
        const body = document.createElement('p');
        body.className = 'event-text';
        body.textContent = event.body;
        content.append(body);
      }
      card.append(content);
      grid.append(card);
    });
    setSupabaseStatus(status, 'Eventos cargados desde Supabase.', 'success');
  } catch (error) {
    section.classList.remove('hidden');
    showSupabaseError(status, 'No se pudieron cargar los eventos', error);
  }
}
