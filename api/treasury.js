/**
 * Vercel Backend - CORRECT MTS Receipts Outlays Deficit/Surplus Endpoint
 * This endpoint has exactly what we need: receipts, outlays, and deficit
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

    // PERFECT endpoint: Monthly Receipts Outlays and Deficit/Surplus Amounts
    const baseUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
    const endpoint = '/v1/accounting/mts/mts_receipts_outlays_deficit_surplus';
    const fullUrl = baseUrl + endpoint + '?sort=-record_date&page[size]=500';

    console.log('📡 URL:', fullUrl);

    const response = await fetch(fullUrl);
    
    console.log('✅ Response status:', response.status);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ Got data! Records:', apiData.data?.length);
    console.log('📋 Fields:', apiData.meta?.labels);

    if (!apiData.data || apiData.data.length === 0) {
      throw new Error('No data in response');
    }

    // Log first record to see field names
    console.log('📝 Sample record:', JSON.stringify(apiData.data[0], null, 2).substring(0, 500));

    // Group data by fiscal year
    const byYear = {};

    apiData.data.forEach(record => {
      // Get fiscal year
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

      // Parse the amounts - handle both possible field names
      const receipts = parseFloat(
        record.total_receipts_amt || 
        record.month_total_receipts_amt || 
        record.receipts_amt || 
        0
      ) || 0;
      
      const outlays = parseFloat(
        record.total_outlays_amt || 
        record.month_total_outlays_amt || 
        record.outlays_amt || 
        0
      ) || 0;
      
      const deficit = parseFloat(
        record.deficit_amt || 
        record.month_deficit_amt ||
        0
      ) || (outlays - receipts);

      // Sum up the monthly amounts to get fiscal year totals
      byYear[year].totalReceipts += receipts;
      byYear[year].totalOutlays += outlays;
      byYear[year].totalDeficit += deficit;
      byYear[year].count += 1;

      if (byYear[year].count <= 3) {
        console.log(`📝 Year ${year}: Receipts=${receipts}, Outlays=${outlays}, Deficit=${deficit}`);
      }
    });

    // Convert to billions and create result
    const result = {};
    Object.keys(byYear).sort().reverse().forEach(year => {
      const data = byYear[year];
      
      // Values are in millions, convert to billions
      const revenue = data.totalReceipts / 1000;
      const spent = data.totalOutlays / 1000;
      const deficit = data.totalDeficit / 1000;

      result[year] = {
        year: parseInt(year),
        revenue: parseFloat(revenue.toFixed(2)),
        deficit: parseFloat(deficit.toFixed(2)),
        spent: parseFloat(spent.toFixed(2))
      };

      console.log(`✅ FY ${year}: Revenue=$${revenue.toFixed(2)}B, Spent=$${spent.toFixed(2)}B, Deficit=$${deficit.toFixed(2)}B (${data.count} months)`);
    });

    console.log('✅ SUCCESS - Returning', Object.keys(result).length, 'years of REAL Treasury data');

    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury MTS Receipts/Outlays/Deficit (REAL DATA)',
      timestamp: new Date().toISOString(),
      yearsIncluded: Object.keys(result).sort()
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      source: 'ERROR'
    });
  }
}