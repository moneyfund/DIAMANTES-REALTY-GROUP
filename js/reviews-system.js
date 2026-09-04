import {
  db,
  auth,
  provider,
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  onAuthStateChanged,
  signInWithPopup
} from './firebase-services.js';

const MAX_ITEMS = 120;

const state = {
  propertyId: '',
  initializedFor: '',
  user: null,
  authReady: false,
  authBound: false,
  reviewRating: 0,
  comments: [],
  reviews: [],
  commentsStatus: 'idle',
  reviewsStatus: 'idle',
  submittingComment: false,
  submittingReview: false,
  unsubscribers: []
};

function getPropertyIdFromUrl() {
  return String(new URLSearchParams(window.location.search).get('id') || '').trim();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getInitials(name = 'Usuario') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.length ? parts.map((part) => part[0]?.toUpperCase() || '').join('') : 'U';
}

function formatDate(value) {
  const rawDate = value?.toDate ? value.toDate() : new Date(value || Date.now());
  if (Number.isNaN(rawDate.getTime())) return '';
  return new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeStyle: 'short' }).format(rawDate);
}

function starSvg(filled = false) {
  return `<svg class="pi-star-icon ${filled ? 'is-filled' : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.6l2.63 5.32 5.87.85-4.25 4.14 1 5.84L12 17.03l-5.25 2.72 1-5.84L3.5 9.77l5.87-.85L12 3.6z"></path></svg>`;
}

function renderStars(rating = 0) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, index) => starSvg(index < safeRating)).join('');
}

function normalizeSnapshot(snapshot) {
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() || {};
    return {
      id: docSnap.id,
      userId: String(data.userId || '').trim(),
      userName: data.userName || data.authorName || 'Usuario',
      userPhoto: data.userPhoto || '',
      comment: String(data.comment || '').trim(),
      review: String(data.review || '').trim(),
      rating: Math.max(0, Math.min(5, Number(data.rating || 0))),
      createdAt: data.createdAt || null
    };
  });
}

function clearSubscriptions() {
  state.unsubscribers.forEach((unsubscribe) => {
    try { unsubscribe(); } catch (_) {}
  });
  state.unsubscribers = [];
}

function renderDiscussionShell() {
  const section = document.getElementById('propertyReviews');
  if (!section) return false;

  section.innerHTML = `
    <section class="pi-wrap" data-pi-wrap>
      <header class="pi-header">
        <div><h2>Comentarios y reseñas</h2></div>
        <div class="pi-auth" data-pi-auth></div>
      </header>

      <div class="pi-grid pi-grid-two">
        <article class="pi-card">
          <div class="pi-card-head"><h3>Comentarios</h3></div>
          <form data-pi-comment-form>
            <textarea name="comment" rows="4" maxlength="1200" placeholder="Escribe tu comentario..." aria-label="Comentario"></textarea>
            <button type="submit" class="pi-primary-btn">Publicar comentario</button>
            <p class="pi-form-message" data-pi-form-message></p>
          </form>
          <div class="pi-list" data-pi-comment-list aria-live="polite"></div>
        </article>

        <article class="pi-card">
          <div class="pi-card-head"><h3>Reseñas</h3></div>
          <div class="pi-summary">
            <div class="pi-stars" data-pi-average-stars>${renderStars(0)}</div>
            <p><strong data-pi-average-value>0.0</strong>/5</p>
            <p data-pi-review-count>0 reseñas</p>
          </div>
          <form data-pi-review-form>
            <div class="pi-rating-picker" role="radiogroup" aria-label="Selecciona una calificación">
              ${Array.from({ length: 5 }, (_, index) => `<button type="button" class="pi-rate-btn" data-pi-rate="${index + 1}" role="radio" aria-checked="false" aria-label="${index + 1} estrella${index ? 's' : ''}">${starSvg(false)}</button>`).join('')}
            </div>
            <button type="submit" class="pi-primary-btn">Publicar reseña</button>
            <p class="pi-form-message" data-pi-form-message></p>
          </form>
          <div class="pi-list" data-pi-review-list aria-live="polite"></div>
        </article>
      </div>
    </section>
  `;

  const likeMount = document.getElementById('propertyLikeMount');
  if (likeMount) likeMount.replaceChildren();
  return true;
}

function setFormMessage(formSelector, text, type = '') {
  const element = document.querySelector(`${formSelector} [data-pi-form-message]`);
  if (!element) return;
  element.textContent = text;
  element.classList.remove('is-success', 'is-error');
  if (type) element.classList.add(type);
}

function renderAuthBox() {
  const box = document.querySelector('[data-pi-auth]');
  if (!box) return;

  if (!state.authReady) {
    box.replaceChildren();
    return;
  }

  if (!state.user) {
    box.innerHTML = '<button type="button" class="pi-primary-btn pi-login-btn" data-pi-login>Iniciar sesión con Google</button>';
    box.querySelector('[data-pi-login]')?.addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error('No se pudo iniciar sesión con Google:', error);
      }
    });
    return;
  }

  const safeName = escapeHtml(state.user.displayName || 'Usuario');
  const photo = String(state.user.photoURL || '').trim();
  box.innerHTML = `
    <div class="pi-user-pill">
      ${photo ? `<img src="${escapeHtml(photo)}" alt="${safeName}" referrerpolicy="no-referrer">` : `<span class="pi-user-initial">${getInitials(safeName)}</span>`}
      <span>${safeName}</span>
    </div>
  `;
}

function updateFormsAvailability() {
  const commentForm = document.querySelector('[data-pi-comment-form]');
  const reviewForm = document.querySelector('[data-pi-review-form]');

  commentForm?.querySelectorAll('textarea, button').forEach((control) => {
    const submit = control.matches('button[type="submit"]');
    control.disabled = state.submittingComment || (submit && (!state.authReady || !state.user));
  });

  reviewForm?.querySelectorAll('button').forEach((control) => {
    const submit = control.matches('button[type="submit"]');
    control.disabled = state.submittingReview || (submit && (!state.authReady || !state.user));
  });
}

function paintRatingPicker(value = 0) {
  const activeValue = Math.max(0, Math.min(5, Number(value) || 0));
  document.querySelectorAll('[data-pi-rate]').forEach((button) => {
    const current = Number(button.dataset.piRate || 0);
    const filled = current <= activeValue;
    button.classList.toggle('is-active', filled);
    button.setAttribute('aria-checked', String(current === activeValue));
    button.innerHTML = starSvg(filled);
  });
}

function renderCommentList() {
  const list = document.querySelector('[data-pi-comment-list]');
  if (!list) return;

  if (state.commentsStatus === 'error') {
    list.innerHTML = '<p class="pi-status">No se pudieron cargar los comentarios. <button type="button" class="button-outline" data-pi-retry-comments>Reintentar</button></p>';
    list.querySelector('[data-pi-retry-comments]')?.addEventListener('click', restartSubscriptions);
    return;
  }

  if (!state.comments.length) {
    list.replaceChildren();
    return;
  }

  list.innerHTML = state.comments.map((item) => {
    const userName = escapeHtml(item.userName || 'Usuario');
    const text = escapeHtml(item.comment || '');
    const photo = String(item.userPhoto || '').trim();
    const avatar = photo
      ? `<img src="${escapeHtml(photo)}" alt="${userName}" referrerpolicy="no-referrer">`
      : `<span class="pi-avatar-fallback">${getInitials(userName)}</span>`;

    return `
      <article class="pi-item">
        <div class="pi-item-head">
          <div class="pi-avatar">${avatar}</div>
          <div><strong>${userName}</strong><small>${formatDate(item.createdAt)}</small></div>
        </div>
        <p>${text}</p>
      </article>
    `;
  }).join('');
}

function renderReviewList() {
  const list = document.querySelector('[data-pi-review-list]');
  const avgStars = document.querySelector('[data-pi-average-stars]');
  const avgValue = document.querySelector('[data-pi-average-value]');
  const count = document.querySelector('[data-pi-review-count]');
  if (!list || !avgStars || !avgValue || !count) return;

  const total = state.reviews.length;
  const average = total ? state.reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total : 0;
  avgStars.innerHTML = renderStars(Math.round(average));
  avgValue.textContent = average.toFixed(1);
  count.textContent = `${total} reseña${total === 1 ? '' : 's'}`;

  if (state.reviewsStatus === 'error') {
    list.innerHTML = '<p class="pi-status">No se pudieron cargar las reseñas. <button type="button" class="button-outline" data-pi-retry-reviews>Reintentar</button></p>';
    list.querySelector('[data-pi-retry-reviews]')?.addEventListener('click', restartSubscriptions);
    return;
  }

  if (!state.reviews.length) {
    list.replaceChildren();
    return;
  }

  list.innerHTML = state.reviews.map((item) => {
    const userName = escapeHtml(item.userName || 'Usuario');
    const photo = String(item.userPhoto || '').trim();
    const avatar = photo
      ? `<img src="${escapeHtml(photo)}" alt="${userName}" referrerpolicy="no-referrer">`
      : `<span class="pi-avatar-fallback">${getInitials(userName)}</span>`;

    return `
      <article class="pi-item">
        <div class="pi-item-head">
          <div class="pi-avatar">${avatar}</div>
          <div>
            <strong>${userName}</strong>
            <div class="pi-inline-stars">${renderStars(item.rating || 0)}</div>
            <small>${formatDate(item.createdAt)}</small>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function subscribeComments() {
  state.commentsStatus = 'loading';
  try {
    const commentsQuery = query(
      collection(db, 'properties', state.propertyId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(MAX_ITEMS)
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      state.comments = normalizeSnapshot(snapshot);
      state.commentsStatus = 'success';
      renderCommentList();
    }, (error) => {
      console.error('No se pudieron cargar comentarios:', error);
      state.comments = [];
      state.commentsStatus = 'error';
      renderCommentList();
    });

    state.unsubscribers.push(unsubscribe);
  } catch (error) {
    console.error('No se pudieron iniciar comentarios:', error);
    state.commentsStatus = 'error';
    renderCommentList();
  }
}

function subscribeReviews() {
  state.reviewsStatus = 'loading';
  try {
    const reviewsQuery = query(
      collection(db, 'properties', state.propertyId, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(MAX_ITEMS)
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      state.reviews = normalizeSnapshot(snapshot);
      state.reviewsStatus = 'success';
      renderReviewList();
    }, (error) => {
      console.error('No se pudieron cargar reseñas:', error);
      state.reviews = [];
      state.reviewsStatus = 'error';
      renderReviewList();
    });

    state.unsubscribers.push(unsubscribe);
  } catch (error) {
    console.error('No se pudieron iniciar reseñas:', error);
    state.reviewsStatus = 'error';
    renderReviewList();
  }
}

function restartSubscriptions() {
  if (!state.propertyId) return;
  clearSubscriptions();
  subscribeComments();
  subscribeReviews();
}

function bindCommentForm() {
  const form = document.querySelector('[data-pi-comment-form]');
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.user) {
      setFormMessage('[data-pi-comment-form]', 'Debes iniciar sesión para comentar.', 'is-error');
      return;
    }

    const comment = String(form.querySelector('textarea[name="comment"]')?.value || '').trim();
    if (!comment) {
      setFormMessage('[data-pi-comment-form]', 'Escribe un comentario para continuar.', 'is-error');
      return;
    }

    state.submittingComment = true;
    updateFormsAvailability();

    try {
      await addDoc(collection(db, 'properties', state.propertyId, 'comments'), {
        propertyId: state.propertyId,
        userId: state.user.uid,
        userName: state.user.displayName || 'Usuario',
        userPhoto: state.user.photoURL || '',
        comment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      form.reset();
      setFormMessage('[data-pi-comment-form]', 'Comentario publicado correctamente.', 'is-success');
    } catch (error) {
      console.error('No se pudo guardar comentario:', error);
      setFormMessage('[data-pi-comment-form]', 'No se pudo publicar el comentario.', 'is-error');
    } finally {
      state.submittingComment = false;
      updateFormsAvailability();
    }
  });
}

function bindReviewForm() {
  const form = document.querySelector('[data-pi-review-form]');
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.querySelectorAll('[data-pi-rate]').forEach((button) => {
    button.addEventListener('click', () => {
      state.reviewRating = Number(button.dataset.piRate || 0);
      paintRatingPicker(state.reviewRating);
      setFormMessage('[data-pi-review-form]', '');
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.user) {
      setFormMessage('[data-pi-review-form]', 'Debes iniciar sesión para publicar una reseña.', 'is-error');
      return;
    }
    if (!state.reviewRating) {
      setFormMessage('[data-pi-review-form]', 'Selecciona de 1 a 5 estrellas.', 'is-error');
      return;
    }

    state.submittingReview = true;
    updateFormsAvailability();

    try {
      await addDoc(collection(db, 'properties', state.propertyId, 'reviews'), {
        propertyId: state.propertyId,
        userId: state.user.uid,
        userName: state.user.displayName || 'Usuario',
        userPhoto: state.user.photoURL || '',
        rating: state.reviewRating,
        review: '',
        comment: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      state.reviewRating = 0;
      paintRatingPicker(0);
      setFormMessage('[data-pi-review-form]', 'Reseña publicada correctamente.', 'is-success');
    } catch (error) {
      console.error('No se pudo guardar reseña:', error);
      setFormMessage('[data-pi-review-form]', 'No se pudo publicar la reseña.', 'is-error');
    } finally {
      state.submittingReview = false;
      updateFormsAvailability();
    }
  });
}

function bindAuth() {
  if (state.authBound) return;
  state.authBound = true;

  onAuthStateChanged(auth, (user) => {
    state.user = user;
    state.authReady = true;
    renderAuthBox();
    updateFormsAvailability();
  });
}

function initInteractionSystem(propertyIdFromEvent = '') {
  const propertyId = String(propertyIdFromEvent || getPropertyIdFromUrl() || '').trim();
  if (!propertyId) return;

  const reviewsSection = document.getElementById('propertyReviews');
  if (!reviewsSection) return;

  const shellExists = Boolean(reviewsSection.querySelector('[data-pi-wrap]'));
  if (state.initializedFor === propertyId && shellExists) return;

  if (state.initializedFor && state.initializedFor !== propertyId) clearSubscriptions();

  state.propertyId = propertyId;
  state.initializedFor = propertyId;
  state.reviewRating = 0;
  state.comments = [];
  state.reviews = [];
  state.commentsStatus = 'idle';
  state.reviewsStatus = 'idle';

  if (!renderDiscussionShell()) return;

  bindAuth();
  bindCommentForm();
  bindReviewForm();
  renderAuthBox();
  updateFormsAvailability();
  paintRatingPicker(0);
  renderCommentList();
  renderReviewList();
  restartSubscriptions();
}

function queueInit(event) {
  const propertyId = event?.detail?.propertyId || '';
  window.requestAnimationFrame(() => initInteractionSystem(propertyId));
}

window.addEventListener('propertyDetailReady', queueInit);
window.addEventListener('DOMContentLoaded', queueInit, { once: true });
window.addEventListener('beforeunload', clearSubscriptions);
