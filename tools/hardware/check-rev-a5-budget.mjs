import { readFile } from 'node:fs/promises';

const BUDGET_LIMIT_RMB = 300;
const TARGET_WARNING_RMB = 240;
const path = 'hardware/bom/rev_a5_budget_evt_bom.csv';

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines
    .filter(Boolean)
    .map((line) => {
      const cells = line.split(',');
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    });
}

const rows = parseCsv(await readFile(path, 'utf8'));
const buyNowRows = rows.filter((row) => row.BuyNow === 'YES');
const total = buyNowRows.reduce((sum, row) => sum + Number(row.ExtendedRmb), 0);

console.log(`Rev A5 buy-now total: RMB ${total.toFixed(2)}`);
console.log(`Target warning threshold: RMB ${TARGET_WARNING_RMB.toFixed(2)}`);
console.log(`Hard stop threshold: RMB ${BUDGET_LIMIT_RMB.toFixed(2)}`);

if (!Number.isFinite(total)) {
  console.error('Budget total is not a finite number.');
  process.exit(1);
}

if (total > BUDGET_LIMIT_RMB) {
  console.error('Rev A5 buy-now cart exceeds the RMB 300 hard stop.');
  process.exit(1);
}

if (total > TARGET_WARNING_RMB) {
  console.warn('Rev A5 buy-now cart is above the RMB 240 target; review before buying.');
}

