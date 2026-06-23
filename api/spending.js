/**
 * Debug Spending - Show exact API response structure
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔄 Fetching statement_net_cost...');

    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/statement_net_cost?sort=-reporting_fiscal_year&page[size]=500';

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 25000);

    const response = await fetch(url, { signal: controller.signal });
    const apiData = await response.json();

    console.log('✅ Got records:', apiData.data?.length);
    console.log('📋 Field names:', apiData.data?.[0] ? Object.keys(apiData.data[0]) : []);
    
    // Show first 10 records with all fields
    console.log('📝 First 10 records:');
    apiData.data?.slice(0, 10).forEach((r, i) => {
      console.log(`Record ${i}:`, JSON.stringify(r));
    });

    res.status(200).json({
      success: true,
      debug: {
        recordCount: apiData.data?.length,
        fieldNames: apiData.data?.[0] ? Object.keys(apiData.data[0]) : [],
        firstThreeRecords: apiData.data?.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
}
