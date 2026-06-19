/**
 * FIXED - Correctly parse amt_category and mil_amt
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
    console.log('🔄 Fetching Treasury data...');

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
    console.log('✅ Got', apiData.data?.length, 'records');

    // Group by fiscal year
    const byYear = {};

    apiData.data.forEach(record => {
      // Get year from record_fiscal_year field
      const year = parseInt(record.record_fiscal_year);
      
      // Get category from amt_category field
      const category = record.amt_category ? record.amt_category.trim() : '';
      
      // Get amount from mil_amt field (in millions)
      const amount = parseFloat(record.mil_amt) || 0;

      console.log(`Processing: year=${year}, category="${category}", amount=${amount}M`);

      if (!year || year === 0) {
        console.log('  → Skipping: invalid year');
        return;
      }

      if (!byYear[year]) {
        byYear[year] = { receipts: 0, outlays: 0 };
      }

      // Check category and add to appropriate sum
      if (category === 'Receipts') {
        byYear[year].receipts += amount;
        console.log(`  → Added to Receipts: now ${byYear[year].receipts}M`);
      } else if (category === 'Outlays') {
        byYear[year].outlays += amount;
        console.log(`  → Added to Outlays: now ${byYear[year].outlays}M`);
      }
    });

    console.log('📊 Grouped data:', JSON.stringify(byYear));

    // Convert to billions
    const result = {};
    for (const year in byYear) {
      const data = byYear[year];
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
    }

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