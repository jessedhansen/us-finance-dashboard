/**
 * API Client - Government Data Integration
 * This file fetches data from government APIs
 */

// Get data from USA Spending API
export const fetchBudgetData = async () => {
  try {
    const response = await fetch('https://api.usaspending.gov/api/v2/agency/?limit=100');
    const data = await response.json();
    
    return data.results
      .filter(agency => agency.total_obligation > 0)
      .sort((a, b) => b.total_obligation - a.total_obligation)
      .slice(0, 12)
      .map(agency => ({
        name: agency.name,
        value: Math.round(agency.total_obligation / 1e9),
        fullValue: agency.total_obligation
      }));
  } catch (error) {
    console.error('Error fetching budget data:', error);
    return null;
  }
};

// Fallback data for when APIs fail
export const getFallbackData = () => ({
  budget: [
    { name: 'HHS', value: 2170 },
    { name: 'Social Security', value: 1545 },
    { name: 'Defense', value: 820 },
    { name: 'Veterans Affairs', value: 301 },
    { name: 'Education', value: 238 },
    { name: 'Transportation', value: 146 },
    { name: 'Homeland Security', value: 131 },
    { name: 'State Dept', value: 92 }
  ]
});
