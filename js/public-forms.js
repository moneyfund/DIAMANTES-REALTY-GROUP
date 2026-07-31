(function initPublicForms() {
  const MIN_FILL_TIME = 2000;
  const SESSION_COOLDOWN = 15000;
  const mountedAt = Date.now();

  const clean = (value, max) => String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  const value = (form, name, max) => clean(form.elements[name]?.value, max);

  function payloadFor(form) {
    const type = form.dataset.publicForm;
    const common = {
      tipo: type,
      nombre: value(form, type === 'contacto' ? 'nombre' : 'name', 100),
      telefono: value(form, type === 'contacto' ? 'telefono' : 'phone', 30),
      correo: value(form, type === 'contacto' ? 'email' : 'email', 160).toLowerCase(),
      mensaje: value(form, type === 'contacto' ? 'mensaje' : 'message', 3000),
      asunto: type === 'contacto' ? 'Contacto web' : value(form, 'property-type', 80),
      estado: 'nuevo',
      origen: 'web-publica',
      paginaOrigen: `${location.pathname}${location.search}`.slice(0, 300)
    };
    if (type === 'quiero-vender') {
      return { ...common, tipoPropiedad: value(form, 'property-type', 80), modalidad: value(form, 'listing-type', 30), ciudad: value(form, 'city', 120) };
    }
    return common;
  }

  function messageNode(form) {
    return form.querySelector('#formMessage, #sellerAuthMessage');
  }

  document.querySelectorAll('form[data-public-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const output = messageNode(form);
      const button = form.querySelector('[type="submit"]');
      const originalLabel = button?.textContent || 'Enviar';
      const fail = (text) => { if (output) { output.textContent = text; output.classList.add('is-error'); } };

      if (!form.checkValidity()) { form.reportValidity(); fail('Completa correctamente todos los campos obligatorios.'); return; }
      if (value(form, 'website', 200)) return;
      if (Date.now() - mountedAt < MIN_FILL_TIME) { fail('Espera unos segundos antes de enviar el formulario.'); return; }
      const cooldownKey = `drg-form-${form.dataset.publicForm}-sent`;
      const lastSent = Number(sessionStorage.getItem(cooldownKey) || 0);
      if (Date.now() - lastSent < SESSION_COOLDOWN) { fail('Tu mensaje ya fue enviado. Espera unos segundos para enviar otro.'); return; }

      const data = payloadFor(form);
      if (!data.nombre || !data.telefono || !data.correo || !data.mensaje || (data.tipo === 'quiero-vender' && (!data.tipoPropiedad || !data.modalidad || !data.ciudad))) {
        fail('No se permiten envíos vacíos. Revisa los campos obligatorios.'); return;
      }
      const client = window.inmoFirebase;
      if (!client?.enabled || !client.db) { fail('No pudimos conectar con el servicio. Conservamos tus datos; intenta nuevamente.'); return; }

      if (button) { button.disabled = true; button.textContent = 'Enviando…'; }
      output?.classList.remove('is-error');
      try {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        await client.db.collection('formularios').add({ ...data, createdAt: timestamp, updatedAt: timestamp });
        sessionStorage.setItem(cooldownKey, String(Date.now()));
        form.reset();
        if (output) output.textContent = data.tipo === 'contacto'
          ? 'Tu mensaje fue enviado correctamente. Nos pondremos en contacto contigo.'
          : 'Tu información fue enviada correctamente. Nuestro equipo evaluará tu propiedad y se pondrá en contacto contigo.';
      } catch (error) {
        console.error('[formularios] No se pudo guardar el envío.', error);
        fail('No fue posible enviar el formulario. Tus datos no se borraron; intenta nuevamente.');
      } finally {
        if (button) { button.disabled = false; button.textContent = originalLabel; }
      }
    });
  });
})();
