export default async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
res.setHeader('Content-Type', 'application/json');

if (req.method === 'OPTIONS') {
return res.status(200).end();
}

try {
const BASE_URL =
'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_receipts_outlays_deficit_surplus';

```
let allRecords = [];
let page = 1;
let totalPages = 1;

console.log('🔄 Fetching Treasury data...');

do {
  const url =
    `${BASE_URL}?sort=-record_date&page[number]=${page}&page[size]=1000`;

  console.log(`📄 Fetching page ${page}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Treasury API returned ${response.status}`);
  }

  const json = await response.json();

  if (!json.data) {
    throw new Error('No data returned from Treasury');
  }

  allRecords.push(...json.data);

  totalPages =
    parseInt(
      json.meta?.['total-pages'] ||
      json.meta?.['total_pages'] ||
      1
    );

  console.log(
    `✅ Page ${page}: ${json.data.length} rows (total pages: ${totalPages})`
  );

  page++;
} while (page <= totalPages);

console.log(`📊 Total rows fetched: ${allRecords.length}`);

const byYear = {};

for (const record of allRecords) {
  const year = Number(record.record_fiscal_year);

  if (!year || Number.isNaN(year)) {
    continue;
  }

  const category = (record.amt_category || '').trim();

  const amount = Number(record.mil_amt || 0);

  if (!byYear[year]) {
    byYear[year] = {
      receipts: 0,
      outlays: 0
    };
  }

  if (category.toLowerCase() === 'receipts') {
    byYear[year].receipts += amount;
  }

  if (category.toLowerCase() === 'outlays') {
    byYear[year].outlays += amount;
  }
}

const result = {};

Object.keys(byYear)
  .sort((a, b) => Number(a) - Number(b))
  .forEach(year => {
    const receiptsBillions =
      byYear[year].receipts / 1000;

    const outlaysBillions =
      byYear[year].outlays / 1000;

    result[year] = {
      year: Number(year),
      revenue: Number(receiptsBillions.toFixed(2)),
      spent: Number(outlaysBillions.toFixed(2)),
      deficit: Number(
        (outlaysBillions - receiptsBillions).toFixed(2)
      )
    };
  });

console.log('✅ Years found:', Object.keys(result));

return res.status(200).json({
  success: true,
  source: 'US Treasury Fiscal Data API',
  rowsFetched: allRecords.length,
  yearsFound: Object.keys(result).length,
  data: result,
  timestamp: new Date().toISOString()
});
```

} catch (error) {
console.error('❌ Treasury fetch failed:', error);

```
return res.status(500).json({
  success: false,
  error: error.message
});
```

}
}
