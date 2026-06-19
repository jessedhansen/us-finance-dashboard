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

    let allRecords = [];
    let page = 1;
    let totalPages = 1;

    console.log('🔄 Fetching Treasury MTS dataset...');

    do {
      const url =
        `${BASE_URL}?sort=-record_date&page[number]=${page}&page[size]=1000`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Treasury API error: ${response.status}`);
      }

      const json = await response.json();

      const records = json.data || [];
      allRecords.push(...records);

      totalPages = Number(
        json.meta?.['total-pages'] ||
        json.meta?.total_pages ||
        1
      );

      console.log(`📄 Page ${page}/${totalPages} → ${records.length} rows`);
      page++;
    } while (page <= totalPages);

    console.log(`✅ Total rows fetched: ${allRecords.length}`);

    // -------------------------------------------------------
    // FILTER: KEEP ONLY ANNUAL TOTAL ROWS (CRITICAL FIX)
    // -------------------------------------------------------
    const annualOnly = allRecords.filter(r => {
      const category = (r.amt_category || '').toLowerCase();
      const type = (r.record_type || '').toLowerCase();
      const description = (r.line_description || '').toLowerCase();

      return (
        category === 'total' ||
        type.includes('annual') ||
        description.includes('total receipts') ||
        description.includes('total outlays')
      );
    });

    console.log(`📊 Annual-only rows: ${annualOnly.length}`);

    // -------------------------------------------------------
    // GROUP BY FISCAL YEAR
    // -------------------------------------------------------
    const byYear = {};

    for (const r of annualOnly) {
      const year = Number(r.record_fiscal_year);
      if (!year || Number.isNaN(year)) continue;

      const category = (r.amt_category || '').toLowerCase();
      const amount = Number(r.mil_amt);

      if (!Number.isFinite(amount)) continue;

      if (!byYear[year]) {
        byYear[year] = { receipts: 0, outlays: 0 };
      }

      if (category.includes('receipt')) {
        byYear[year].receipts += amount;
      }

      if (category.includes('outlay')) {
        byYear[year].outlays += amount;
      }
    }

    // -------------------------------------------------------
    // FORMAT OUTPUT
    // -------------------------------------------------------
    const result = {};

    Object.keys(byYear)
      .sort((a, b) => Number(a) - Number(b))
      .forEach(year => {
        const receiptsB = byYear[year].receipts / 1000;
        const outlaysB = byYear[year].outlays / 1000;

        result[year] = {
          year: Number(year),
          revenue: Number(receiptsB.toFixed(2)),
          spent: Number(outlaysB.toFixed(2)),
          deficit: Number((outlaysB - receiptsB).toFixed(2))
        };
      });

    return res.status(200).json({
      success: true,
      source: 'US Treasury MTS API (filtered annual totals)',
      rowsFetched: allRecords.length,
      rowsAfterFilter: annualOnly.length,
      years: Object.keys(result).length,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Treasury API failure:', err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}