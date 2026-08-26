(function initPropertySheetReliability() {
  const root = document.getElementById('propertySheetRoot');
  const downloadButton = document.getElementById('downloadPropertySheetPdf');
  const status = document.getElementById('propertySheetStatus');
  const IMAGE_WAIT_TIMEOUT_MS = 8000;
  const PDF_RENDER_TIMEOUT_MS = 30000;
  let isExporting = false;
  let normalizationFrame = 0;

  if (!root || !downloadButton) return;

  function safeUrl(value = '') {
    try {
      return new URL(String(value || ''), window.location.href);
    } catch {
      return null;
    }
  }

  function isDataOrBlobUrl(value = '') {
    return /^(data:|blob:)/i.test(String(value || '').trim());
  }

  function shouldProxy(value = '') {
    const text = String(value || '').trim();
    if (!text || isDataOrBlobUrl(text)) return false;
    const parsed = safeUrl(text);
    if (!parsed || !/^https?:$/.test(parsed.protocol)) return false;
    if (parsed.origin === window.location.origin) return false;

    const host = parsed.hostname.toLowerCase();
    return host === 'firebasestorage.googleapis.com'
      || host === 'storage.googleapis.com'
      || host === 'googleusercontent.com'
      || host.endsWith('.googleusercontent.com');
  }

  function proxiedUrl(value = '') {
    const text = String(value || '').trim();
    if (!shouldProxy(text)) return text;
    return `/api/property-sheet-image?url=${encodeURIComponent(text)}`;
  }

  function restoreImagePresentation(img) {
    img.style.removeProperty('display');
    img.style.removeProperty('visibility');
    img.removeAttribute('crossorigin');
    try { img.crossOrigin = null; } catch {}

    if (img.classList.contains('sheet-hero-image')) {
      img.closest('.sheet-hero')?.classList.remove('sheet-hero--fallback');
    }
  }

  function installFallback(img) {
    if (img.dataset.sheetFallbackBound === '1') return;
    img.dataset.sheetFallbackBound = '1';

    img.addEventListener('error', () => {
      const original = img.dataset.sheetOriginalSrc || img.getAttribute('src') || '';
      console.warn('[PropertySheet] No se pudo cargar imagen:', original);

      if (img.classList.contains('sheet-hero-image')) {
        img.style.display = 'none';
        img.closest('.sheet-hero')?.classList.add('sheet-hero--fallback');
        return;
      }

      if (img.classList.contains('sheet-gallery-image')) {
        img.style.display = 'none';
        return;
      }

      if (!img.src.endsWith('/assets/placeholder.svg') && !img.src.endsWith('assets/placeholder.svg')) {
        img.removeAttribute('crossorigin');
        img.src = 'assets/placeholder.svg';
      }
    });
  }

  function normalizeImage(img) {
    if (!(img instanceof HTMLImageElement)) return;

    const current = img.getAttribute('src') || '';
    if (!current) return;

    if (!img.dataset.sheetOriginalSrc && shouldProxy(current)) {
      img.dataset.sheetOriginalSrc = current;
    }

    const original = img.dataset.sheetOriginalSrc || current;
    const next = proxiedUrl(original);
    restoreImagePresentation(img);
    installFallback(img);

    if (next && current !== next) {
      img.src = next;
    }
  }

  function normalizeAllImages() {
    root.querySelectorAll('img').forEach(normalizeImage);
    document.querySelectorAll('.property-sheet-topbar img').forEach(normalizeImage);
  }

  function scheduleNormalize() {
    if (normalizationFrame) cancelAnimationFrame(normalizationFrame);
    normalizationFrame = requestAnimationFrame(() => {
      normalizationFrame = 0;
      normalizeAllImages();
    });
  }

  const observer = new MutationObserver(scheduleNormalize);
  observer.observe(root, { childList: true, subtree: true });
  scheduleNormalize();

  function waitForSingleImage(img, timeoutMs = IMAGE_WAIT_TIMEOUT_MS) {
    normalizeImage(img);
    if (img.complete) return Promise.resolve(img.naturalWidth > 0);

    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve(Boolean(ok));
      };
      const onLoad = () => finish(img.naturalWidth > 0);
      const onError = () => finish(false);
      const timer = setTimeout(() => finish(img.complete && img.naturalWidth > 0), timeoutMs);
      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
    });
  }

  async function waitForImages(container) {
    const images = Array.from(container.querySelectorAll('img'));
    const results = await Promise.all(images.map((img) => waitForSingleImage(img)));
    return { total: images.length, loaded: results.filter(Boolean).length };
  }

  function withTimeout(promise, timeoutMs, message) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs))
    ]);
  }

  function setStatusMessage(message = '', type = '') {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
    status.classList.toggle('hidden', !message);
  }

  function slug(value = '') {
    return String(value || 'propiedad')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'propiedad';
  }

  function getFilename() {
    const propertyId = (() => {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('propertyId') || params.get('id');
      if (queryId) return queryId;
      const parts = window.location.hash.replace(/^#/, '').split('/').filter(Boolean);
      const index = parts.indexOf('property-sheet');
      return index >= 0 ? parts[index + 1] : '';
    })();
    const heading = root.querySelector('.sheet-hero-copy h1')?.textContent || '';
    return `ficha-tecnica-${slug(heading || propertyId || 'propiedad')}.pdf`;
  }

  async function ensureFontsReady() {
    if (!document.fonts?.ready) return;
    await withTimeout(document.fonts.ready, 5000, 'Las tipografías tardaron demasiado en cargar.').catch(() => undefined);
  }

  function getProportionalPlacement(canvas, pageWidth, pageHeight) {
    const canvasRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;

    if (!Number.isFinite(canvasRatio) || canvasRatio <= 0) {
      return { x: 0, y: 0, width: pageWidth, height: pageHeight };
    }

    if (Math.abs(canvasRatio - pageRatio) < 0.002) {
      return { x: 0, y: 0, width: pageWidth, height: pageHeight };
    }

    if (canvasRatio > pageRatio) {
      const height = pageWidth / canvasRatio;
      return { x: 0, y: (pageHeight - height) / 2, width: pageWidth, height };
    }

    const width = pageHeight * canvasRatio;
    return { x: (pageWidth - width) / 2, y: 0, width, height: pageHeight };
  }

  async function exportPdf() {
    if (isExporting) return;
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
      setStatusMessage('No fue posible cargar el generador de PDF. Recarga la página e intenta nuevamente.', 'error');
      return;
    }

    const sheet = document.getElementById('property-sheet-pdf');
    if (!sheet) {
      setStatusMessage('La ficha todavía no está lista para descargarse.', 'error');
      return;
    }

    isExporting = true;
    downloadButton.disabled = true;
    downloadButton.textContent = 'Generando PDF...';
    document.body.classList.add('is-generating-pdf');
    setStatusMessage('Preparando imágenes y generando PDF…', 'info');

    try {
      window.inmoPropertySheetRenderSync?.syncCurrentSheet?.();
      normalizeAllImages();
      await ensureFontsReady();
      const imageResult = await waitForImages(sheet);
      if (imageResult.loaded < imageResult.total) {
        console.warn('[PropertySheet] Algunas imágenes no estuvieron disponibles para el PDF.', imageResult);
      }

      window.inmoPropertySheetRenderSync?.syncCurrentSheet?.();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const captureWidth = Math.round(sheet.clientWidth);
      const captureHeight = Math.round(sheet.clientHeight);
      const canvas = await withTimeout(
        window.html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: IMAGE_WAIT_TIMEOUT_MS,
          removeContainer: true,
          width: captureWidth,
          height: captureHeight,
          windowWidth: Math.max(document.documentElement.clientWidth, captureWidth),
          windowHeight: Math.max(document.documentElement.clientHeight, captureHeight),
          onclone: (clonedDocument) => {
            const clonedSheet = clonedDocument.getElementById('property-sheet-pdf');
            clonedDocument.body.classList.add('is-generating-pdf');
            clonedSheet?.classList.add('property-sheet-pdf-render');
            window.inmoPropertySheetRenderSync?.syncSheet?.(clonedSheet);
          }
        }),
        PDF_RENDER_TIMEOUT_MS,
        'La generación del PDF tardó demasiado.'
      );

      if (!canvas.width || !canvas.height) {
        throw new Error('No fue posible renderizar la ficha técnica.');
      }

      const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      const placement = getProportionalPlacement(canvas, pageWidth, pageHeight);
      pdf.addImage(imageData, 'JPEG', placement.x, placement.y, placement.width, placement.height, undefined, 'FAST');
      pdf.save(getFilename());
      setStatusMessage('', '');
    } catch (error) {
      console.error('[PropertySheet] Error generando PDF:', error);
      setStatusMessage('No fue posible generar el PDF. Recarga la ficha e intenta nuevamente.', 'error');
    } finally {
      isExporting = false;
      downloadButton.disabled = false;
      downloadButton.textContent = 'Descargar PDF';
      document.body.classList.remove('is-generating-pdf');
      scheduleNormalize();
    }
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('#downloadPropertySheetPdf');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    exportPdf();
  }, true);
})();
