// Enable CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

// Generate mock tickets for testing
function generateMockTickets(params) {
  const count = Math.floor(Math.random() * 3) + 2;
  const tickets = [];
  
  for (let i = 0; i < count; i++) {
    tickets.push({
      key: `DEMO-${Date.now() + i}`,
      fields: {
        summary: `Mock ticket ${i + 1}: ${params.jql || params.keys || 'Sample'}`.substring(0, 100),
        priority: { name: ['Highest', 'High', 'Medium'][i % 3] },
        status: { name: ['To Do', 'In Progress', 'In Review'][i % 3] },
        issuetype: { name: ['Bug', 'Improvement', 'New Feature'][i % 3] },
        created: new Date().toISOString(),
        duedate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customfield_10001: Math.floor(Math.random() * 50000) + 10000,
        customfield_10002: Math.floor(Math.random() * 10),
        customfield_10003: Math.floor(Math.random() * 5),
        customfield_10004: ['No timing impact', 'Slowly degrading', 'Drops steeply'][i % 3],
        customfield_10005: Math.floor(Math.random() * 10) + 1,
        customfield_10006: Math.floor(Math.random() * 8) + 1
      }
    });
  }
  
  return tickets;
}

// Main handler function
const handler = async (req, res) => {
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'healthy', 
      version: '2.0.0',
      message: 'WSJF JIRA API is running'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, jiraConfig, ...params } = req.body;
    
    // For now, always return mock data
    // In production, you would integrate with real JIRA API here
    return res.status(200).json({
      mock: true,
      issues: generateMockTickets(params)
    });
    
  } catch (error) {
    console.error('JIRA API Error:', error);
    return res.status(200).json({ 
      error: error.message,
      mock: true,
      issues: generateMockTickets(req.body || {})
    });
  }
};

module.exports = allowCors(handler);
