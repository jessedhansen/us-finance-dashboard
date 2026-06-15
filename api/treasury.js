/**
 * Vercel Backend - CORRECT parsing of Treasury API
 * Field structure: amt_category (Receipts/Outlays), mil_amt (in millions)
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
    console.log('🔄 Fetching Treasury API...');

    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_receipts_outlays_deficit_surplus?sort=-record_date&page[size]=500';
    
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
    console.log('✅ Got', apiData.data?.length, 'records from Treasury');

    if (!apiData.data || apiData.data.length === 0) {
      throw new Error('No data');
    }

    // Group by fiscal year, summing receipts and outlays separately
    const byYear = {};

    apiData.data.forEach(record => {
      const year = parseInt(record.record_fiscal_year);
      const category = record.amt_category; // "Receipts" or "Outlays"
      const amount = parseFloat(record.mil_amt) || 0; // in millions

      if (!year || year === 0) return;

      if (!byYear[year]) {
        byYear[year] = {
          receipts: 0,
          outlays: 0
        };
      }

      if (category === 'Receipts') {
        byYear[year].receipts += amount;
      } else if (category === 'Outlays') {
        byYear[year].outlays += amount;
      }
    });

    console.log('📊 Years found:', Object.keys(byYear).sort());

    // Convert to billions
    const result = {};
    Object.keys(byYear).sort().reverse().forEach(year => {
      const data = byYear[year];
      
      // Values are in millions, convert to billions (divide by 1000)
      const revenue = data.receipts / 1000;
      const spent = data.outlays / 1000;
      const deficit = spent - revenue;

      result[year] = {
        year: parseInt(year),
        revenue: parseFloat(revenue.toFixed(2)),
        deficit: parseFloat(deficit.toFixed(2)),
        spent: parseFloat(spent.toFixed(2))
      };

      console.log(`✅ FY ${year}: Revenue=$${revenue.toFixed(2)}B, Spent=$${spent.toFixed(2)}B, Deficit=$${deficit.toFixed(2)}B`);
    });

    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury Fiscal Data API (REAL DATA)',
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