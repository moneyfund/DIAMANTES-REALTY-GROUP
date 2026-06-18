(function attachPropertyFieldsConfig(global) {
  const PROPERTY_FIELDS_CONFIG = {
  house: [
    ['bedrooms', 'number', 'Habitaciones'], ['bathrooms', 'number', 'Baños'], ['constructionArea', 'number', 'Área de construcción'], ['landArea', 'number', 'Área de terreno'],
    ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas']], ['levels', 'number', 'Niveles'], ['garage', 'select', 'Garaje', ['Sí', 'No']],
    ['livingRoom', 'select', 'Sala', ['Sí', 'No']], ['diningRoom', 'select', 'Comedor', ['Sí', 'No']], ['kitchen', 'select', 'Cocina', ['Sí', 'No']],
    ['patio', 'select', 'Patio', ['Sí', 'No']], ['terrace', 'select', 'Terraza', ['Sí', 'No']], ['laundryArea', 'select', 'Área de lavado', ['Sí', 'No']],
    ['security', 'text', 'Seguridad'], ['constructionStatus', 'text', 'Estado de construcción'], ['furnished', 'select', 'Amueblada', ['Sí', 'No']]
  ],
  apartment: [
    ['bedrooms', 'number', 'Habitaciones'], ['bathrooms', 'number', 'Baños'], ['constructionArea', 'number', 'Área de construcción'], ['floorLevel', 'text', 'Piso / nivel'],
    ['parking', 'select', 'Parqueo', ['Sí', 'No']], ['elevator', 'select', 'Ascensor', ['Sí', 'No']], ['security', 'text', 'Seguridad'], ['balcony', 'select', 'Balcón', ['Sí', 'No']],
    ['furnished', 'select', 'Amueblado', ['Sí', 'No']], ['maintenanceFee', 'number', 'Cuota de mantenimiento'], ['amenities', 'textarea', 'Amenidades']
  ],
  quinta: [
    ['bedrooms', 'number', 'Habitaciones'], ['bathrooms', 'number', 'Baños'], ['constructionArea', 'number', 'Área de construcción'], ['landArea', 'number', 'Área de terreno'],
    ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas']], ['pool', 'select', 'Piscina', ['Sí', 'No']], ['gardens', 'select', 'Jardines', ['Sí', 'No']],
    ['socialArea', 'select', 'Área social', ['Sí', 'No']], ['mainHouse', 'select', 'Casa principal', ['Sí', 'No']], ['caretakerHouse', 'select', 'Casa de cuidador', ['Sí', 'No']],
    ['well', 'select', 'Pozo', ['Sí', 'No']], ['vehicleAccess', 'text', 'Acceso vehicular'], ['streetType', 'text', 'Tipo de calle'], ['naturalEnvironment', 'text', 'Entorno natural'],
    ['potentialUse', 'select', 'Uso potencial', ['Recreativo', 'Familiar', 'Turístico', 'Inversión']]
  ],
  farm: [
    ['totalArea', 'number', 'Área total'], ['areaUnit', 'select', 'Unidad de área', ['manzanas', 'hectáreas', 'm²']], ['currentUse', 'select', 'Uso actual', ['Ganadería', 'Agricultura', 'Forestal', 'Mixto', 'Descanso', 'Inversión']],
    ['topography', 'select', 'Topografía', ['Plana', 'Semiplana', 'Inclinada', 'Mixta']], ['accessType', 'text', 'Tipo de acceso'], ['streetType', 'text', 'Tipo de calle'],
    ['potableWater', 'select', 'Agua potable', ['Sí', 'No']], ['electricity', 'select', 'Energía eléctrica', ['Sí', 'No']], ['well', 'select', 'Pozo', ['Sí', 'No']],
    ['waterSource', 'text', 'Río / quebrada / fuente de agua'], ['fences', 'select', 'Cercas', ['Sí', 'No']], ['paddocks', 'text', 'Potreros'], ['crops', 'text', 'Cultivos'],
    ['existingInfrastructure', 'textarea', 'Casa o infraestructura existente'], ['documentation', 'textarea', 'Documentación'], ['potentialUse', 'textarea', 'Potencial']
  ],
  land: [
    ['totalArea', 'number', 'Área total'], ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas']], ['landType', 'select', 'Tipo de terreno', ['Urbano', 'Semiurbano', 'Rural', 'Semirural']],
    ['topography', 'select', 'Topografía', ['Plana', 'Semiplana', 'Inclinada', 'Irregular']], ['landShape', 'select', 'Forma del terreno', ['Regular', 'Irregular', 'Rectangular', 'Esquina']],
    ['soilType', 'text', 'Tipo de suelo'], ['accessType', 'text', 'Acceso'], ['streetType', 'select', 'Tipo de calle', ['Pavimentada', 'Adoquinada', 'Tierra', 'Macadán', 'Concreto hidráulico']],
    ['availableServices', 'text', 'Servicios disponibles'], ['environment', 'text', 'Entorno'], ['zoneSecurity', 'text', 'Seguridad de la zona'], ['trafficLevel', 'text', 'Nivel de tráfico'],
    ['potentialUse', 'text', 'Uso potencial'], ['nearbyUrbanDevelopment', 'text', 'Desarrollo urbano cercano'], ['naturalResources', 'text', 'Recursos naturales'], ['vegetationCoverage', 'text', 'Nivel de deforestación o cobertura vegetal']
  ],
  commercial: [
    ['constructionArea', 'number', 'Área de construcción'], ['bathrooms', 'number', 'Baños'], ['commercialFront', 'text', 'Frente comercial'], ['parking', 'select', 'Parqueo', ['Sí', 'No']],
    ['trafficLevel', 'text', 'Nivel de tráfico'], ['streetType', 'text', 'Tipo de calle'], ['commercialZone', 'text', 'Zona comercial'], ['security', 'text', 'Seguridad'],
    ['internalWarehouse', 'select', 'Bodega interna', ['Sí', 'No']], ['basicServices', 'text', 'Servicios básicos'], ['permittedUse', 'text', 'Uso permitido'], ['idealFor', 'text', 'Ideal para']
  ],
  warehouse: [
    ['constructionArea', 'number', 'Área de construcción'], ['height', 'text', 'Altura'], ['truckAccess', 'select', 'Acceso para camiones', ['Sí', 'No']], ['internalOffices', 'select', 'Oficinas internas', ['Sí', 'No']],
    ['bathrooms', 'number', 'Baños'], ['parking', 'select', 'Parqueo', ['Sí', 'No']], ['security', 'text', 'Seguridad'], ['threePhasePower', 'select', 'Energía trifásica', ['Sí', 'No']],
    ['industrialZone', 'text', 'Zona industrial / comercial'], ['constructionStatus', 'text', 'Estado de construcción']
  ],
  office: [
    ['constructionArea', 'number', 'Área de construcción'], ['privateRooms', 'number', 'Ambientes privados'], ['bathrooms', 'number', 'Baños'], ['parking', 'select', 'Parqueo', ['Sí', 'No']],
    ['meetingRoom', 'select', 'Sala de reuniones', ['Sí', 'No']], ['reception', 'select', 'Recepción', ['Sí', 'No']], ['security', 'text', 'Seguridad'], ['elevator', 'select', 'Ascensor', ['Sí', 'No']],
    ['furnished', 'select', 'Amueblada', ['Sí', 'No']], ['connectivity', 'text', 'Internet / conectividad'], ['corporateLocation', 'text', 'Ubicación corporativa']
  ],
  investment: [
    ['totalArea', 'number', 'Área total'], ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas', 'hectáreas']], ['projectType', 'text', 'Tipo de proyecto'], ['potentialUse', 'text', 'Uso potencial'],
    ['existingPermits', 'text', 'Permisos existentes'], ['availableStudies', 'text', 'Estudios disponibles'], ['accesses', 'text', 'Accesos'], ['basicServices', 'text', 'Servicios básicos'],
    ['capitalGainProjection', 'text', 'Proyección de plusvalía'], ['mainRoadsProximity', 'text', 'Cercanía a vías principales'], ['documentation', 'textarea', 'Documentación'], ['investorIdeal', 'textarea', 'Ideal para inversionistas']
  ],
  other: [['specificFeatures', 'textarea', 'Características específicas']]
};

  function getPropertyFieldsConfig() {
    return PROPERTY_FIELDS_CONFIG;
  }

  function getDynamicFieldsForType(type = '') {
    const utils = global.inmoPropertyUtils || {};
    const normalize = typeof utils.normalizePropertyType === 'function'
      ? utils.normalizePropertyType
      : (value = '') => String(value || '').trim().toLowerCase();
    return PROPERTY_FIELDS_CONFIG[normalize(type)] || [];
  }

  global.inmoPropertyFieldsConfig = {
    PROPERTY_FIELDS_CONFIG,
    getPropertyFieldsConfig,
    getDynamicFieldsForType
  };
})(window);
