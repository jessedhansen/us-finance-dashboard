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

    let all = [];
    let page = 1;
    let totalPages = 1;

    do {
      const url = `${BASE_URL}?page[number]=${page}&page[size]=1000&sort=record_date`;

      const res2 = await fetch(url);
      const json = await res2.json();

      all.push(...(json.data || []));

      totalPages = Number(json.meta?.['total-pages'] || 1);
      page++;
    } while (page <= totalPages);

    console.log('Rows fetched:', all.length);

    // -----------------------------
    // KEEP ONLY REAL TOTAL ROWS
    // -----------------------------
    const filtered = all.filter(r => {
      const desc = (r.line_description || '').toLowerCase();
      return (
        desc.includes('total receipts') ||
        desc.includes('total outlays')
      );
    });

    console.log('Filtered rows:', filtered.length);

    const byYear = {};

    for (const r of filtered) {
      const year = Number(r.record_fiscal_year);
      const amount = Number(r.mil_amt);

      if (!year || !Number.isFinite(amount)) continue;

      if (!byYear[year]) {
        byYear[year] = { receipts: 0, outlays: 0 };
      }

      const desc = (r.line_description || '').toLowerCase();

      if (desc.includes('total receipts')) {
        byYear[year].receipts += amount;
      }

      if (desc.includes('total outlays')) {
        byYear[year].outlays += amount;
      }
    }

    const result = {};

    Object.keys(byYear)
      .sort((a, b) => Number(a) - Number(b))
      .forEach(year => {
        const receipts = byYear[year].receipts / 1000;
        const outlays = byYear[year].outlays / 1000;

        result[year] = {
          year: Number(year),
          revenue: Number(receipts.toFixed(2)),
          spent: Number(outlays.toFixed(2)),
          deficit: Number((outlays - receipts).toFixed(2))
        };
      });

    return res.status(200).json({
      success: true,
      rows: all.length,
      filtered: filtered.length,
      data: result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}