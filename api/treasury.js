/**
 * Treasury Receipts & Outlays - Fetch from Real API
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_receipts_outlays_deficit_surplus?sort=-record_date&page[size]=500';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();

    const byYear = {};
    apiData.data?.forEach(record => {
      const year = parseInt(record.record_fiscal_year);
      const category = record.amt_category?.trim();
      const amount = parseFloat(record.mil_amt) || 0;

      if (!year || year === 0) return;

      if (!byYear[year]) {
        byYear[year] = { receipts: 0, outlays: 0 };
      }

      if (category === 'Receipts') {
        byYear[year].receipts += amount;
      } else if (category === 'Outlays') {
        byYear[year].outlays += amount;
      }
    });

    const result = {};
    for (const year in byYear) {
      const data = byYear[year];
      const revenue = data.receipts / 1000;
      const spent = data.outlays / 1000;
      const deficit = spent - revenue;

      result[year] = {
        year: parseInt(year),
        revenue: parseFloat(revenue.toFixed(2)),
        deficit: parseFloat(deficit.toFixed(2)),
        spent: parseFloat(spent.toFixed(2))
      };
    }

    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury API',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
