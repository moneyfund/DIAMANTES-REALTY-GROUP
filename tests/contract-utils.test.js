'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { getContractStatus, validateContractDates, formatContractDate } = require('../js/contract-utils');

const today = new Date(2026, 6, 29, 18, 30);
test('calcula estados por días civiles sin números negativos', () => {
  assert.equal(getContractStatus('2026-07-01', '2026-07-29', today).key, 'today');
  assert.equal(getContractStatus('2026-07-01', '2026-07-30', today).label, 'Vence en 1 día');
  assert.equal(getContractStatus('2026-07-01', '2026-07-28', today).label, 'Contrato vencido hace 1 día');
  assert.equal(getContractStatus('2026-08-01', '2026-09-01', today).label, 'El contrato inicia en 3 días');
});

test('valida el par de fechas y permite contratos no registrados', () => {
  assert.equal(validateContractDates('', '').valid, true);
  assert.equal(validateContractDates('2026-07-29', '').valid, false);
  assert.equal(validateContractDates('2026-07-30', '2026-07-29').valid, false);
  assert.equal(validateContractDates('2026-07-29', '2026-07-29').valid, true);
  assert.equal(formatContractDate('2026-07-29'), '29/07/2026');
});
