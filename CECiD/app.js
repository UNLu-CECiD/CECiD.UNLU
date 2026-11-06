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
  initSocialTools();
  initMobileMenu();
  initScrollSpy();
});

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

  const customResources = JSON.parse(localStorage.getItem('cecid_custom_resources') || '[]');
  const allResources = [...customResources, ...DEFAULT_RESOURCES];

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
            <span class="resource-type-badge type-${item.category}">${item.categoryLabel}</span>
            <span class="resource-format-tag">${item.format}</span>
          </div>
          <p class="resource-materia">${item.materia}</p>
          <h4 class="resource-title">${item.title}</h4>
          <p class="resource-desc">${item.desc}</p>
        </div>
        <div class="resource-footer">
          <span class="resource-author">${item.author}</span>
          <button class="btn-download-resource" data-id="${item.id}">
            <span>Consultar material</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      `;

      const downloadBtn = card.querySelector('.btn-download-resource');
      downloadBtn.addEventListener('click', () => {
        alert(`📖 "${item.title}"\n\nEste recurso forma parte de la Biblioteca Abierta del CECiD. Podés consultar y solicitar copias físicas o enlaces al Google Drive del centro escribiendo a cecid.unlu@gmail.com o a través del Discord oficial.`);
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
    aportarForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const materiaCode = document.getElementById('aportar-materia')?.value;
      const materiaName = document.getElementById('aportar-materia')?.selectedOptions[0]?.text;
      const tipo = document.getElementById('aportar-tipo')?.value;
      const tipoLabel = document.getElementById('aportar-tipo')?.selectedOptions[0]?.text;
      const titulo = document.getElementById('aportar-titulo')?.value.trim();
      const enlace = document.getElementById('aportar-enlace')?.value.trim();
      const autor = document.getElementById('aportar-autor')?.value.trim() || 'Estudiante anónimo';

      if (!titulo) {
        if (aportarFeedback) {
          aportarFeedback.textContent = 'Por favor ingresá al menos el título de tu apunte.';
          aportarFeedback.className = 'form-feedback error';
          aportarFeedback.classList.remove('hidden');
        }
        return;
      }

      const customResources = JSON.parse(localStorage.getItem('cecid_custom_resources') || '[]');
      const newResource = {
        id: 'user-' + Date.now(),
        category: tipo,
        categoryLabel: tipoLabel,
        format: enlace ? 'Enlace Digital' : 'Documento Estudiantil',
        materia: materiaName,
        title: titulo,
        desc: `Material aportado para la comunidad universitaria. ${enlace ? 'Enlace: ' + enlace : ''}`,
        author: `Aportado por: ${autor}`,
        link: enlace || '#'
      };

      customResources.unshift(newResource);
      localStorage.setItem('cecid_custom_resources', JSON.stringify(customResources));

      if (aportarFeedback) {
        aportarFeedback.innerHTML = `<strong>¡Muchas gracias!</strong><br>Tu material "${titulo}" se sumó a la biblioteca y ya aparece en el catálogo.`;
        aportarFeedback.className = 'form-feedback success';
        aportarFeedback.classList.remove('hidden');
      }

      aportarForm.reset();
      initBibliotecaDigital();

      setTimeout(() => {
        closeModal(modalAportar);
        if (aportarFeedback) aportarFeedback.classList.add('hidden');
      }, 2500);
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nombre = document.getElementById('form-nombre')?.value.trim();
    const email = document.getElementById('form-email')?.value.trim();
    const sede = document.getElementById('form-sede')?.value;
    const tipo = document.getElementById('form-tipo')?.value;
    const mensaje = document.getElementById('form-mensaje')?.value.trim();

    if (!nombre || !email || !mensaje) {
      feedback.textContent = 'Por favor, completá todos los campos requeridos.';
      feedback.className = 'form-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    const consultas = JSON.parse(localStorage.getItem('cecid_consultas') || '[]');
    consultas.push({
      nombre,
      email,
      sede,
      tipo,
      mensaje,
      fecha: new Date().toISOString()
    });
    localStorage.setItem('cecid_consultas', JSON.stringify(consultas));

    feedback.innerHTML = `
      <strong>¡Mensaje recibido con éxito!</strong><br>
      Muchas gracias ${nombre}. El equipo del CECiD te responderá a la brevedad a tu correo (${email}).
    `;
    feedback.className = 'form-feedback success';
    feedback.classList.remove('hidden');

    form.reset();

    setTimeout(() => {
      feedback.classList.add('hidden');
    }, 8000);
  });
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

  toggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
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
