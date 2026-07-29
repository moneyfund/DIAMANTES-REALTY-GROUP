(function initContractUtils(globalScope) {
  'use strict';

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function parseIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  function localDayNumber(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY;
  }

  function formatContractDate(value) {
    const date = parseIsoDate(value);
    if (!date) return 'Sin fecha';
    return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
      .map((part, index) => index < 2 ? String(part).padStart(2, '0') : String(part))
      .join('/');
  }

  function validateContractDates(startValue, endValue) {
    const start = String(startValue || '').trim();
    const end = String(endValue || '').trim();
    if (!start && !end) return { valid: true, start: '', end: '' };
    if (!start || !end) return { valid: false, message: 'Debes completar la fecha de emisión y la fecha de vencimiento del contrato.' };
    const startDate = parseIsoDate(start);
    const endDate = parseIsoDate(end);
    if (!startDate || !endDate) return { valid: false, message: 'Ingresa fechas de contrato válidas.' };
    if (localDayNumber(endDate) < localDayNumber(startDate)) {
      return { valid: false, message: 'La fecha de vencimiento debe ser posterior o igual a la fecha de emisión.' };
    }
    return { valid: true, start, end };
  }

  function getContractStatus(startValue, endValue, now = new Date()) {
    const validation = validateContractDates(startValue, endValue);
    if (!validation.valid || (!validation.start && !validation.end)) {
      return { key: 'none', title: 'Contrato no registrado', label: 'Contrato no registrado', className: 'contract-none', daysRemaining: null };
    }
    const today = localDayNumber(now);
    const start = localDayNumber(parseIsoDate(validation.start));
    const end = localDayNumber(parseIsoDate(validation.end));
    const daysUntilStart = start - today;
    const daysRemaining = end - today;

    if (daysUntilStart > 0) return { key: 'future', title: 'Contrato futuro', label: `El contrato inicia en ${daysUntilStart} ${daysUntilStart === 1 ? 'día' : 'días'}`, className: 'contract-future', daysRemaining };
    if (daysRemaining < 0) {
      const elapsed = Math.abs(daysRemaining);
      return { key: 'expired', title: 'Contrato vencido', label: `Contrato vencido hace ${elapsed} ${elapsed === 1 ? 'día' : 'días'}`, className: 'contract-expired', daysRemaining };
    }
    if (daysRemaining === 0) return { key: 'today', title: 'Vence hoy', label: 'El contrato vence hoy', className: 'contract-today', daysRemaining };
    if (daysRemaining <= 7) return { key: 'urgent', title: 'Contrato urgente', label: `Vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`, className: 'contract-urgent', daysRemaining };
    if (daysRemaining <= 30) return { key: 'soon', title: 'Próximo a vencer', label: `Contrato próximo a vencer · ${daysRemaining} días`, className: 'contract-soon', daysRemaining };
    return { key: 'active', title: 'Contrato vigente', label: `${daysRemaining} días restantes`, className: 'contract-active', daysRemaining };
  }

  function renderContractIndicator(property = {}) {
    const start = property.contractStartDate || '';
    const end = property.contractEndDate || '';
    const status = getContractStatus(start, end);
    return `<section class="contract-indicator ${status.className}" aria-label="Estado privado del contrato"><svg class="contract-indicator-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2Zm12 8H5v10h14V10ZM7 6H5v2h14V6h-2v1h-2V6H9v1H7V6Z"/></svg><div><strong>${status.title}</strong><span>${status.label}</span><dl><div><dt>Emisión:</dt><dd>${formatContractDate(start)}</dd></div><div><dt>Vencimiento:</dt><dd>${formatContractDate(end)}</dd></div></dl></div></section>`;
  }

  const api = { parseIsoDate, formatContractDate, validateContractDates, getContractStatus, renderContractIndicator };
  globalScope.inmoContractUtils = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
