/**
 * Entrada brasileira de datas de lembranças.
 *
 * A interface utiliza DD/MM/AAAA, mas a API mantém AAAA-MM-DD para
 * persistência no PostgreSQL. Não alteramos datas de registros existentes.
 */
export function maskBrazilianDate(value = "") {
  const text = String(value);

  // Colar uma data ISO (2026-11-14) também exibe corretamente no Brasil.
  const isoPasted = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (isoPasted) {
    return `${isoPasted[3]}/${isoPasted[2]}/${isoPasted[1]}`;
  }

  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isoToBrazilianDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function brazilianDateToIso(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (year < 1 || month < 1 || month > 12) return null;

  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > days[month - 1]) return null;

  return `${yyyy}-${mm}-${dd}`;
}
