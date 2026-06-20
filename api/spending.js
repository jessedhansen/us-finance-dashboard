/**
 * Spending Distribution Endpoint
 * Fetches agency spending from Statement of Net Cost
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
    console.log('🔄 Fetching spending data...');

    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/statement_net_cost?sort=-reporting_fiscal_year&page[size]=500';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ Got spending records:', apiData.data?.length);

    // Group by fiscal year and agency
    const byYear = {};

    apiData.data?.forEach(record => {
      const year = parseInt(record.reporting_fiscal_year);
      const agency = record.agency_name || record.entity_name || 'Other';
      const cost = parseFloat(record.net_cost_of_operations_amt) || 0;

      if (!year || year === 0 || cost <= 0) return;

      if (!byYear[year]) {
        byYear[year] = {};
      }

      if (!byYear[year][agency]) {
        byYear[year][agency] = 0;
      }
      byYear[year][agency] += cost;
    });

    // Format result
    const result = {};
    for (const year in byYear) {
      const agencies = Object.entries(byYear[year])
        .map(([name, cost]) => ({
          name: name.replace(/^Department of |^Social Security Administration|^Internal Revenue Service/g, '').substring(0, 20),
          value: parseFloat((cost / 1000).toFixed(2))
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      result[year] = agencies;
      console.log(`✅ FY ${year}: ${agencies.length} agencies`);
    }

    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury Statement of Net Cost API',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
