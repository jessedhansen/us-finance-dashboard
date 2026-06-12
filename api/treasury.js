/**
 * Vercel Serverless Function
 * Fetches REAL Treasury data - FIXED ENDPOINT
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔄 Fetching Treasury data...');

    // CORRECT endpoint - without /services/
    const treasuryUrl = 'https://api.fiscaldata.treasury.gov/v1/accounting/od/receipts_outlays_summary?sort=-record_date&limit=500';
    
    console.log('📡 URL:', treasuryUrl);

    const response = await fetch(treasuryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'USFinance.io'
      }
    });

    console.log('✅ Response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ API Error:', response.status, text.substring(0, 200));
      throw new Error(`Treasury API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ Parsed JSON, records:', apiData.data?.length);

    if (!apiData.data || apiData.data.length === 0) {
      throw new Error('No data in Treasury API response');
    }

    // Group data by year and sum values - NO ROUNDING
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

    // Convert to billions - EXACT VALUES, NO ROUNDING
    const result = {};
    Object.keys(byYear).sort().reverse().forEach(year => {
      const data = byYear[year];
      
      const revenue = data.totalReceipts / 1000000;
      const spent = data.totalOutlays / 1000000;
      const deficit = spent - revenue;

      result[year] = {
        year: parseInt(year),
        revenue: revenue,
        deficit: deficit,
        spent: spent,
        records: data.records
      };

      console.log(`✅ Year ${year}: Revenue=$${revenue.toFixed(2)}B, Spent=$${spent.toFixed(2)}B, Deficit=$${deficit.toFixed(2)}B`);
    });

    console.log('✅ SUCCESS - Returning', Object.keys(result).length, 'years');

    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury Fiscal Data API (REAL DATA)',
      timestamp: new Date().toISOString(),
      note: 'All values are exact - no rounding'
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    // Return error
    res.status(500).json({
      success: false,
      error: error.message,
      source: 'ERROR',
      timestamp: new Date().toISOString()
    });
  }
}