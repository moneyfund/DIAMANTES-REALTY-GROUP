(() => {
  'use strict';

  const imageUtils = window.inmoImageUtils || {};
  const propertyUtils = window.inmoPropertyUtils || {};
  const publicFilter = window.inmoPublicPropertyFilter || {};
  const placeholder = imageUtils.PLACEHOLDER || 'assets/placeholder.svg';

  const escape = (value = '') => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const normalize = (value = '') => String(value || '').trim().toLowerCase();
  const normalizeName = (value = '') => normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function getAgentIdentifiers(agent = {}, agentId = '') {
    return new Set([
      agentId,
      agent.id,
      agent.uid,
      agent.userId,
      agent.agentId,
      agent.email
    ].map(normalize).filter(Boolean));
  }

  function propertyBelongsToAgent(property = {}, agent = {}, agentId = '') {
    const identifiers = getAgentIdentifiers(agent, agentId);
    const propertyIdentifiers = [
      property.agentId,
      property.agenteId,
      property.ownerId,
      property.userId,
      property.createdBy,
      property.createdByUid,
      property.agentEmail,
      property.createdByEmail,
      property.ownerEmail,
      property.email
    ].map(normalize).filter(Boolean);

    if (propertyIdentifiers.some((value) => identifiers.has(value))) return true;

    const agentName = normalizeName(agent.name || agent.nombre || agent.displayName || '');
    const propertyAgentName = normalizeName(property.agentName || property.agenteNombre || property.createdByName || '');
    return Boolean(agentName && propertyAgentName && agentName === propertyAgentName);
  }

  function featureIcon(iconName = '') {
    const icons = {
      bedrooms: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V7.6A1.6 1.6 0 0 1 5.6 6h3.8A1.6 1.6 0 0 1 11 7.6V11h2V9.6A1.6 1.6 0 0 1 14.6 8h3.8A1.6 1.6 0 0 1 20 9.6V18h-2v-2H6v2H4v-7Zm2 3h12v-1H6v1Z"/></svg>',
      bathrooms: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v3H8V3Zm9 5v3a5 5 0 0 1-4 4.9V19h2v2H9v-2h2v-3.1A5 5 0 0 1 7 11V8h10Zm-2 3V10H9v1a3 3 0 0 0 6 0Z"/></svg>',
      parking: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h8a4 4 0 1 1 0 8H9v6H6V5Zm3 5h5a1 1 0 1 0 0-2H9v2Z"/></svg>',
      area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 6 0v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"/></svg>',
      location: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>',
      type: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"/></svg>'
    };
    return icons[iconName] || '';
  }

  function getOperationLabel(property = {}) {
    const raw = property.operationType ?? property.tipoOperacion ?? property.operation ?? property.operacion ?? property.transactionType ?? property.listingType ?? '';
    const normalized = propertyUtils.normalizeOperation ? propertyUtils.normalizeOperation(raw) : normalize(raw);
    return ({ venta: 'Venta', alquiler: 'Alquiler', venta_renta: 'Venta o alquiler' })[normalized] || String(raw || 'Venta');
  }

  function getPrice(property = {}) {
    return propertyUtils.getPriceUsd ? propertyUtils.getPriceUsd(property) : Number(property.priceUsd ?? property.price ?? property.precio ?? 0);
  }

  function propertyCardLikeHome(property = {}) {
    const status = normalize(property.status || property.estado || 'available');
    const title = property.title || property.titulo || property.propertyTitle || property.nombre || 'Propiedad';
    const location = property.city || property.ubicacion || property.location || 'Ubicación no disponible';
    const type = propertyUtils.getPropertyTypeLabel
      ? propertyUtils.getPropertyTypeLabel(property.propertyType || property.type || property.tipo || '')
      : (property.propertyType || property.type || property.tipo || 'Propiedad');
    const price = getPrice(property);
    const detailUrl = `propiedad.html?id=${encodeURIComponent(String(property.id || ''))}`;
    const image = imageUtils.getCoverImage ? imageUtils.getCoverImage(property) : (property.coverImage || property.image || property.imagen || placeholder);
    const details = propertyUtils.getPropertyDisplayDetails ? propertyUtils.getPropertyDisplayDetails(property).slice(0, 3) : [];
    const pricePerArea = propertyUtils.getPricePerAreaUsd ? propertyUtils.getPricePerAreaUsd(property) : Number(property.pricePerAreaUsd || 0);
    const areaUnit = property.areaUnit || property.propertyDetails?.areaUnit || '';
    const priceMarkup = propertyUtils.formatDualPriceMarkup
      ? propertyUtils.formatDualPriceMarkup(price)
      : `$${Number(price || 0).toLocaleString()} USD`;
    const pricePerAreaMarkup = Number.isFinite(pricePerArea) && pricePerArea > 0 && areaUnit && propertyUtils.formatPricePerArea
      ? `<p class="property-price-area">${escape(propertyUtils.formatPricePerArea(pricePerArea, areaUnit))}</p>`
      : '';
    const isSold = ['sold', 'vendida', 'vendido'].includes(status);
    const isExclusive = Boolean(property.exclusive || property.exclusiva || status === 'exclusive' || status === 'exclusiva');
    const specialBadges = [
      property.featured ? '<span class="property-media-badge property-media-badge--special">Destacada</span>' : '',
      isSold ? '<span class="property-media-badge property-media-badge--sold">Vendida</span>' : '',
      isExclusive ? '<span class="property-media-badge property-media-badge--special">Exclusiva</span>' : ''
    ].filter(Boolean).join('');

    return `
      <article class="property-card public-property-card${property.featured ? ' is-featured' : ''}">
        <div class="property-card-shell">
          <a class="property-card-media property-cover property-cover-link" href="${detailUrl}" data-property-link aria-label="Ver detalle de ${escape(title)}">
            <img class="property-cover-image" src="${escape(image)}" alt="${escape(title)}" loading="lazy" onerror="this.onerror=null;this.src='${placeholder}'">
            <span class="property-media-gradient" aria-hidden="true"></span>
            <span class="property-media-badges property-media-badges--primary">
              <span class="property-media-badge">${escape(getOperationLabel(property))}</span>
              <span class="property-media-badge property-media-badge--type">${escape(type || 'Propiedad')}</span>
            </span>
            ${specialBadges ? `<span class="property-media-badges property-media-badges--special">${specialBadges}</span>` : ''}
          </a>
          <div class="property-card-body property-card-content">
            <p class="property-location">${featureIcon('location')}<span>${escape(location)}</span></p>
            <h3><a class="property-title-link" href="${detailUrl}" data-property-link>${escape(title)}</a></h3>
            <p class="price">${priceMarkup}</p>
            <div class="property-features property-meta property-meta-icons">
              ${details.map((detail) => `<span>${featureIcon(detail.icon)}<span>${escape(detail.value)} ${escape(detail.label).toLowerCase()}</span></span>`).join('')}
            </div>
            ${pricePerAreaMarkup}
          </div>
          <div class="property-card-footer property-card-actions">
            <a class="property-detail-button btn-primary-property" href="${detailUrl}" data-property-link>Ver propiedad</a>
          </div>
        </div>
      </article>
    `;
  }

  const originalRenderAgentProfile = window.renderAgentProfile;
  if (typeof window.propertyCard === 'function') {
    window.propertyCard = propertyCardLikeHome;
  }

  if (typeof originalRenderAgentProfile === 'function') {
    window.renderAgentProfile = function patchedRenderAgentProfile(agent, properties) {
      const result = originalRenderAgentProfile(agent, properties);
      const totalOwned = Number(agent?.__totalOwnedProperties);
      if (Number.isFinite(totalOwned)) {
        const firstInsight = document.querySelector('.agent-profile-insights .agent-profile-insight');
        const countNode = firstInsight?.querySelector('strong');
        const labelNode = firstInsight?.querySelector('span');
        if (countNode) countNode.textContent = String(totalOwned);
        if (labelNode) labelNode.textContent = 'Propiedades a su nombre';
      }
      return result;
    };
  }

  window.loadAgentProfile = async function loadAgentProfileFixed() {
    const agentId = new URLSearchParams(window.location.search).get('id');
    if (!agentId) {
      window.renderFriendlyMessage?.('No encontramos el agente solicitado. Revisa el enlace e intenta de nuevo.');
      return;
    }

    const client = window.inmoFirebase;
    if (!client?.enabled || !client.db) {
      window.renderFriendlyMessage?.('No pudimos conectar con la base de datos en este momento. Intenta nuevamente en unos minutos.');
      return;
    }

    try {
      const [agentDoc, propertiesSnapshot] = await Promise.all([
        client.db.collection('agents').doc(agentId).get(),
        client.db.collection('properties').get()
      ]);

      if (!agentDoc.exists) {
        window.renderFriendlyMessage?.('El agente solicitado no está disponible o ya no existe.');
        return;
      }

      const agent = { ...agentDoc.data(), id: agentDoc.id };
      const ownedProperties = propertiesSnapshot.docs
        .map((doc) => ({ ...doc.data(), id: doc.id }))
        .filter((property) => propertyBelongsToAgent(property, agent, agentId));
      const publicProperties = ownedProperties.filter((property) => publicFilter.isPublicProperty ? publicFilter.isPublicProperty(property) : true);

      window.renderAgentProfile?.({ ...agent, __totalOwnedProperties: ownedProperties.length }, publicProperties);
    } catch (error) {
      console.error('Error loading agent profile:', error);
      window.renderFriendlyMessage?.('Tuvimos un problema al cargar el perfil. Por favor, inténtalo más tarde.');
    }
  };
})();
