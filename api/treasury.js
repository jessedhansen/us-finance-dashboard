/**
 * Vercel Backend - Debug version to see actual field names
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch(fullUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ Got data! Records:', apiData.data?.length);
    console.log('📋 Available fields:', Object.keys(apiData.data?.[0] || {}));
    console.log('📝 First 3 records:');
    apiData.data?.slice(0, 3).forEach((record, idx) => {
      console.log(`Record ${idx}:`, JSON.stringify(record, null, 2).substring(0, 500));
    });

    if (!apiData.data || apiData.data.length === 0) {
      throw new Error('No data in response');
    }

    // Group data by fiscal year - FIX: Try all possible field name variations
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

      // Try MANY possible field names
      let receipts = 0;
      let outlays = 0;
      let deficit = 0;

      // Check all possible field variations
      for (const key in record) {
        const val = parseFloat(record[key]) || 0;
        if (key.toLowerCase().includes('receipt') && val > 0) receipts = val;
        if (key.toLowerCase().includes('outlay') && val > 0) outlays = val;
        if (key.toLowerCase().includes('deficit') && val > 0) deficit = val;
      }

      byYear[year].totalReceipts += receipts;
      byYear[year].totalOutlays += outlays;
      byYear[year].totalDeficit += deficit;
      byYear[year].count += 1;

      if (byYear[year].count === 1) {
        console.log(`Year ${year} sample: receipts=${receipts}, outlays=${outlays}, deficit=${deficit}`);
      }
    });

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

    console.log('✅ SUCCESS - Returning', Object.keys(result).length, 'years');

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