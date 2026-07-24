(function () {
  const MIN_LENGTH = 3;
  const DEBOUNCE_MS = 500;
  const RESULT_LIMIT = 5;

  function normalizeLocationResult(item = {}) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      ...item,
      lat,
      lon,
      display_name: String(item.display_name || item.name || '').trim(),
      label: String(item.display_name || item.name || '').trim(),
      type: item.type || item.class || 'Ubicación'
    };
  }

  async function searchNicaraguaLocations(queryText, { signal, limit = RESULT_LIMIT } = {}) {
    const params = new URLSearchParams({
      q: queryText,
      format: 'jsonv2',
      countrycodes: 'ni',
      addressdetails: '1',
      limit: String(limit),
      'accept-language': 'es'
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { signal });
    if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
    const data = await response.json();
    return (Array.isArray(data) ? data : [])
      .map(normalizeLocationResult)
      .filter(Boolean)
      .slice(0, limit);
  }

  function createDebouncedNicaraguaSearch({ onStart, onSuccess, onError, minLength = MIN_LENGTH, delay = DEBOUNCE_MS, limit = RESULT_LIMIT } = {}) {
    let timer = null;
    let controller = null;
    let requestId = 0;

    function cancel() {
      if (timer) window.clearTimeout(timer);
      timer = null;
      controller?.abort();
      controller = null;
      requestId += 1;
    }

    function schedule(queryText) {
      const query = String(queryText || '').trim();
      if (timer) window.clearTimeout(timer);
      controller?.abort();
      if (query.length < minLength) {
        controller = null;
        requestId += 1;
        onSuccess?.([], { query, skipped: true });
        return;
      }
      controller = new AbortController();
      requestId += 1;
      const currentRequestId = requestId;
      onStart?.({ query, requestId: currentRequestId, controller });
      timer = window.setTimeout(async () => {
        try {
          const results = await searchNicaraguaLocations(query, { signal: controller.signal, limit });
          if (currentRequestId !== requestId || controller.signal.aborted) return;
          onSuccess?.(results, { query, requestId: currentRequestId });
        } catch (error) {
          if (error.name === 'AbortError' || currentRequestId !== requestId) return;
          onError?.(error, { query, requestId: currentRequestId });
        }
      }, delay);
    }

    return { schedule, cancel, getRequestId: () => requestId };
  }

  window.DRGMapGeocoding = {
    MIN_LENGTH,
    DEBOUNCE_MS,
    RESULT_LIMIT,
    normalizeLocationResult,
    searchNicaraguaLocations,
    createDebouncedNicaraguaSearch
  };
}());
