(() => {
  'use strict';

  let activeProperty = null;
  let activeRequestToken = 0;
  const agentCache = new Map();

  function getFirebaseClient() {
    return window.inmoFirebase || null;
  }

  function cleanPhone(value = '') {
    return String(value || '').replace(/\D+/g, '');
  }

  function extractPhone(value = '') {
    const raw = String(value || '').trim();
    if (!raw) return '';

    if (raw.includes('wa.me/') || raw.includes('api.whatsapp.com') || raw.includes('whatsapp.com/send')) {
      try {
        const parsed = new URL(raw);
        const pathPhone = cleanPhone(parsed.pathname.replace(/\//g, ''));
        if (pathPhone) return pathPhone;
        const queryPhone = cleanPhone(parsed.searchParams.get('phone') || '');
        if (queryPhone) return queryPhone;
      } catch (_) {}
    }

    return cleanPhone(raw);
  }

  function resolveAgentPhone(agent = {}, property = {}) {
    const values = [
      agent.whatsapp,
      agent.whatsApp,
      agent.phone,
      agent.telefono,
      agent.mobile,
      property.agentWhatsapp,
      property.agentWhatsApp,
      property.agentPhone,
      property.agentTelefono,
      property.whatsapp,
      property.telefonoAgente
    ];

    for (const value of values) {
      const phone = extractPhone(value);
      if (phone) return phone;
    }
    return '';
  }

  function getAgentIdentityCandidates(property = {}) {
    return [property.agentId, property.agenteId, property.createdBy, property.ownerId, property.userId]
      .map((value) => String(value || '').trim())
      .filter(Boolean);
  }

  function getAgentEmailCandidates(property = {}) {
    return [property.agentEmail, property.createdByEmail, property.ownerEmail, property.email]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);
  }

  async function loadPublishingAgent(property = {}) {
    const client = getFirebaseClient();
    if (!client?.enabled || !client.db?.collection) return null;

    const ids = getAgentIdentityCandidates(property);
    for (const agentId of ids) {
      if (agentCache.has(`id:${agentId}`)) return agentCache.get(`id:${agentId}`);
      try {
        const snap = await client.db.collection('agents').doc(agentId).get();
        if (snap.exists) {
          const agent = { id: snap.id, ...snap.data() };
          agentCache.set(`id:${agentId}`, agent);
          return agent;
        }
      } catch (error) {
        console.warn('[PropertyExperience] No se pudo cargar agente por ID.', error);
      }
    }

    for (const email of getAgentEmailCandidates(property)) {
      if (agentCache.has(`email:${email}`)) return agentCache.get(`email:${email}`);
      try {
        const query = await client.db.collection('agents').where('email', '==', email).limit(1).get();
        const first = query.docs?.[0];
        if (first) {
          const agent = { id: first.id, ...first.data() };
          agentCache.set(`email:${email}`, agent);
          return agent;
        }
      } catch (error) {
        console.warn('[PropertyExperience] No se pudo cargar agente por correo.', error);
      }
    }

    return null;
  }

  function getCanonicalCta(panel) {
    const existing = [...panel.querySelectorAll('.property-agent-whatsapp-cta')];
    const canonical = existing[0] || document.createElement('a');

    existing.slice(1).forEach((node) => node.remove());

    canonical.className = 'property-agent-whatsapp-cta';
    canonical.id = 'propertyAgentWhatsappCta';
    canonical.target = '_blank';
    canonical.rel = 'noopener noreferrer';
    canonical.textContent = 'Más información';

    if (!canonical.isConnected) panel.appendChild(canonical);
    return canonical;
  }

  function updateCtaLink(link, property, phone) {
    if (!link || !phone) return false;
    const title = String(property.titulo || property.title || 'Propiedad').trim();
    const message = encodeURIComponent(`Hola, quisiera más información sobre la propiedad: ${title}. La vi en Diamantes Realty Group. ${window.location.href}`);
    link.href = `https://wa.me/${phone}?text=${message}`;
    link.setAttribute('aria-label', `Solicitar más información sobre ${title} por WhatsApp`);
    link.classList.remove('is-disabled', 'is-loading');
    link.removeAttribute('aria-hidden');
    link.dataset.ready = 'true';
    return true;
  }

  async function ensureAgentWhatsappCta(property = activeProperty) {
    if (!property) return;

    const panel = document.querySelector('.property-share-panel');
    if (!panel) return;

    panel.querySelector('.property-share-options')?.remove();

    const token = ++activeRequestToken;
    const link = getCanonicalCta(panel);

    const immediatePhone = resolveAgentPhone({}, property);
    if (immediatePhone) {
      updateCtaLink(link, property, immediatePhone);
      return;
    }

    link.classList.add('is-loading');
    link.removeAttribute('href');
    link.setAttribute('aria-hidden', 'true');

    const agent = await loadPublishingAgent(property);
    if (token !== activeRequestToken || !panel.isConnected || !link.isConnected) return;

    const phone = resolveAgentPhone(agent || {}, property);
    if (!phone) {
      link.classList.add('is-disabled');
      link.classList.remove('is-loading');
      return;
    }

    updateCtaLink(link, property, phone);
  }

  function applyPropertyExperience(property) {
    if (property) activeProperty = property;
    if (!activeProperty) return;
    window.__drgActivePropertyDetail = activeProperty;
    ensureAgentWhatsappCta(activeProperty);
  }

  window.addEventListener('propertyDetailReady', (event) => {
    applyPropertyExperience(event.detail?.property || null);
  });

  document.addEventListener('inmo:firebase-ready', () => {
    if (activeProperty) ensureAgentWhatsappCta(activeProperty);
  });
})();