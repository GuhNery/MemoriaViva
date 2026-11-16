import test from "node:test";
import assert from "node:assert/strict";
import {
  maskBrazilianDate,
  isoToBrazilianDate,
  brazilianDateToIso,
} from "../src/utils/memoryDate.js";

test("adiciona barras enquanto os números são digitados", () => {
  assert.equal(maskBrazilianDate("1"), "1");
  assert.equal(maskBrazilianDate("14"), "14");
  assert.equal(maskBrazilianDate("141"), "14/1");
  assert.equal(maskBrazilianDate("1411"), "14/11");
  assert.equal(maskBrazilianDate("14112"), "14/11/2");
  assert.equal(maskBrazilianDate("14112026"), "14/11/2026");
  assert.equal(maskBrazilianDate("14/11/2026"), "14/11/2026");
});

test("limita caracteres e aceita datas ISO coladas", () => {
  assert.equal(maskBrazilianDate("141120261234"), "14/11/2026");
  assert.equal(maskBrazilianDate("2026-11-14"), "14/11/2026");
  assert.equal(maskBrazilianDate("2026/11/14"), "14/11/2026");
  assert.equal(maskBrazilianDate("14/11/202"), "14/11/202");
});

test("converte DD/MM/AAAA corretamente para o banco", () => {
  assert.equal(brazilianDateToIso("14/11/2026"), "2026-11-14");
  assert.equal(brazilianDateToIso("29/02/2024"), "2024-02-29");
  assert.equal(brazilianDateToIso("31/12/2026"), "2026-12-31");
});

test("impede datas inexistentes e entradas incompletas", () => {
  for (const invalid of [
    "", "14/11/20", "31/02/2026", "29/02/2026", "31/04/2026",
    "00/11/2026", "14/00/2026", "14/13/2026", "14-11-2026", "01/01/0000",
  ]) {
    assert.equal(brazilianDateToIso(invalid), null, invalid);
  }
});

test("exibe datas já armazenadas em ISO no formato brasileiro", () => {
  assert.equal(isoToBrazilianDate("2026-11-14"), "14/11/2026");
  assert.equal(isoToBrazilianDate("2026-11-14T12:00:00Z"), "14/11/2026");
  assert.equal(isoToBrazilianDate(null), "");
});
