(function attachPropertyUtils(global) {
  const USD_TO_NIO_RATE = 36.6243;

  const PROPERTY_TYPE_ALIASES = {
    house: ['house', 'casa', 'casas'],
    apartment: ['apartment', 'apartamento', 'apartamentos'],
    quinta: ['quinta', 'quintas'],
    farm: ['farm', 'finca', 'fincas'],
    land: ['land', 'terreno', 'terrenos'],
    commercial: ['commercial', 'local', 'local comercial', 'local_comercial', 'retail'],
    warehouse: ['warehouse', 'bodega', 'bodegas'],
    office: ['office', 'oficina', 'oficinas'],
    investment: ['investment', 'project', 'proyecto', 'proyecto / inversión', 'proyecto inversion', 'proyecto_inversion', 'inversion'],
    other: ['other', 'otro', 'otra'],
    beach_house: ['beach_house', 'beach-house', 'beach house', 'casa cerca del mar', 'casas cerca del mar', 'casa_cerca_del_mar']
  };

  const PROPERTY_TYPE_LABELS = {
    house: 'Casa',
    apartment: 'Apartamento',
    quinta: 'Quinta',
    farm: 'Finca',
    land: 'Terreno',
    commercial: 'Local comercial',
    warehouse: 'Bodega',
    office: 'Oficina',
    investment: 'Proyecto / inversión',
    other: 'Otro',
    beach_house: 'Casa cerca del mar'
  };

  const AREA_UNITS = ['metros', 'm2', 'm²', 'varas', 'varas2', 'varas²', 'manzanas', 'hectareas', 'hectáreas'];
  const AREA_UNIT_SINGULAR = {
    metros: 'metro²',
    m2: 'm²',
    'm²': 'm²',
    varas: 'vara²',
    varas2: 'vara²',
    'varas²': 'vara²',
    manzanas: 'manzana',
    hectareas: 'hectárea',
    'hectáreas': 'hectárea'
  };

  const typeLookup = Object.entries(PROPERTY_TYPE_ALIASES).reduce((acc, [canonical, aliases]) => {
    aliases.forEach((value) => {
      acc[String(value).trim().toLowerCase()] = canonical;
    });
    return acc;
  }, {});

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function normalizePropertyType(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    return typeLookup[normalized] || normalized;
  }

  function getPropertyTypeLabel(type = '') {
    const normalized = normalizePropertyType(type);
    return PROPERTY_TYPE_LABELS[normalized] || '';
  }

  function normalizeOperation(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'comprar' || normalized === 'venta') return 'venta';
    if (normalized === 'renta' || normalized === 'alquiler') return 'alquiler';
    if (['venta/renta', 'venta-renta', 'venta y renta', 'venta/alquiler'].includes(normalized)) return 'venta_renta';
    return normalized;
  }

  function convertUsdToNio(usd) {
    const amount = toNumber(usd);
    if (!Number.isFinite(amount)) return NaN;
    return amount * USD_TO_NIO_RATE;
  }

  function formatUsd(usd, decimals = 0) {
    const amount = toNumber(usd);
    if (!Number.isFinite(amount)) return '';
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })} USD`;
  }

  function formatNio(nio, decimals = 0) {
    const amount = toNumber(nio);
    if (!Number.isFinite(amount)) return '';
    return `C$${amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })} NIO`;
  }

  function formatDualPrice(usd) {
    const usdAmount = toNumber(usd);
    if (!Number.isFinite(usdAmount) || usdAmount <= 0) return 'Precio no disponible';
    return `${formatUsd(usdAmount, 0)}\n${formatNio(convertUsdToNio(usdAmount), 0)}`;
  }

  function formatDualPriceMarkup(usd) {
    const usdAmount = toNumber(usd);
    if (!Number.isFinite(usdAmount) || usdAmount <= 0) return '<span class="price-unavailable">Precio no disponible</span>';
    return `<span class="price-usd">${formatUsd(usdAmount, 0)}</span><span class="price-nio">${formatNio(convertUsdToNio(usdAmount), 0)}</span>`;
  }

  function calculatePricePerArea(priceUsd, areaValue) {
    const price = toNumber(priceUsd);
    const area = toNumber(areaValue);
    if (!Number.isFinite(price) || !Number.isFinite(area) || price <= 0 || area <= 0) return NaN;
    return price / area;
  }

  function normalizeAreaUnit(unit = '') {
    const normalized = String(unit || '').trim().toLowerCase();
    const aliases = {
      m2: 'm²',
      'metros cuadrados': 'm²',
      metros: 'm²',
      vara: 'varas²',
      varas: 'varas²',
      varas2: 'varas²',
      'varas cuadradas': 'varas²',
      hectareas: 'hectáreas'
    };
    const canonical = aliases[normalized] || normalized;
    return AREA_UNITS.includes(canonical) ? canonical : '';
  }

  function formatPricePerArea(pricePerAreaUsd, areaUnit = '') {
    const value = toNumber(pricePerAreaUsd);
    const normalizedUnit = normalizeAreaUnit(areaUnit);
    if (!Number.isFinite(value) || value <= 0 || !normalizedUnit) return 'Precio por área no disponible';

    return `${formatUsd(value, 2)} / ${AREA_UNIT_SINGULAR[normalizedUnit] || normalizedUnit}`;
  }

  function getPriceUsd(property = {}) {
    const price = toNumber(property.priceUsd ?? property.price ?? property.precio);
    return Number.isFinite(price) ? price : NaN;
  }

  function getAreaValue(property = {}) {
    const area = toNumber(property.areaValue ?? property.area);
    return Number.isFinite(area) ? area : NaN;
  }

  function getAreaDisplay(property = {}) {
    const areaValue = getAreaValue(property);
    const areaUnit = normalizeAreaUnit(property.areaUnit || '');

    if (Number.isFinite(areaValue) && areaValue > 0 && areaUnit) {
      return `${areaValue.toLocaleString('en-US')} ${areaUnit}`;
    }

    if (typeof property.area === 'string' && property.area.trim()) {
      return property.area.trim();
    }

    if (Number.isFinite(areaValue) && areaValue > 0) {
      return `${areaValue.toLocaleString('en-US')} m²`;
    }

    return 'Área no especificada';
  }

  function getPricePerAreaUsd(property = {}) {
    const stored = toNumber(property.pricePerAreaUsd);
    if (Number.isFinite(stored) && stored > 0) return stored;
    return calculatePricePerArea(getPriceUsd(property), getAreaValue(property));
  }

  function humanizeKey(key = '') {
    return String(key || '')
      .replace(/([A-Z])/g, ' $1')
      .replaceAll('_', ' ')
      .replace(/^./, (letter) => letter.toUpperCase());
  }

  function formatDetailValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  }

  function getDetailValue(property = {}, key = '') {
    return property.propertyDetails?.[key] ?? property[key] ?? '';
  }

  function buildDisplayDetails(property = {}, fields = []) {
    return fields
      .map((field) => {
        const config = typeof field === 'string' ? { key: field, label: humanizeKey(field) } : field;
        const rawValue = config.value !== undefined ? config.value : getDetailValue(property, config.key);
        const value = formatDetailValue(rawValue);
        if (!value || value === '0') return null;
        return { label: config.label || humanizeKey(config.key), value, icon: config.icon || 'type' };
      })
      .filter(Boolean);
  }

  function getPropertyDisplayDetails(property = {}) {
    const type = normalizePropertyType(property.propertyType || property.type || property.tipo || '');
    const areaUnit = property.propertyDetails?.areaUnit || property.areaUnit || '';
    const fallbackArea = getAreaValue(property);
    const typedArea = getDetailValue(property, type === 'house' || type === 'quinta' || type === 'land' || type === 'farm' || type === 'investment' ? 'landArea' : 'constructionArea');
    const areaValue = typedArea || (Number.isFinite(fallbackArea) ? fallbackArea : '');
    const commonArea = { label: 'Área', value: `${formatDetailValue(areaValue)} ${formatDetailValue(areaUnit)}`.trim(), icon: 'area' };
    const definitions = {
      house: [{ key: 'bedrooms', label: 'Habitaciones', icon: 'bedrooms' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' }, { key: 'constructionArea', label: 'Construcción', icon: 'area' }, { key: 'landArea', label: 'Terreno', icon: 'area' }],
      apartment: [{ key: 'bedrooms', label: 'Habitaciones', icon: 'bedrooms' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' }, { key: 'constructionArea', label: 'Construcción', icon: 'area' }, { key: 'floorLevel', label: 'Piso / nivel' }],
      quinta: [{ key: 'bedrooms', label: 'Habitaciones', icon: 'bedrooms' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' }, { key: 'landArea', label: 'Terreno', icon: 'area' }, { key: 'pool', label: 'Piscina' }, { key: 'potentialUse', label: 'Uso potencial' }],
      farm: [{ key: 'totalArea', label: 'Área total', icon: 'area' }, { key: 'currentUse', label: 'Uso actual' }, { key: 'topography', label: 'Topografía' }, { key: 'waterSource', label: 'Fuente de agua' }, { key: 'electricity', label: 'Energía eléctrica' }],
      land: [{ key: 'totalArea', label: 'Área total', icon: 'area' }, { key: 'topography', label: 'Topografía' }, { key: 'accessType', label: 'Acceso' }, { key: 'potentialUse', label: 'Uso potencial' }, { key: 'landType', label: 'Tipo de terreno' }],
      commercial: [{ key: 'constructionArea', label: 'Construcción', icon: 'area' }, { key: 'trafficLevel', label: 'Nivel de tráfico' }, { key: 'parking', label: 'Parqueo', icon: 'parking' }, { key: 'commercialFront', label: 'Frente comercial' }],
      warehouse: [{ key: 'constructionArea', label: 'Construcción', icon: 'area' }, { key: 'height', label: 'Altura' }, { key: 'truckAccess', label: 'Acceso camiones' }, { key: 'threePhasePower', label: 'Energía trifásica' }],
      office: [{ key: 'constructionArea', label: 'Construcción', icon: 'area' }, { key: 'privateRooms', label: 'Ambientes privados' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' }, { key: 'parking', label: 'Parqueo', icon: 'parking' }],
      investment: [{ key: 'totalArea', label: 'Área total', icon: 'area' }, { key: 'projectType', label: 'Tipo de proyecto' }, { key: 'potentialUse', label: 'Uso potencial' }, { key: 'capitalGainProjection', label: 'Plusvalía' }],
      other: [{ key: 'specificFeatures', label: 'Características específicas' }]
    };
    const details = buildDisplayDetails(property, definitions[type] || [commonArea]);
    return details.length ? details : buildDisplayDetails(property, [commonArea]);
  }

  global.inmoPropertyUtils = {
    USD_TO_NIO_RATE,
    PROPERTY_TYPE_LABELS,
    AREA_UNITS,
    normalizePropertyType,
    getPropertyTypeLabel,
    normalizeOperation,
    normalizeAreaUnit,
    convertUsdToNio,
    formatDualPrice,
    formatDualPriceMarkup,
    calculatePricePerArea,
    formatPricePerArea,
    getPriceUsd,
    getAreaValue,
    getAreaDisplay,
    getPricePerAreaUsd,
    getPropertyDisplayDetails,
    buildDisplayDetails
  };
})(window);
