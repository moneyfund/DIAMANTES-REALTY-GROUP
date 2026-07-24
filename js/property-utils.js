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


  const PROPERTY_STATUS_LABELS = {
    available: 'Disponible',
    disponible: 'Disponible',
    sold: 'Vendido',
    vendido: 'Vendido',
    vendida: 'Vendida',
    rented: 'Alquilado',
    rentada: 'Alquilada',
    alquilado: 'Alquilado',
    alquilada: 'Alquilada',
    pending: 'Pendiente',
    pendiente: 'Pendiente',
    reserved: 'Reservado',
    reservada: 'Reservada',
    archived: 'Archivado',
    archivada: 'Archivada'
  };

  function normalizeStatus(value = '') {
    return String(value || 'available')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function getPropertyStatusLabel(status = '') {
    const normalized = normalizeStatus(status);
    return PROPERTY_STATUS_LABELS[normalized] || (normalized ? humanizeKey(normalized) : 'Disponible');
  }

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
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
      const parsedString = Number(cleaned);
      return Number.isFinite(parsedString) ? parsedString : NaN;
    }
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
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (!normalized) return '';
    const hasSale = /\b(venta|comprar|sale)\b|for sale/.test(normalized);
    const hasRent = /\b(alquiler|alquilar|renta|rentar|rent)\b|for rent/.test(normalized);
    if (hasSale && hasRent) return 'venta_renta';
    if (hasSale || ['venta (comprar)', 'comprar'].includes(normalized)) return 'venta';
    if (hasRent) return 'alquiler';
    if (['venta/renta', 'venta-renta', 'venta y renta', 'venta/alquiler', 'sale/rent'].includes(normalized)) return 'venta_renta';
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
    if (Array.isArray(value)) return value.map((item) => formatDetailValue(item)).filter(Boolean).join(', ');
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number' && value === 0) return '';
    const text = String(value).trim();
    if (!text || ['null', 'undefined', 'nan'].includes(text.toLowerCase())) return '';
    return text;
  }

  function getDetailValue(property = {}, key = '') {
    return property.propertyDetails?.[key] ?? property[key] ?? '';
  }

  function shouldDisplayDetailValue(value) {
    if (!value) return false;
    const normalized = String(value).trim().toLowerCase();
    return !['0', '0 m²', '0 varas²', '0 manzanas', '0 hectáreas', 'null', 'undefined', 'nan'].includes(normalized);
  }

  function buildDisplayDetails(property = {}, fields = []) {
    return fields
      .map((field) => {
        const config = typeof field === 'string' ? { key: field, label: humanizeKey(field) } : field;
        const rawValue = config.value !== undefined ? config.value : getDetailValue(property, config.key);
        const value = formatDetailValue(rawValue);
        if (!shouldDisplayDetailValue(value)) return null;
        return { label: config.label || humanizeKey(config.key), value, icon: config.icon || 'type' };
      })
      .filter(Boolean);
  }

  function withUnit(key, label, icon = 'area') {
    return {
      key,
      label,
      icon,
      value: (property = {}) => {
        const value = getDetailValue(property, key);
        const unit = getDetailValue(property, 'areaUnit') || property.areaUnit || '';
        return `${formatDetailValue(value)} ${formatDetailValue(unit)}`.trim();
      }
    };
  }

  function getPropertyDisplayDetails(property = {}) {
    const type = normalizePropertyType(property.propertyType || property.type || property.tipo || '');
    const fallbackArea = getAreaValue(property);
    const fallbackAreaUnit = property.propertyDetails?.areaUnit || property.areaUnit || '';
    const commonArea = {
      label: 'Área',
      value: `${formatDetailValue(Number.isFinite(fallbackArea) ? fallbackArea : property.area)} ${formatDetailValue(fallbackAreaUnit)}`.trim(),
      icon: 'area'
    };
    const definitions = {
      house: [
        { key: 'bedrooms', label: 'Habitaciones', icon: 'bedrooms' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' },
        withUnit('constructionArea', 'Área de construcción'), withUnit('landArea', 'Área de terreno'), { key: 'levels', label: 'Niveles' },
        { key: 'garage', label: 'Garaje', icon: 'parking' }, { key: 'livingRoom', label: 'Sala' }, { key: 'diningRoom', label: 'Comedor' },
        { key: 'kitchen', label: 'Cocina' }, { key: 'patio', label: 'Patio' }, { key: 'terrace', label: 'Terraza' },
        { key: 'laundryArea', label: 'Área de lavado' }, { key: 'security', label: 'Seguridad' },
        { key: 'constructionStatus', label: 'Estado de construcción' }, { key: 'furnished', label: 'Amueblada' }
      ],
      apartment: [
        { key: 'bedrooms', label: 'Habitaciones', icon: 'bedrooms' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' },
        withUnit('constructionArea', 'Área de construcción'), { key: 'floorLevel', label: 'Piso / nivel' }, { key: 'parking', label: 'Parqueo', icon: 'parking' },
        { key: 'elevator', label: 'Ascensor' }, { key: 'security', label: 'Seguridad' }, { key: 'balcony', label: 'Balcón' },
        { key: 'furnished', label: 'Amueblado' }, { key: 'maintenanceFee', label: 'Cuota de mantenimiento' }, { key: 'amenities', label: 'Amenidades' }
      ],
      quinta: [
        { key: 'bedrooms', label: 'Habitaciones', icon: 'bedrooms' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' },
        withUnit('constructionArea', 'Área de construcción'), withUnit('landArea', 'Área de terreno'), { key: 'areaUnit', label: 'Unidad de área', icon: 'area' },
        { key: 'pool', label: 'Piscina' }, { key: 'gardens', label: 'Jardines' }, { key: 'socialArea', label: 'Área social' },
        { key: 'mainHouse', label: 'Casa principal' }, { key: 'caretakerHouse', label: 'Casa de cuidador' }, { key: 'well', label: 'Pozo' },
        { key: 'vehicleAccess', label: 'Acceso vehicular' }, { key: 'streetType', label: 'Tipo de calle' },
        { key: 'naturalEnvironment', label: 'Entorno natural' }, { key: 'potentialUse', label: 'Uso potencial' }
      ],
      farm: [
        withUnit('totalArea', 'Área total'), { key: 'areaUnit', label: 'Unidad de área', icon: 'area' }, { key: 'currentUse', label: 'Uso actual' },
        { key: 'topography', label: 'Topografía' }, { key: 'accessType', label: 'Tipo de acceso' }, { key: 'streetType', label: 'Tipo de calle' },
        { key: 'potableWater', label: 'Agua potable' }, { key: 'electricity', label: 'Energía eléctrica' }, { key: 'well', label: 'Pozo' },
        { key: 'waterSource', label: 'Río / quebrada / fuente de agua' }, { key: 'fences', label: 'Cercas' }, { key: 'paddocks', label: 'Potreros' },
        { key: 'crops', label: 'Cultivos' }, { key: 'existingInfrastructure', label: 'Infraestructura existente' },
        { key: 'documentation', label: 'Documentación' }, { key: 'potentialUse', label: 'Potencial' }
      ],
      land: [
        withUnit('totalArea', 'Área total'), { key: 'areaUnit', label: 'Unidad de área', icon: 'area' }, { key: 'landType', label: 'Tipo de terreno' },
        { key: 'topography', label: 'Topografía' }, { key: 'landShape', label: 'Forma del terreno' }, { key: 'soilType', label: 'Tipo de suelo' },
        { key: 'accessType', label: 'Acceso' }, { key: 'streetType', label: 'Tipo de calle' }, { key: 'availableServices', label: 'Servicios disponibles' },
        { key: 'environment', label: 'Entorno' }, { key: 'zoneSecurity', label: 'Seguridad de la zona' }, { key: 'trafficLevel', label: 'Nivel de tráfico' },
        { key: 'potentialUse', label: 'Uso potencial' }, { key: 'nearbyUrbanDevelopment', label: 'Desarrollo urbano cercano' },
        { key: 'naturalResources', label: 'Recursos naturales' }, { key: 'vegetationCoverage', label: 'Cobertura vegetal' }
      ],
      commercial: [
        withUnit('constructionArea', 'Área de construcción'), { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' },
        { key: 'commercialFront', label: 'Frente comercial' }, { key: 'parking', label: 'Parqueo', icon: 'parking' },
        { key: 'trafficLevel', label: 'Nivel de tráfico' }, { key: 'streetType', label: 'Tipo de calle' }, { key: 'commercialZone', label: 'Zona comercial' },
        { key: 'security', label: 'Seguridad' }, { key: 'internalWarehouse', label: 'Bodega interna' },
        { key: 'basicServices', label: 'Servicios básicos' }, { key: 'permittedUse', label: 'Uso permitido' }, { key: 'idealFor', label: 'Ideal para' }
      ],
      warehouse: [
        withUnit('constructionArea', 'Área de construcción'), { key: 'height', label: 'Altura' }, { key: 'truckAccess', label: 'Acceso para camiones' },
        { key: 'internalOffices', label: 'Oficinas internas' }, { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' },
        { key: 'parking', label: 'Parqueo', icon: 'parking' }, { key: 'security', label: 'Seguridad' },
        { key: 'threePhasePower', label: 'Energía trifásica' }, { key: 'industrialZone', label: 'Zona industrial / comercial' },
        { key: 'constructionStatus', label: 'Estado de construcción' }
      ],
      office: [
        withUnit('constructionArea', 'Área de construcción'), { key: 'privateRooms', label: 'Ambientes privados' },
        { key: 'bathrooms', label: 'Baños', icon: 'bathrooms' }, { key: 'parking', label: 'Parqueo', icon: 'parking' },
        { key: 'meetingRoom', label: 'Sala de reuniones' }, { key: 'reception', label: 'Recepción' }, { key: 'security', label: 'Seguridad' },
        { key: 'elevator', label: 'Ascensor' }, { key: 'furnished', label: 'Amueblada' }, { key: 'connectivity', label: 'Internet / conectividad' },
        { key: 'corporateLocation', label: 'Ubicación corporativa' }
      ],
      investment: [
        withUnit('totalArea', 'Área total'), { key: 'areaUnit', label: 'Unidad de área', icon: 'area' }, { key: 'projectType', label: 'Tipo de proyecto' },
        { key: 'potentialUse', label: 'Uso potencial' }, { key: 'existingPermits', label: 'Permisos existentes' },
        { key: 'availableStudies', label: 'Estudios disponibles' }, { key: 'accesses', label: 'Accesos' }, { key: 'basicServices', label: 'Servicios básicos' },
        { key: 'capitalGainProjection', label: 'Proyección de plusvalía' }, { key: 'mainRoadsProximity', label: 'Cercanía a vías principales' },
        { key: 'documentation', label: 'Documentación' }, { key: 'investorIdeal', label: 'Ideal para inversionistas' }
      ],
      other: [{ key: 'specificFeatures', label: 'Características específicas' }]
    };
    const fields = (definitions[type] || [commonArea]).map((field) => {
      if (field && typeof field.value === 'function') return { ...field, value: field.value(property) };
      return field;
    });
    const details = buildDisplayDetails(property, fields);
    return details.length ? details : buildDisplayDetails(property, [commonArea]);
  }

  global.inmoPropertyUtils = {
    USD_TO_NIO_RATE,
    PROPERTY_TYPE_LABELS,
    PROPERTY_STATUS_LABELS,
    AREA_UNITS,
    normalizePropertyType,
    getPropertyTypeLabel,
    normalizeStatus,
    getPropertyStatusLabel,
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
