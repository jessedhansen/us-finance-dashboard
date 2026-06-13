/**
 * Vercel Backend - Robust version with timeout and better error handling
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
    console.log('🔄 Fetching REAL Treasury data...');

    const baseUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
    const endpoint = '/v1/accounting/mts/mts_receipts_outlays_deficit_surplus';
    const fullUrl = baseUrl + endpoint + '?sort=-record_date&page[size]=500';

    console.log('📡 URL:', fullUrl);

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    let response;
    try {
      response = await fetch(fullUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log('✅ Response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ API Error:', response.status, text.substring(0, 200));
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ Got data! Records:', apiData.data?.length);

    if (!apiData.data || apiData.data.length === 0) {
      throw new Error('No data in response');
    }

    // Group data by fiscal year
    const byYear = {};

    apiData.data.forEach(record => {
      const year = parseInt(record.record_fiscal_year || record.reporting_fiscal_year || '0');
      
      if (!year || year === 0) return;

      if (!byYear[year]) {
        byYear[year] = {
          totalReceipts: 0,
          totalOutlays: 0,
          totalDeficit: 0,
          count: 0
        };
      }

      const receipts = parseFloat(
        record.total_receipts_amt || 
        record.month_total_receipts_amt || 
        0
      ) || 0;
      
      const outlays = parseFloat(
        record.total_outlays_amt || 
        record.month_total_outlays_amt || 
        0
      ) || 0;
      
      const deficit = parseFloat(
        record.deficit_amt || 
        record.month_deficit_amt ||
        0
      ) || (outlays - receipts);

      byYear[year].totalReceipts += receipts;
      byYear[year].totalOutlays += outlays;
      byYear[year].totalDeficit += deficit;
      byYear[year].count += 1;
    });

    // Convert to billions
    const result = {};
    Object.keys(byYear).sort().reverse().forEach(year => {
      const data = byYear[year];
      
      const revenue = data.totalReceipts / 1000;
      const spent = data.totalOutlays / 1000;
      const deficit = data.totalDeficit / 1000;

      result[year] = {
        year: parseInt(year),
        revenue: parseFloat(revenue.toFixed(2)),
        deficit: parseFloat(deficit.toFixed(2)),
        spent: parseFloat(spent.toFixed(2))
      };

      console.log(`✅ FY ${year}: Revenue=$${revenue.toFixed(2)}B, Spent=$${spent.toFixed(2)}B, Deficit=$${deficit.toFixed(2)}B`);
    });

    console.log('✅ SUCCESS - Returning', Object.keys(result).length, 'years of REAL Treasury data');

    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury MTS Receipts/Outlays/Deficit (REAL DATA)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      source: 'ERROR'
    });
  }
}