import { db, doc, getDoc } from './firebase-services.js';

const root = document.getElementById('propertySheetRoot');
const propertyUtils = window.inmoPropertyUtils || {};
const MAX_FEATURES = 8;

if (!root) {
  console.warn('[PropertySheetFeatures] No se encontró el contenedor de la ficha.');
} else {
  init();
}

const ICONS = {
  bed: '<path d="M3 19v-8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8"/><path d="M3 19h18"/><path d="M7 12h4"/><path d="M15 12h2"/>',
  bath: '<path d="M4 11h16"/><path d="M6 11v4a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5v-4"/><path d="M8 7a3 3 0 0 1 6 0v4"/>',
  area: '<path d="M4 4h16v16H4z"/><path d="M8 4v3M12 4v2M16 4v3M20 8h-3M20 12h-2M20 16h-3"/>',
  building: '<path d="M5 21V4h10v17"/><path d="M15 9h4v12"/><path d="M8 8h4M8 12h4M8 16h4M4 21h16"/>',
  levels: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m4 13 8 4 8-4"/><path d="m4 17 8 4 8-4"/>',
  car: '<path d="M5 17h14"/><path d="M6 17v2M18 17v2"/><path d="m4 13 2-5h12l2 5"/><circle cx="7" cy="14" r="1.5"/><circle cx="17" cy="14" r="1.5"/>',
  pool: '<path d="M3 16c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/><path d="M3 20c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/><path d="M7 14V6a3 3 0 0 1 6 0"/><path d="M7 10h6"/>',
  leaf: '<path d="M20 4C12 4 5 7 5 14c0 3 2 5 5 5 7 0 10-7 10-15Z"/><path d="M5 20c3-5 7-8 12-11"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/>',
  water: '<path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z"/><path d="M9 15c.7 1 1.7 1.5 3 1.5"/>',
  power: '<path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z"/>',
  road: '<path d="M8 3 6 21M16 3l2 18"/><path d="M12 5v3M12 11v3M12 17v2"/>',
  mountain: '<path d="m3 20 6-10 4 6 3-5 5 9H3Z"/><path d="m8 11 1-3 2 3"/>',
  fence: '<path d="M5 4v16M12 4v16M19 4v16"/><path d="M3 8h18M3 16h18"/>',
  truck: '<path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  shield: '<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  square: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8v8H8z"/>',
  soil: '<path d="M3 8h18M5 12h14M7 16h10M9 20h6"/><path d="m5 5 2 3m5-3 2 3m5-3-2 3"/>',
  storefront: '<path d="M4 10h16l-2-5H6l-2 5Z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  traffic: '<path d="M6 21V7a6 6 0 0 1 12 0v14"/><path d="M9 9h6M9 13h6M9 17h6"/>',
  warehouse: '<path d="m3 10 9-6 9 6v11H3V10Z"/><path d="M7 14h10v7H7z"/><path d="M9 17h6"/>',
  office: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7"/><path d="M15 14c3 0 5 2 5 5"/>',
  elevator: '<path d="M8 4h8v16H8z"/><path d="m5 8 2-2 2 2M15 16l2 2 2-2"/>',
  wifi: '<path d="M4 9a12 12 0 0 1 16 0"/><path d="M7 13a8 8 0 0 1 10 0"/><path d="M10 17a3 3 0 0 1 4 0"/><circle cx="12" cy="20" r="1"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>',
  document: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
  trend: '<path d="m4 17 5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  map: '<path d="M12 21s7-5 7-12a7 7 0 1 0-14 0c0 7 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>'
};

const FEATURE_SPECS = {
  house: [
    spec('bedrooms', 'Habitaciones', 'bed', 'number', ['habitaciones']),
    spec('bathrooms', 'Baños', 'bath', 'number', ['banos']),
    areaSpec(['constructionArea'], 'Área construida', 'building'),
    areaSpec(['landArea', 'totalArea'], 'Área de terreno', 'area'),
    spec('levels', 'Niveles', 'levels', 'number'),
    spec('garage', 'Garaje', 'car', 'yes'),
    spec('patio', 'Patio', 'leaf', 'yes'),
    spec('terrace', 'Terraza', 'home', 'yes'),
    spec('furnished', 'Amueblada', 'check', 'yes')
  ],
  beach_house: [
    spec('bedrooms', 'Habitaciones', 'bed', 'number', ['habitaciones']),
    spec('bathrooms', 'Baños', 'bath', 'number', ['banos']),
    areaSpec(['constructionArea'], 'Área construida', 'building'),
    areaSpec(['landArea', 'totalArea'], 'Área de terreno', 'area'),
    spec('levels', 'Niveles', 'levels', 'number'),
    spec('garage', 'Garaje', 'car', 'yes'),
    spec('patio', 'Patio', 'leaf', 'yes'),
    spec('terrace', 'Terraza', 'home', 'yes'),
    spec('furnished', 'Amueblada', 'check', 'yes')
  ],
  apartment: [
    spec('bedrooms', 'Habitaciones', 'bed', 'number', ['habitaciones']),
    spec('bathrooms', 'Baños', 'bath', 'number', ['banos']),
    areaSpec(['constructionArea'], 'Área construida', 'building'),
    spec('floorLevel', 'Piso / nivel', 'levels', 'text'),
    spec('parking', 'Parqueo', 'car', 'yes'),
    spec('elevator', 'Ascensor', 'elevator', 'yes'),
    spec('balcony', 'Balcón', 'home', 'yes'),
    spec('furnished', 'Amueblado', 'check', 'yes'),
    spec('amenities', 'Amenidades', 'users', 'text')
  ],
  quinta: [
    spec('bedrooms', 'Habitaciones', 'bed', 'number'),
    spec('bathrooms', 'Baños', 'bath', 'number'),
    areaSpec(['constructionArea'], 'Área construida', 'building'),
    areaSpec(['landArea', 'totalArea'], 'Área de terreno', 'area'),
    spec('pool', 'Piscina', 'pool', 'yes'),
    spec('gardens', 'Jardines', 'leaf', 'yes'),
    spec('socialArea', 'Área social', 'users', 'yes'),
    spec('mainHouse', 'Casa principal', 'home', 'yes'),
    spec('caretakerHouse', 'Casa de cuidador', 'home', 'yes'),
    spec('well', 'Pozo', 'water', 'yes'),
    spec('vehicleAccess', 'Acceso vehicular', 'road', 'text'),
    spec('naturalEnvironment', 'Entorno natural', 'mountain', 'text')
  ],
  farm: [
    areaSpec(['totalArea', 'landArea'], 'Área total', 'area'),
    spec('currentUse', 'Uso actual', 'leaf', 'text'),
    spec('topography', 'Topografía', 'mountain', 'text'),
    spec('accessType', 'Acceso', 'road', 'text'),
    spec('waterSource', 'Fuente de agua', 'water', 'text'),
    spec('potableWater', 'Agua potable', 'water', 'yes', [], 'Disponible'),
    spec('electricity', 'Energía eléctrica', 'power', 'yes', [], 'Disponible'),
    spec('well', 'Pozo', 'water', 'yes'),
    spec('fences', 'Cercas', 'fence', 'yes'),
    spec('paddocks', 'Potreros', 'fence', 'text'),
    spec('crops', 'Cultivos', 'leaf', 'text'),
    spec('potentialUse', 'Potencial', 'trend', 'text')
  ],
  land: [
    areaSpec(['totalArea', 'landArea'], 'Área total', 'area'),
    spec('landType', 'Tipo de terreno', 'map', 'text'),
    spec('topography', 'Topografía', 'mountain', 'text'),
    spec('landShape', 'Forma', 'square', 'text'),
    spec('accessType', 'Acceso', 'road', 'text'),
    spec('streetType', 'Tipo de calle', 'road', 'text'),
    spec('availableServices', 'Servicios', 'check', 'text'),
    spec('potentialUse', 'Uso potencial', 'trend', 'text'),
    spec('soilType', 'Tipo de suelo', 'soil', 'text'),
    spec('naturalResources', 'Recursos naturales', 'leaf', 'text')
  ],
  commercial: [
    areaSpec(['constructionArea'], 'Área construida', 'building'),
    spec('bathrooms', 'Baños', 'bath', 'number'),
    spec('commercialFront', 'Frente comercial', 'storefront', 'text'),
    spec('parking', 'Parqueo', 'car', 'yes'),
    spec('trafficLevel', 'Tráfico', 'traffic', 'text'),
    spec('commercialZone', 'Zona comercial', 'map', 'text'),
    spec('security', 'Seguridad', 'shield', 'text'),
    spec('internalWarehouse', 'Bodega interna', 'warehouse', 'yes'),
    spec('basicServices', 'Servicios básicos', 'check', 'text'),
    spec('permittedUse', 'Uso permitido', 'briefcase', 'text')
  ],
  warehouse: [
    areaSpec(['constructionArea'], 'Área construida', 'warehouse'),
    spec('height', 'Altura', 'building', 'text'),
    spec('truckAccess', 'Acceso camiones', 'truck', 'yes'),
    spec('internalOffices', 'Oficinas internas', 'office', 'yes'),
    spec('bathrooms', 'Baños', 'bath', 'number'),
    spec('parking', 'Parqueo', 'car', 'yes'),
    spec('threePhasePower', 'Energía trifásica', 'power', 'yes'),
    spec('industrialZone', 'Zona industrial', 'map', 'text'),
    spec('security', 'Seguridad', 'shield', 'text')
  ],
  office: [
    areaSpec(['constructionArea'], 'Área construida', 'office'),
    spec('privateRooms', 'Ambientes privados', 'office', 'number'),
    spec('bathrooms', 'Baños', 'bath', 'number'),
    spec('parking', 'Parqueo', 'car', 'yes'),
    spec('meetingRoom', 'Sala de reuniones', 'users', 'yes'),
    spec('reception', 'Recepción', 'users', 'yes'),
    spec('elevator', 'Ascensor', 'elevator', 'yes'),
    spec('connectivity', 'Conectividad', 'wifi', 'text'),
    spec('security', 'Seguridad', 'shield', 'text'),
    spec('corporateLocation', 'Ubicación corporativa', 'map', 'text')
  ],
  investment: [
    areaSpec(['totalArea', 'landArea'], 'Área total', 'area'),
    spec('projectType', 'Tipo de proyecto', 'briefcase', 'text'),
    spec('potentialUse', 'Uso potencial', 'trend', 'text'),
    spec('existingPermits', 'Permisos', 'document', 'text'),
    spec('availableStudies', 'Estudios disponibles', 'document', 'text'),
    spec('accesses', 'Accesos', 'road', 'text'),
    spec('basicServices', 'Servicios básicos', 'check', 'text'),
    spec('capitalGainProjection', 'Proyección de plusvalía', 'trend', 'text'),
    spec('mainRoadsProximity', 'Vías principales', 'road', 'text')
  ]
};

async function init() {
  const propertyId = getPropertyId();
  if (!propertyId) return;

  try {
    const snapshot = await getDoc(doc(db, 'properties', propertyId));
    if (!snapshot.exists()) return;
    const property = { id: snapshot.id, ...snapshot.data() };
    let scheduled = false;

    const apply = async () => {
      scheduled = false;
      const sheet = root.querySelector('#property-sheet-pdf');
      if (!sheet) return;
      renderDynamicFeatures(sheet, property);
      await fitSheetToA4(sheet);
    };

    const scheduleApply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => apply().catch((error) => console.warn('[PropertySheetFeatures] Ajuste A4:', error)));
    };

    const observer = new MutationObserver(scheduleApply);
    observer.observe(root, { childList: true, subtree: true });
    scheduleApply();

    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleApply).catch(() => undefined);
    }
  } catch (error) {
    console.warn('[PropertySheetFeatures] No fue posible preparar las características dinámicas:', error);
  }
}

function getPropertyId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('propertyId') || params.get('id');
  if (fromQuery) return fromQuery;

  const hashParts = window.location.hash.replace(/^#/, '').split('?')[0].split('/').filter(Boolean);
  const hashIndex = hashParts.indexOf('property-sheet');
  if (hashIndex >= 0 && hashParts[hashIndex + 1]) return decodeURIComponent(hashParts[hashIndex + 1]);

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pathIndex = pathParts.indexOf('property-sheet');
  if (pathIndex >= 0 && pathParts[pathIndex + 1]) return decodeURIComponent(pathParts[pathIndex + 1]);
  return params.get('id') || '';
}

function spec(key, label, icon, kind = 'text', aliases = [], yesLabel = 'Sí') {
  return { keys: [key, ...aliases], label, icon, kind, yesLabel };
}

function areaSpec(keys, label, icon = 'area') {
  return { keys, label, icon, kind: 'area' };
}

function renderDynamicFeatures(sheet, property) {
  const section = sheet.querySelector('.sheet-features');
  const grid = section?.querySelector(':scope > div');
  if (!section || !grid) return;

  const type = normalizeType(property.type || property.tipo);
  const specs = FEATURE_SPECS[type] || fallbackSpecs();
  const features = specs
    .map((item) => resolveFeature(item, property))
    .filter(Boolean)
    .slice(0, MAX_FEATURES);

  sheet.classList.forEach((className) => {
    if (className.startsWith('sheet-type-')) sheet.classList.remove(className);
  });
  sheet.classList.add(`sheet-type-${type || 'other'}`);

  const heading = section.querySelector('h2');
  if (heading) {
    const typeLabel = propertyUtils.getPropertyTypeLabel?.(type) || humanize(type);
    heading.textContent = typeLabel ? `Características de ${articleFor(typeLabel)} ${typeLabel.toLowerCase()}` : 'Características principales';
  }

  if (!features.length) {
    section.style.display = 'none';
    return;
  }

  section.style.removeProperty('display');
  grid.dataset.dynamicFeatures = 'true';
  grid.dataset.propertyType = type;
  grid.innerHTML = features.map(featureMarkup).join('');
}

function fallbackSpecs() {
  return [
    spec('bedrooms', 'Habitaciones', 'bed', 'number', ['habitaciones']),
    spec('bathrooms', 'Baños', 'bath', 'number', ['banos']),
    areaSpec(['constructionArea'], 'Área construida', 'building'),
    areaSpec(['landArea', 'totalArea'], 'Área total', 'area'),
    spec('parking', 'Parqueo', 'car', 'yes', ['garage']),
    spec('topography', 'Topografía', 'mountain', 'text'),
    spec('accessType', 'Acceso', 'road', 'text'),
    spec('potentialUse', 'Uso potencial', 'trend', 'text')
  ];
}

function normalizeType(value = '') {
  if (typeof propertyUtils.normalizePropertyType === 'function') {
    return propertyUtils.normalizePropertyType(value) || 'other';
  }
  return String(value || 'other').trim().toLowerCase();
}

function valueAt(property, keys = []) {
  for (const key of keys) {
    const direct = property?.[key];
    const nested = property?.propertyDetails?.[key];
    if (hasValue(direct)) return direct;
    if (hasValue(nested)) return nested;
  }
  return '';
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function resolveFeature(item, property) {
  const raw = valueAt(property, item.keys);
  let value = '';

  if (item.kind === 'number') value = positiveNumber(raw);
  if (item.kind === 'yes') value = isPositiveBoolean(raw) ? item.yesLabel : '';
  if (item.kind === 'area') value = formatArea(raw, valueAt(property, ['areaUnit']));
  if (item.kind === 'text') value = meaningfulText(raw);

  if (!value) return null;
  return { label: item.label, icon: item.icon, value };
}

function positiveNumber(value) {
  const number = Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(number) || number <= 0) return '';
  return number.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function isPositiveBoolean(value) {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return ['si', 'yes', 'true', '1', 'incluido', 'incluida', 'disponible'].includes(normalized);
}

function meaningfulText(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (['0', 'no', 'false', 'ninguno', 'ninguna', 'no especificado', 'n/a', 'na'].includes(normalized)) return '';
  return text.length > 58 ? `${text.slice(0, 55).trim()}…` : text;
}

function formatArea(value, unit) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const numeric = Number(text.replace(/,/g, ''));
  if (Number.isFinite(numeric) && numeric <= 0) return '';
  const areaText = Number.isFinite(numeric)
    ? numeric.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : meaningfulText(text);
  if (!areaText) return '';
  const unitText = meaningfulText(unit);
  return `${areaText}${unitText ? ` ${unitText}` : ''}`;
}

function featureMarkup(feature) {
  const icon = ICONS[feature.icon] || ICONS.check;
  return `<div class="sheet-feature-item sheet-feature-item--dynamic">
    <span class="sheet-feature-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></span>
    <small>${escapeHtml(feature.label)}</small>
    <strong>${escapeHtml(feature.value)}</strong>
  </div>`;
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function humanize(value = '') {
  return String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function articleFor(label = '') {
  const lower = String(label).toLowerCase();
  if (/^(casa|finca|quinta|bodega|oficina)/.test(lower)) return 'la';
  return 'el';
}

async function fitSheetToA4(sheet) {
  const densityClasses = ['sheet-density-compact', 'sheet-density-tight', 'sheet-density-ultra'];
  densityClasses.forEach((className) => sheet.classList.remove(className));

  const description = sheet.querySelector('.sheet-description');
  if (description) {
    description.style.removeProperty('font-size');
    description.style.removeProperty('line-height');
  }

  await nextPaint();

  for (const className of densityClasses) {
    if (!hasOverflow(sheet)) break;
    sheet.classList.add(className);
    await nextPaint();
  }

  if (hasOverflow(sheet) && description) {
    const sizes = [6.1, 5.9, 5.7, 5.5];
    for (const size of sizes) {
      description.style.fontSize = `${size}pt`;
      description.style.lineHeight = '1.08';
      await nextPaint();
      if (!hasOverflow(sheet)) break;
    }
  }
}

function hasOverflow(sheet) {
  if (sheet.scrollHeight > sheet.clientHeight + 2) return true;
  return Array.from(sheet.querySelectorAll('.sheet-info-grid > div')).some((card) => card.scrollHeight > card.clientHeight + 2);
}

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
