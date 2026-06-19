/**
 * Debug - Log absolutely everything
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

    console.log('📊 Total records:', apiData.data?.length);
    
    // Log first 10 records completely
    console.log('📝 FIRST 10 RECORDS:');
    apiData.data?.slice(0, 10).forEach((r, i) => {
      console.log(`${i}: year=${r.record_fiscal_year}, category="${r.amt_category}", amount=${r.mil_amt}`);
    });

    // Check how many Receipts and Outlays we have
    let receiptsCount = 0;
    let outlaysCount = 0;
    let otherCount = 0;

    apiData.data?.forEach(r => {
      if (r.amt_category === 'Receipts') receiptsCount++;
      else if (r.amt_category === 'Outlays') outlaysCount++;
      else otherCount++;
    });

    console.log(`📊 Category counts: Receipts=${receiptsCount}, Outlays=${outlaysCount}, Other=${otherCount}`);

    // Try to sum 2026 manually
    let receipts2026 = 0;
    let outlays2026 = 0;

    apiData.data?.forEach(r => {
      if (r.record_fiscal_year === '2026') {
        if (r.amt_category === 'Receipts') {
          const amt = parseFloat(r.mil_amt);
          receipts2026 += amt;
          console.log(`Receipts record: ${r.mil_amt}M (parsed: ${amt})`);
        }
        if (r.amt_category === 'Outlays') {
          const amt = parseFloat(r.mil_amt);
          outlays2026 += amt;
          console.log(`Outlays record: ${r.mil_amt}M (parsed: ${amt})`);
        }
      }
    });

    console.log(`📊 2026 totals: Receipts=${receipts2026}M, Outlays=${outlays2026}M`);

    res.status(200).json({
      success: true,
      debug: {
        totalRecords: apiData.data?.length,
        receiptsCount,
        outlaysCount,
        otherCount,
        receipts2026,
        outlays2026,
        firstRecord: apiData.data?.[0]
      },
      message: 'Check Vercel logs for details'
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
}