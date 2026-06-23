/**
 * Balance Sheets Endpoint
 * Government assets, liabilities, and net position
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
    console.log('🔄 Fetching balance sheets data...');

    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/balance_sheets?sort=-reporting_fiscal_year&page[size]=500';

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
    console.log('✅ Got balance sheets records:', apiData.data?.length);

    res.status(200).json({
      success: true,
      data: apiData.data || [],
      meta: apiData.meta || {},
      source: 'Treasury Balance Sheets API',
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
