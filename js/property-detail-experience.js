(() => {
  'use strict';

  let activeProperty = null;
  let shareRenderToken = 0;
  let observerFrame = 0;
  const agentCache = new Map();
  const agentRequests = new Map();

  function cleanPhone(value = '') {
    return String(value || '').replace(/\D+/g, '');
  }

  function extractPhone(value = '') {
    const raw = String(value || '').trim();
    if (!raw) return '';

    if (raw.includes('wa.me/') || raw.includes('api.whatsapp.com') || raw.includes('whatsapp.com/send')) {
      try {
        const parsed = new URL(raw);
        const queryPhone = cleanPhone(parsed.searchParams.get('phone') || '');
        if (queryPhone) return queryPhone;
        const pathPhone = cleanPhone(parsed.pathname.replace(/\//g, ''));
        if (pathPhone) return pathPhone;
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

  function getAgentId(property = {}) {
    return String(
      property.agentId ||
      property.agenteId ||
      property.agentUid ||
      property.agenteUid ||
      property.createdBy ||
      property.ownerId ||
      ''
    ).trim();
  }

  function getAgentEmail(property = {}) {
    return String(
      property.agentEmail ||
      property.createdByEmail ||
      property.ownerEmail ||
      property.email ||
      ''
    ).trim().toLowerCase();
  }

  async function fetchAgentFromCompat(property = {}) {
    const db = window.firebase?.firestore?.();
    if (!db?.collection) return null;

    const agentId = getAgentId(property);
    if (agentId) {
      try {
        const snap = await db.collection('agents').doc(agentId).get();
        if (snap.exists) return { id: snap.id, ...snap.data() };
      } catch (error) {
        console.warn('[PropertyExperience] No se pudo consultar el agente por ID.', error);
      }
    }

    const email = getAgentEmail(property);
    if (email) {
      try {
        const query = await db.collection('agents').where('email', '==', email).limit(1).get();
        const doc = query.docs?.[0];
        if (doc) return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.warn('[PropertyExperience] No se pudo consultar el agente por correo.', error);
      }
    }

    return null;
  }

  async function fetchAgentFromClient(property = {}) {
    const client = window.inmoFirebase;
    if (!client?.db?.collection) return null;

    const agentId = getAgentId(property);
    if (agentId) {
      try {
        const snap = await client.db.collection('agents').doc(agentId).get();
        if (snap.exists) return { id: snap.id, ...snap.data() };
      } catch (error) {
        console.warn('[PropertyExperience] No se pudo consultar el agente desde inmoFirebase.', error);
      }
    }

    return null;
  }

  async function loadPublishingAgent(property = {}) {
    const cacheKey = getAgentId(property) || getAgentEmail(property);
    if (!cacheKey) return null;
    if (agentCache.has(cacheKey)) return agentCache.get(cacheKey);
    if (agentRequests.has(cacheKey)) return agentRequests.get(cacheKey);

    const request = (async () => {
      const agent = await fetchAgentFromCompat(property) || await fetchAgentFromClient(property);
      if (agent) agentCache.set(cacheKey, agent);
      return agent;
    })().finally(() => {
      agentRequests.delete(cacheKey);
    });

    agentRequests.set(cacheKey, request);
    return request;
  }

  function getPropertyKey(property = {}) {
    return String(property.id || new URLSearchParams(window.location.search).get('id') || property.titulo || property.title || '').trim();
  }

  function buildWhatsappUrl(phone, property = {}) {
    const title = String(property.titulo || property.title || 'Propiedad').trim();
    const message = encodeURIComponent(`Hola, quisiera más información sobre la propiedad: ${title}. La vi en Diamantes Realty Group. ${window.location.href}`);
    return `https://wa.me/${phone}?text=${message}`;
  }

  function upsertWhatsappButton(panel, phone, property = {}) {
    if (!panel || !phone) return;

    const propertyKey = getPropertyKey(property);
    const url = buildWhatsappUrl(phone, property);
    let link = panel.querySelector('.property-agent-whatsapp-cta');

    if (!link) {
      link = document.createElement('a');
      link.className = 'property-agent-whatsapp-cta';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      panel.appendChild(link);
    }

    link.dataset.propertyKey = propertyKey;
    link.href = url;
    link.textContent = 'Más información';
    link.setAttribute('aria-label', `Solicitar más información sobre ${String(property.titulo || property.title || 'esta propiedad').trim()} por WhatsApp`);
    link.hidden = false;
  }

  async function ensureShareActions(property = activeProperty, attempt = 0) {
    if (!property) return;

    const panel = document.querySelector('.property-share-panel');
    if (!panel) return;

    // Keep only the principal share action and the agent CTA.
    panel.querySelector('.property-share-options')?.remove();

    const propertyKey = getPropertyKey(property);
    const existing = panel.querySelector('.property-agent-whatsapp-cta');
    if (existing?.dataset.propertyKey === propertyKey && /^https:\/\/wa\.me\//i.test(existing.href)) {
      return;
    }

    const directPhone = resolveAgentPhone({}, property);
    if (directPhone) {
      upsertWhatsappButton(panel, directPhone, property);
      return;
    }

    const token = ++shareRenderToken;
    const agent = await loadPublishingAgent(property);
    if (token !== shareRenderToken || property !== activeProperty) return;

    const phone = resolveAgentPhone(agent || {}, property);
    if (phone) {
      upsertWhatsappButton(panel, phone, property);
      return;
    }

    // Firebase/Auth can still be settling during the first render on a hard refresh.
    // Retry briefly without ever removing a valid button already on screen.
    if (attempt < 4) {
      window.setTimeout(() => ensureShareActions(property, attempt + 1), 350 + attempt * 250);
    }
  }

  function scheduleShareCheck() {
    window.cancelAnimationFrame(observerFrame);
    observerFrame = window.requestAnimationFrame(() => {
      observerFrame = 0;
      ensureShareActions(activeProperty);
    });
  }

  function observePropertyDetail() {
    const root = document.getElementById('propertyDetail');
    if (!root || !('MutationObserver' in window)) return;

    const observer = new MutationObserver((mutations) => {
      const shareChanged = mutations.some((mutation) =>
        Array.from(mutation.addedNodes || []).some((node) =>
          node instanceof Element && (
            node.matches?.('.property-share-panel, .property-agent-whatsapp-cta') ||
            node.querySelector?.('.property-share-panel')
          )
        )
      );
      if (shareChanged) scheduleShareCheck();
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  window.addEventListener('propertyDetailReady', (event) => {
    activeProperty = event.detail?.property || activeProperty;
    shareRenderToken += 1;
    ensureShareActions(activeProperty);
  });

  window.addEventListener('DOMContentLoaded', () => {
    observePropertyDetail();
    scheduleShareCheck();
  }, { once: true });
})();
