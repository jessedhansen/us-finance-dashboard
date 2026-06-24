/**
 * Spending Distribution Endpoint - Corrected
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
    console.log('🔄 Fetching spending data...');

    // Try simpler URL without parameters first
    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/statement_net_cost?page[size]=500';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const apiData = await response.json();
    console.log('✅ Got spending records:', apiData.data?.length);

    res.status(200).json({
      success: true,
      data: apiData.data || [],
      source: 'Treasury Statement of Net Cost API',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    // Return mock data on error
    res.status(200).json({
      success: true,
      data: [
        { reporting_fiscal_year: '2026', agency_name: 'Department of Defense', net_cost_of_operations_amt: '820000000000' },
        { reporting_fiscal_year: '2026', agency_name: 'Social Security Administration', net_cost_of_operations_amt: '1350000000000' },
        { reporting_fiscal_year: '2026', agency_name: 'Department of Health and Human Services', net_cost_of_operations_amt: '1800000000000' },
        { reporting_fiscal_year: '2026', agency_name: 'Department of Veterans Affairs', net_cost_of_operations_amt: '300000000000' },
        { reporting_fiscal_year: '2026', agency_name: 'Department of Transportation', net_cost_of_operations_amt: '150000000000' },
        { reporting_fiscal_year: '2026', agency_name: 'Department of Education', net_cost_of_operations_amt: '450000000000' },
        { reporting_fiscal_year: '2026', agency_name: 'Department of Homeland Security', net_cost_of_operations_amt: '200000000000' },
        { reporting_fiscal_year: '2026', agency_name: 'Department of Interior', net_cost_of_operations_amt: '80000000000' },
        
        { reporting_fiscal_year: '2025', agency_name: 'Department of Defense', net_cost_of_operations_amt: '800000000000' },
        { reporting_fiscal_year: '2025', agency_name: 'Social Security Administration', net_cost_of_operations_amt: '1330000000000' },
        { reporting_fiscal_year: '2025', agency_name: 'Department of Health and Human Services', net_cost_of_operations_amt: '1750000000000' },
        { reporting_fiscal_year: '2025', agency_name: 'Department of Veterans Affairs', net_cost_of_operations_amt: '290000000000' },
        { reporting_fiscal_year: '2025', agency_name: 'Department of Transportation', net_cost_of_operations_amt: '140000000000' },
        { reporting_fiscal_year: '2025', agency_name: 'Department of Education', net_cost_of_operations_amt: '420000000000' },
        { reporting_fiscal_year: '2025', agency_name: 'Department of Homeland Security', net_cost_of_operations_amt: '190000000000' },
        { reporting_fiscal_year: '2025', agency_name: 'Department of Interior', net_cost_of_operations_amt: '75000000000' },
        
        { reporting_fiscal_year: '2024', agency_name: 'Department of Defense', net_cost_of_operations_amt: '780000000000' },
        { reporting_fiscal_year: '2024', agency_name: 'Social Security Administration', net_cost_of_operations_amt: '1300000000000' },
        { reporting_fiscal_year: '2024', agency_name: 'Department of Health and Human Services', net_cost_of_operations_amt: '1700000000000' },
        { reporting_fiscal_year: '2024', agency_name: 'Department of Veterans Affairs', net_cost_of_operations_amt: '280000000000' },
        { reporting_fiscal_year: '2024', agency_name: 'Department of Transportation', net_cost_of_operations_amt: '130000000000' },
        { reporting_fiscal_year: '2024', agency_name: 'Department of Education', net_cost_of_operations_amt: '400000000000' },
        { reporting_fiscal_year: '2024', agency_name: 'Department of Homeland Security', net_cost_of_operations_amt: '180000000000' },
        { reporting_fiscal_year: '2024', agency_name: 'Department of Interior', net_cost_of_operations_amt: '70000000000' },
      ],
      source: 'Mock Spending Data (API Error - Fallback)',
      timestamp: new Date().toISOString()
    });
  }
}
