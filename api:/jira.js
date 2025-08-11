// api/jira.js - Corrected Vercel Function for JIRA Integration
export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Health check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      mock: true,
      message: 'JIRA API Mock Service'
    });
  }
  
  // Main POST handler
  if (req.method === 'POST') {
    try {
      const { action, keys, jql } = req.body;
      
      // Get credentials from environment variables
      const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
      const JIRA_EMAIL = process.env.JIRA_EMAIL;
      const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
      
      // If credentials are not configured, return mock data
      if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
        return res.status(200).json({
          mock: true,
          issues: generateMockIssues(action, keys || jql),
          total: 5,
          message: 'Using mock data - JIRA credentials not configured'
        });
      }
      
      // Prepare auth header
      const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
      
      // Handle different actions
      switch (action) {
        case 'fetchByKeys':
          return await fetchByKeys(keys, authHeader, JIRA_BASE_URL, res);
          
        case 'fetchByJQL':
          return await fetchByJQL(jql, authHeader, JIRA_BASE_URL, res);
          
        case 'testConnection':
          return await testConnection(authHeader, JIRA_BASE_URL, res);
          
        default:
          // Default to mock data
          return res.status(200).json({
            mock: true,
            issues: generateMockIssues('default', 'default query'),
            message: 'Unknown action - returning mock data'
          });
      }
      
    } catch (error) {
      console.error('JIRA API Error:', error);
      return res.status(200).json({
        mock: true,
        issues: generateMockIssues('error', 'error'),
        error: error.message,
        message: 'Error occurred - returning mock data'
      });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

// Fetch tickets by issue keys
async function fetchByKeys(keys, authHeader, baseUrl, res) {
  try {
    const keyArray = Array.isArray(keys) ? keys : keys.split(',').map(k => k.trim());
    const jql = `key in (${keyArray.join(',')})`;
    
    const response = await fetch(`${baseUrl}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: 100,
        fields: getAllFields()
      })
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json({
      issues: data.issues,
      total: data.total,
      mock: false
    });
    
  } catch (error) {
    console.error('Fetch by keys error:', error);
    return res.status(200).json({
      mock: true,
      issues: generateMockIssues('keys', keys),
      error: error.message
    });
  }
}

// Fetch tickets by JQL query
async function fetchByJQL(jql, authHeader, baseUrl, res) {
  try {
    const response = await fetch(`${baseUrl}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: jql || 'project != EMPTY ORDER BY priority DESC',
        maxResults: 100,
        fields: getAllFields()
      })
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json({
      issues: data.issues,
      total: data.total,
      mock: false
    });
    
  } catch (error) {
    console.error('Fetch by JQL error:', error);
    return res.status(200).json({
      mock: true,
      issues: generateMockIssues('jql', jql),
      error: error.message
    });
  }
}

// Test JIRA connection
async function testConnection(authHeader, baseUrl, res) {
  try {
    const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json({
      success: true,
      user: data.displayName || data.emailAddress,
      message: 'JIRA connection successful'
    });
    
  } catch (error) {
    console.error('Connection test error:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      message: 'JIRA connection failed'
    });
  }
}

// Get all required fields for WSJF calculation
function getAllFields() {
  return [
    'key',
    'summary',
    'description',
    'priority',
    'issuetype',
    'status',
    'created',
    'updated',
    'duedate',
    'assignee',
    'reporter',
    'labels',
    'components',
    'fixVersions',
    'customfield_10001', // Issue Value
    'customfield_10002', // Enterprise Accounts
    'customfield_10003', // Flagged Accounts
    'customfield_10004', // Market Timing
    'customfield_10005', // RR/OE Value
    'customfield_10006', // Story Points
    'customfield_10007', // Customer
    'customfield_10008', // Team
    'customfield_10009', // Sprint
    'customfield_10010', // WSJF Score (export)
    'customfield_10011', // Cost of Delay (export)
    'customfield_10012'  // Rank (export)
  ];
}

// Generate mock issues for testing/demo
function generateMockIssues(action, context) {
  const severities = ['Level 5 - FIRE', 'Level 4 - Critical', 'Level 3 - High', 'Level 2 - Medium', 'Level 1 - Low'];
  const statuses = ['To Do', 'In Progress', 'In Review', 'Done'];
  const types = ['Bug', 'Story', 'Task', 'Improvement', 'New Feature'];
  const teams = ['Backend', 'Frontend', 'DevOps', 'QA', 'Compliance'];
  const marketTimings = ['Pointless afterwards', 'Drops steeply', 'Slowly degrading', 'Nice to meet deadline', 'No timing impact'];
  const customers = ['Enterprise Corp', 'Tech Startup Inc', 'Global Bank', 'Retail Chain', 'Healthcare Provider'];
  
  const count = Math.floor(Math.random() * 3) + 3;
  const issues = [];
  
  for (let i = 0; i < count; i++) {
    const priority = ['Highest', 'High', 'Medium', 'Low', 'Lowest'][Math.floor(Math.random() * 5)];
    const severity = mapPriorityToSeverity(priority);
    
    issues.push({
      key: `DEMO-${1000 + Math.floor(Math.random() * 9000)}`,
      fields: {
        summary: generateSummary(i, context),
        description: `This is a mock ticket generated for: ${String(context).substring(0, 100)}`,
        priority: { 
          name: priority,
          id: `${Math.floor(Math.random() * 5) + 1}`
        },
        issuetype: { 
          name: types[Math.floor(Math.random() * types.length)],
          id: `${Math.floor(Math.random() * 10) + 1}`
        },
        status: { 
          name: statuses[Math.floor(Math.random() * statuses.length)],
          id: `${Math.floor(Math.random() * 10) + 1}`
        },
        created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        duedate: Math.random() > 0.3 ? 
          new Date(Date.now() + (Math.random() * 60 - 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          null,
        assignee: { 
          displayName: `User ${Math.floor(Math.random() * 10) + 1}`,
          emailAddress: `user${Math.floor(Math.random() * 10) + 1}@company.com`
        },
        reporter: {
          displayName: `Reporter ${Math.floor(Math.random() * 10) + 1}`,
          emailAddress: `reporter${Math.floor(Math.random() * 10) + 1}@company.com`
        },
        labels: generateLabels(),
        components: [{ name: teams[Math.floor(Math.random() * teams.length)] }],
        customfield_10001: Math.floor(Math.random() * 100000) + 10000, // Issue Value
        customfield_10002: Math.floor(Math.random() * 15), // Enterprise Accounts
        customfield_10003: Math.floor(Math.random() * 8), // Flagged Accounts
        customfield_10004: marketTimings[Math.floor(Math.random() * marketTimings.length)], // Market Timing
        customfield_10005: Math.floor(Math.random() * 13) + 1, // RR/OE Value
        customfield_10006: Math.floor(Math.random() * 13) + 1, // Story Points
        customfield_10007: customers[Math.floor(Math.random() * customers.length)], // Customer
        customfield_10008: teams[Math.floor(Math.random() * teams.length)], // Team
        customfield_10009: `Sprint ${Math.floor(Math.random() * 5) + 20}` // Sprint
      }
    });
  }
  
  return issues;
}

// Generate realistic summaries
function generateSummary(index, context) {
  const summaries = [
    'Payment gateway timeout affecting multiple transactions',
    'Dashboard performance degradation with large datasets',
    'GDPR compliance requirements for EU market',
    'Security vulnerability in authentication module',
    'API rate limiting implementation',
    'Database optimization for improved query performance',
    'Mobile app crash on iOS 17 devices',
    'Integration with third-party payment processor',
    'User permission system overhaul',
    'Automated testing framework implementation'
  ];
  
  const contextStr = String(context).substring(0, 30);
  if (contextStr && contextStr !== 'default' && contextStr !== 'error') {
    return `${summaries[index % summaries.length]} [${contextStr}]`;
  }
  
  return summaries[index % summaries.length];
}

// Generate random labels
function generateLabels() {
  const allLabels = ['critical', 'customer-reported', 'security', 'performance', 
                     'compliance', 'enhancement', 'tech-debt', 'urgent'];
  const count = Math.floor(Math.random() * 3) + 1;
  const labels = [];
  
  for (let i = 0; i < count; i++) {
    labels.push(allLabels[Math.floor(Math.random() * allLabels.length)]);
  }
  
  return [...new Set(labels)]; // Remove duplicates
}

// Map priority to severity
function mapPriorityToSeverity(priority) {
  const mapping = {
    'Highest': 'Level 5 - FIRE',
    'High': 'Level 4 - Critical',
    'Medium': 'Level 3 - High',
    'Low': 'Level 2 - Medium',
    'Lowest': 'Level 1 - Low'
  };
  return mapping[priority] || 'Level 2 - Medium';
}
