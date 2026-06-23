import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const FinancialDashboard = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [spendingByYear, setSpendingByYear] = useState({});
  const [inflationData, setInflationData] = useState(null);
  const [jobsData, setJobsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('loading...');
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching Treasury data...');
        
        const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

        const [budgetRes, spendingRes] = await Promise.all([
          fetch(`${baseUrl}/api/treasury`),
          fetch(`${baseUrl}/api/spending`)
        ]);

        const budgetData = await budgetRes.json();
        const spendingData = await spendingRes.json();

        console.log('✅ Budget data:', budgetData);
        console.log('✅ Spending response:', spendingData);

        if (!budgetData.success) {
          throw new Error('Failed to fetch budget data');
        }

        if (budgetData.data) {
          setDataSource('Treasury Fiscal Data API ✓');

          const historicalArray = [];
          const years = [];
          
          for (const year in budgetData.data) {
            historicalArray.push({
              year: parseInt(year),
              revenue: parseFloat(budgetData.data[year].revenue),
              deficit: parseFloat(budgetData.data[year].deficit),
              spent: parseFloat(budgetData.data[year].spent)
            });
            years.push(parseInt(year));
          }

          historicalArray.sort((a, b) => b.year - a.year);
          years.sort((a, b) => b - a);

          setAvailableYears(years);
          setHistoricalData(historicalArray);
          
          if (years.length > 0) {
            setSelectedYear(years[0]);
          }
        }

        // Process spending data with better error handling
        if (spendingData && spendingData.success && spendingData.data && Array.isArray(spendingData.data)) {
          console.log('📊 Processing spending data...');
          const processedSpending = {};
          
          spendingData.data.forEach((record) => {
            try {
              const year = parseInt(record.reporting_fiscal_year);
              const agency = record.agency_name || record.entity_name || 'Other';
              const cost = parseFloat(record.net_cost_of_operations_amt) || 0;

              if (!year || year === 0 || cost <= 0) return;

              if (!processedSpending[year]) {
                processedSpending[year] = {};
              }
              if (!processedSpending[year][agency]) {
                processedSpending[year][agency] = 0;
              }
              processedSpending[year][agency] += cost;
            } catch (e) {
              console.warn('Error processing record:', record, e);
            }
          });

          console.log('📊 Processed years:', Object.keys(processedSpending));

          const pieChartData = {};
          for (const year in processedSpending) {
            pieChartData[year] = Object.entries(processedSpending[year])
              .map(([name, cost]) => ({
                name: name.replace(/^Department of |^Social Security Administration|^Internal Revenue Service/g, '').substring(0, 20),
                value: parseFloat((cost / 1000000000).toFixed(2))
              }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 8);
          }

          console.log('🎨 Pie chart data:', pieChartData);
          setSpendingByYear(pieChartData);
        } else {
          console.warn('⚠️ Spending data not available:', spendingData);
          setSpendingByYear({});
        }

      } catch (error) {
        console.error('❌ Error:', error);
        setDataSource('ERROR');
      } finally {
        setInflationData([
          { month: 'Jan', rate: 3.4 },
          { month: 'Feb', rate: 3.5 },
          { month: 'Mar', rate: 3.5 },
          { month: 'Apr', rate: 3.3 },
          { month: 'May', rate: 3.4 },
          { month: 'Jun', rate: 3.0 },
          { month: 'Jul', rate: 2.9 },
          { month: 'Aug', rate: 2.8 },
          { month: 'Sep', rate: 2.5 },
          { month: 'Oct', rate: 2.6 },
          { month: 'Nov', rate: 3.1 },
          { month: 'Dec', rate: 3.4 }
        ]);
        setJobsData({
          establishment: {
            totalGain: 256000,
            unemploymentRate: 3.9,
            avgHourlyWage: 34.91
          },
          household: {
            employed: 161800000,
            unemployed: 6600000,
            employmentPopulationRatio: 60.2
          }
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#d946ef', '#ca8a04'];

  const currentYearData = historicalData && selectedYear ? 
    historicalData.find(d => d.year === selectedYear) 
    : null;

  const currentYearSpending = spendingByYear[selectedYear] || [];

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>USFinance.io 💰</h1>
            <div style={{ fontSize: '11px', color: '#999', padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px' }}>
              {dataSource}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { id: 'overview', label: 'Budget' },
              { id: 'historical', label: 'Trends' },
              { id: 'inflation', label: 'Inflation' },
              { id: 'jobs', label: 'Jobs' }
            ].map(nav => (
              <button
                key={nav.id}
                onClick={() => setCurrentPage(nav.id)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: currentPage === nav.id ? '#2563eb' : 'transparent',
                  color: currentPage === nav.id ? 'white' : '#666',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {nav.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading data...</div>}

        {!loading && (
          <>
            {currentPage === 'overview' && currentYearData && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>Federal Budget Analysis</h2>
                
                <div style={{ marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ fontSize: '16px', fontWeight: '500' }}>Select Year:</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{
                      padding: '10px 15px',
                      fontSize: '14px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #16a34a' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Budget (Tax Revenue)</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>
                      ${currentYearData.revenue.toFixed(2)}B
                    </div>
                  </div>
                  
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Deficit (Overspending)</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }}>
                      ${currentYearData.deficit.toFixed(2)}B
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Total Spent</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>
                      ${currentYearData.spent.toFixed(2)}B
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Spending Distribution by Agency ({selectedYear})</h3>
                  {currentYearSpending && currentYearSpending.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart key={selectedYear}>
                        <Pie data={currentYearSpending} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}\n$${value}B`} outerRadius={100} fill="#8884d8" dataKey="value">
                          {currentYearSpending.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value}B`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <p>Loading agency spending data...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentPage === 'historical' && historicalData && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '30px' }}>Spending & Deficit Trends</h2>
                <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}B`} />
                      <Legend />
                      <Bar dataKey="revenue" name="Budget (Revenue)" fill="#16a34a" />
                      <Bar dataKey="deficit" name="Deficit (Overspending)" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {currentPage === 'inflation' && inflationData && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '30px' }}>Inflation Rate Monitor</h2>
                <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={inflationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="rate" stroke="#ea580c" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {currentPage === 'jobs' && jobsData && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '30px' }}>Employment Reports</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ marginTop: 0 }}>Establishment Survey</h3>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Job Gains</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>+256K</div>
                    </div>
                  </div>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ marginTop: 0 }}>Household Survey</h3>
                    <div style={{ fontSize: '12px', color: '#666' }}>Employed</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>161.8M</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ background: '#1a202c', color: 'white', padding: '40px 20px', textAlign: 'center', marginTop: '60px' }}>
        <p>USFinance.io - Real US Government Financial Data</p>
        <p style={{ color: '#999', fontSize: '13px' }}>Source: {dataSource}</p>
      </div>
    </div>
  );
};

export default FinancialDashboard;
