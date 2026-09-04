(() => {
  'use strict';

  let activeProperty = null;

  const getPropertyId = () => String(new URLSearchParams(window.location.search).get('id') || '').trim();

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

  async function loadPublishingAgent(property = {}) {
    const agentId = String(property.agentId || property.agenteId || '').trim();
    if (!agentId) return null;
    const client = getFirebaseClient();
    if (!client?.enabled || !client.db?.collection) return null;

    try {
      const snap = await client.db.collection('agents').doc(agentId).get();
      return snap.exists ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
      console.warn('[PropertyExperience] No se pudo cargar el agente para WhatsApp.', error);
      return null;
    }
  }

  async function simplifyShareActions(property = activeProperty) {
    if (!property) return;
    const panel = document.querySelector('.property-share-panel');
    if (!panel) return;

    panel.querySelector('.property-share-options')?.remove();
    panel.querySelector('.property-agent-whatsapp-cta')?.remove();

    const agent = await loadPublishingAgent(property);
    const phone = resolveAgentPhone(agent || {}, property);
    if (!phone) return;

    const title = String(property.titulo || property.title || 'Propiedad').trim();
    const message = encodeURIComponent(`Hola, quisiera más información sobre la propiedad: ${title}. La vi en Diamantes Realty Group. ${window.location.href}`);
    const link = document.createElement('a');
    link.className = 'property-agent-whatsapp-cta';
    link.href = `https://wa.me/${phone}?text=${message}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Más información';
    link.setAttribute('aria-label', `Solicitar más información sobre ${title} por WhatsApp`);
    panel.appendChild(link);
  }

  function setFormMessage(form, text, className = '') {
    const message = form.querySelector('[data-pi-form-message]');
    if (!message) return;
    message.textContent = text;
    message.classList.remove('is-success', 'is-error');
    if (className) message.classList.add(className);
  }

  function selectedRating(form) {
    const active = [...form.querySelectorAll('[data-pi-rate].is-active')]
      .map((button) => Number(button.dataset.piRate || 0))
      .filter(Number.isFinite);
    if (active.length) return Math.max(...active);

    const checked = form.querySelector('[data-pi-rate][aria-checked="true"]');
    return Number(checked?.dataset.piRate || 0);
  }

  async function submitStarsOnlyReview(event, form) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const client = getFirebaseClient();
    const user = client?.currentUser || client?.auth?.currentUser || null;
    const propertyId = getPropertyId();
    const rating = selectedRating(form);

    if (!user) {
      setFormMessage(form, 'Debes iniciar sesión para publicar una reseña.', 'is-error');
      return;
    }
    if (!propertyId) {
      setFormMessage(form, 'No se pudo identificar la propiedad.', 'is-error');
      return;
    }
    if (!rating) {
      setFormMessage(form, 'Selecciona de 1 a 5 estrellas.', 'is-error');
      return;
    }
    if (!client?.db?.collection || !window.firebase?.firestore?.FieldValue) {
      setFormMessage(form, 'No se pudo conectar con el sistema de reseñas.', 'is-error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();
      await client.db.collection('properties').doc(propertyId).collection('reviews').add({
        propertyId,
        userId: user.uid,
        userName: user.displayName || 'Usuario',
        userPhoto: user.photoURL || '',
        rating,
        review: '',
        comment: '',
        createdAt: timestamp,
        updatedAt: timestamp
      });

      form.querySelectorAll('[data-pi-rate]').forEach((button) => {
        button.classList.remove('is-active');
        button.setAttribute('aria-checked', 'false');
        const svg = button.querySelector('.pi-star-icon');
        svg?.classList.remove('is-filled');
      });
      setFormMessage(form, 'Reseña publicada correctamente.', 'is-success');
    } catch (error) {
      console.error('[PropertyExperience] No se pudo publicar la reseña.', error);
      setFormMessage(form, 'No se pudo publicar la reseña.', 'is-error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  function simplifyReviews() {
    const section = document.getElementById('propertyReviews');
    if (!section) return;

    const commentEmpty = section.querySelector('[data-pi-comment-list] .pi-empty');
    if (commentEmpty && /sé el primero en comentar/i.test(commentEmpty.textContent || '')) {
      commentEmpty.remove();
    }

    const reviewEmpty = section.querySelector('[data-pi-review-list] .pi-empty');
    if (reviewEmpty && /todavía no hay reseñas/i.test(reviewEmpty.textContent || '')) {
      reviewEmpty.remove();
    }

    const reviewForm = section.querySelector('[data-pi-review-form]');
    if (!reviewForm) return;

    const card = reviewForm.closest('.pi-card');
    if (card) card.dataset.simpleReviewCard = 'true';
    card?.querySelector('.pi-card-head p')?.remove();
    reviewForm.querySelector('.pi-rating-value')?.remove();
    reviewForm.querySelector('textarea[name="review"]')?.remove();

    if (reviewForm.dataset.starsOnlyBound !== 'true') {
      reviewForm.dataset.starsOnlyBound = 'true';
      reviewForm.addEventListener('submit', (event) => submitStarsOnlyReview(event, reviewForm), true);
    }
  }

  function observeReviewSection() {
    const root = document.getElementById('propertyDetail');
    if (!root || !('MutationObserver' in window)) return;

    const observer = new MutationObserver(() => simplifyReviews());
    observer.observe(root, { childList: true, subtree: true });
    simplifyReviews();
  }

  function applyPropertyExperience(property) {
    if (property) activeProperty = property;
    simplifyShareActions(activeProperty);
    window.setTimeout(simplifyReviews, 0);
    window.setTimeout(simplifyReviews, 250);
    window.setTimeout(simplifyReviews, 900);
  }

  window.addEventListener('propertyDetailReady', (event) => {
    applyPropertyExperience(event.detail?.property || null);
  });

  window.addEventListener('DOMContentLoaded', () => {
    observeReviewSection();
    window.setTimeout(() => applyPropertyExperience(activeProperty), 600);
    window.setTimeout(() => applyPropertyExperience(activeProperty), 1600);
  });
})();
