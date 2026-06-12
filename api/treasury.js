/**
 * Vercel Serverless Function
 * Fetches Treasury data and returns it to the React app
 * Solves CORS issues by running on the server
 */

export default async function handler(req, res) {
  // Enable CORS for our React app
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔄 Fetching Treasury data...');

    // Fetch from Treasury API
    const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/receipts_outlays_summary?sort=-record_date&limit=120';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Treasury API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Got Treasury data');

    // Parse data by year
    const byYear = {};

    if (data.data && data.data.length > 0) {
      data.data.forEach(record => {
        const year = parseInt(record.record_date.substring(0, 4));
        
        if (!byYear[year]) {
          byYear[year] = {
            revenues: 0,
            outlays: 0,
            count: 0
          };
        }
        
        // Add to yearly totals (values are in millions)
        const revenue = parseFloat(record.net_collections_operating_cash) || 0;
        const outlay = parseFloat(record.outlays_operating_cash) || 0;
        
        byYear[year].revenues += revenue;
        byYear[year].outlays += outlay;
        byYear[year].count += 1;
      });
    }

    // Convert to billions and calculate deficit
    const result = {};
    Object.keys(byYear).forEach(year => {
      const yearData = byYear[year];
      const revenue = Math.round(yearData.revenues / 1000000); // Convert millions to billions
      const spent = Math.round(yearData.outlays / 1000000);
      const deficit = spent - revenue;

      result[year] = {
        year: parseInt(year),
        revenue,
        deficit,
        spent
      };
    });

    console.log('📊 Processed data:', result);

    // Return data to React app
    res.status(200).json({
      success: true,
      data: result,
      source: 'Treasury API'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    
    // Return fallback data on error
    res.status(200).json({
      success: false,
      error: error.message,
      data: {
        2024: { year: 2024, revenue: 4750, deficit: 2000, spent: 6750 },
        2023: { year: 2023, revenue: 4650, deficit: 1690, spent: 6340 },
        2022: { year: 2022, revenue: 4600, deficit: 1675, spent: 6275 },
        2021: { year: 2021, revenue: 4200, deficit: 2076, spent: 6276 },
        2020: { year: 2020, revenue: 3420, deficit: 3132, spent: 6552 }
      },
      source: 'Fallback Data'
    });
  }
}
