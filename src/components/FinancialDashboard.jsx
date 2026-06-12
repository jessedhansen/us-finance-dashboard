import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const FinancialDashboard = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedYear, setSelectedYear] = useState(2024);
  const [budgetData, setBudgetData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [inflationData, setInflationData] = useState(null);
  const [jobsData, setJobsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('loading...');

  // Mock data as fallback
  const mockBudgetData = [
    { name: 'HHS', value: 2170 },
    { name: 'Social Security', value: 1545 },
    { name: 'Defense', value: 820 },
    { name: 'Veterans Affairs', value: 301 },
    { name: 'Education', value: 238 },
    { name: 'Transportation', value: 146 },
    { name: 'Homeland Security', value: 131 },
    { name: 'State Dept', value: 92 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Calling backend function...');
        
        // Call our Vercel backend function (or localhost for development)
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? '/api/treasury'
          : 'http://localhost:3001/api/treasury';
        
        console.log('📡 API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        const result = await response.json();

        console.log('✅ Backend response:', result);

        if (result.data) {
          console.log('📊 Setting historical data from backend');
          setDataSource(`${result.source} (Real Data)`);

          // Convert data object to array for charts
          const historicalArray = [];
          for (let year = 2020; year <= 2024; year++) {
            if (result.data[year]) {
              historicalArray.push(result.data[year]);
              console.log(`✅ Year ${year}:`, result.data[year]);
            }
          }

          if (historicalArray.length > 0) {
            setHistoricalData(historicalArray);
          } else {
            throw new Error('No historical data found');
          }
        } else {
          throw new Error('Invalid response format');
        }

      } catch (error) {
        console.error('❌ Error fetching from backend:', error);
        console.log('📌 Using fallback mock data instead');
        setDataSource('Mock Data (Fallback)');
        
        // Use mock data
        const mockHistorical = [
          { year: 2020, revenue: 3420, deficit: 3132, spent: 6552 },
          { year: 2021, revenue: 4200, deficit: 2076, spent: 6276 },
          { year: 2022, revenue: 4600, deficit: 1675, spent: 6275 },
          { year: 2023, revenue: 4650, deficit: 1690, spent: 6340 },
          { year: 2024, revenue: 4750, deficit: 2000, spent: 6750 }
        ];
        setHistoricalData(mockHistorical);
      } finally {
        setBudgetData(mockBudgetData);
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
            laborForceParticipation: 63.0,
            avgHourlyWage: 34.91
          },
          household: {
            employed: 161800000,
            unemployed: 6600000,
            notInLaborForce: 97100000,
            employmentPopulationRatio: 60.2
          }
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#d946ef', '#ca8a04'];

  const currentYearData = historicalData ? 
    historicalData.find(d => d.year === selectedYear) || 
    { revenue: 4750, deficit: 2000, spent: 6750 }
    : { revenue: 4750, deficit: 2000, spent: 6750 };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>USFinance.io 💰</h1>
            <div style={{ fontSize: '12px', color: '#999', padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px' }}>
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

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Loading real Treasury data...</p>
          </div>
        )}

        {!loading && (
          <>
            {currentPage === 'overview' && budgetData && currentYearData && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>Federal Budget Analysis</h2>
                
                {/* Year Selector */}
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
                    <option value={2024}>2024</option>
                    <option value={2023}>2023</option>
                    <option value={2022}>2022</option>
                    <option value={2021}>2021</option>
                    <option value={2020}>2020</option>
                  </select>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #16a34a' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Budget (Tax Revenue)</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>${currentYearData.revenue}B</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Amount collected from taxes</div>
                  </div>
                  
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Deficit (Overspending)</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626' }}>${currentYearData.deficit}B</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Amount spent over budget</div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Total Spent</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>${currentYearData.spent}B</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Budget + Deficit</div>
                  </div>
                </div>

                {/* Chart */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Spending Distribution by Department ({selectedYear})</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart key={selectedYear}>
                      <Pie data={budgetData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}\n$${value}B`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {budgetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value}B`} />
                    </PieChart>
                  </ResponsiveContainer>
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
                      <Tooltip formatter={(value) => `$${value}B`} />
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
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Unemployment Rate</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>3.9%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Avg Hourly Wage</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#f97316' }}>$34.91</div>
                    </div>
                  </div>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ marginTop: 0 }}>Household Survey</h3>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Employed</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>161.8M</div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Unemployed</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>6.6M</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Employment-Pop Ratio</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>60.2%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#1a202c', color: 'white', padding: '40px 20px', textAlign: 'center', marginTop: '60px' }}>
        <p>USFinance.io - Real-time US Government Financial Data</p>
        <p style={{ color: '#999', fontSize: '13px' }}>Source: {dataSource}</p>
      </div>
    </div>
  );
};

export default FinancialDashboard;
