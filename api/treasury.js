/**
 * Debug - Show raw API response
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_receipts_outlays_deficit_surplus?sort=-record_date&page[size]=500';
    
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 25000);

    const response = await fetch(url, { signal: controller.signal });
    const apiData = await response.json();

    console.log('📋 FIRST RECORD FIELDS:');
    if (apiData.data && apiData.data[0]) {
      console.log(JSON.stringify(apiData.data[0], null, 2));
    }

    res.status(200).json({
      success: true,
      debug: {
        firstRecord: apiData.data?.[0] || null,
        totalRecords: apiData.data?.length || 0,
        fieldNames: apiData.data?.[0] ? Object.keys(apiData.data[0]) : []
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}