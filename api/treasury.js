/**
 * Backend - CORRECT Treasury API Endpoint
 * Base: https://api.fiscaldata.treasury.gov/services/api/fiscal_service
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
    console.log('🔄 Fetching from Treasury API with CORRECT endpoint...');

    // CORRECT endpoint format
    const baseUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
    const endpoint = '/v2/accounting/od/receipts_outlays_summary';
    const fullUrl = baseUrl + endpoint + '?sort=-record_date&limit=500';

    console.log('📡 URL:', fullUrl);

    const response = await fetch(fullUrl);
    
    console.log('✅ Response status:', response.status);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ Got data! Records:', apiData.data?.length);

    if (!apiData.data || apiData.data.length === 0) {
      throw new Error('No data in response');
    }

    // Parse data by year
    const byYear = {};

    apiData.data.forEach(record => {
      const year = parseInt(record.record_date.substring(0, 4));
      
      if (!byYear[year]) {
        byYear[year] = {
          totalReceipts: 0,
          totalOutlays: 0,
          records: 0
        };
      }

      const receipts = parseFloat(record.net_collections_operating_cash) || 0;
      const outlays = parseFloat(record.outlays_operating_cash) || 0;

      byYear[year].totalReceipts += receipts;
      byYear[year].totalOutlays += outlays;
      byYear[year].records += 1;
    });

    // Convert to billions - EXACT VALUES
    const result = {};
    Object.keys(byYear).sort().reverse().forEach(year => {
      const data = byYear[year];
      
      const revenue = data.totalReceipts / 1000000; // millions to billions
      const spent = data.totalOutlays / 1000000;
      const deficit = spent - revenue;

      result[year] = {
        year: parseInt(year),
        revenue: parseFloat(revenue.toFixed(2)),
        deficit: parseFloat(deficit.toFixed(2)),
        spent: parseFloat(spent.toFixed(2)),
        records: data.records
      };

      console.log(`✅ Year ${year}: Revenue=$${revenue.toFixed(2)}B, Deficit=$${deficit.toFixed(2)}B, Spent=$${spent.toFixed(2)}B`);
    });

    console.log('✅ SUCCESS - Returning', Object.keys(result).length, 'years of REAL data');

    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury Fiscal Data API (REAL DATA)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    // Return error so we can debug
    res.status(500).json({
      success: false,
      error: error.message,
      source: 'ERROR'
    });
  }
}