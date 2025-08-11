// api/jira.js - Complete JIRA Integration API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0'
    });
  }
  
  if (req.method === 'POST') {
    try {
      const { action, jiraConfig, fieldMappings, ...params } = req.body;
      
      // Use provided config or environment variables
      const JIRA_BASE_URL = jiraConfig?.baseUrl || process.env.JIRA_BASE_URL;
      const JIRA_EMAIL = jiraConfig?.email || process.env.JIRA_EMAIL;
      const JIRA_API_TOKEN = jiraConfig?.apiToken || process.env.JIRA_API_TOKEN;
      
      // If no credentials, return mock data
      if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
        return handleMockResponse(action, params, res);
      }
      
      const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
      
      switch (action) {
        case 'fetchByKeys':
          return await fetchByKeys(params.keys, authHeader, JIRA_BASE_URL, fieldMappings, res);
          
        case 'fetchByJQL':
          return await fetchByJQL(params.jql, authHeader, JIRA_BASE_URL, fieldMappings, res);
          
        case 'updateFields':
          return await updateFields(params.ticketKey, params.updates, authHeader, JIRA_BASE_URL, fieldMappings, res);
          
        case 'testConnection':
          return await testConnection(authHeader, JIRA_BASE_URL, res);
          
        default:
          return handleMockResponse(action, params, res);
      }
      
    } catch (error) {
      console.error('JIRA API Error:', error);
      return res.status(200).json({
        success: false,
        error: error.message,
        mock: true,
        issues: generateMockIssues('error', {})
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function fetchByKeys(keys, authHeader, baseUrl, fieldMappings, res) {
  try {
    const keyArray = Array.isArray(keys) ? keys : keys.split(',').map(k => k.trim());
    const jql = `key in (${keyArray.join(',')})`;
    
    return fetchByJQL(jql, authHeader, baseUrl, fieldMappings, res);
  } catch (error) {
    return handleMockResponse('fetchByKeys', { keys }, res);
  }
}

async function fetchByJQL(jql, authHeader, baseUrl, fieldMappings, res) {
  try {
    // Build fields list from mappings
    const fields = new Set(['key', 'summary', 'status', 'issuetype', 'created', 'priority']);
    
    if (fieldMappings) {
      fieldMappings.calculation?.forEach(m => {
        if (m.enabled && m.jiraField) fields.add(m.jiraField);
      });
      fieldMappings.display?.forEach(m => {
        if (m.enabled && m.jiraField) fields.add(m.jiraField);
      });
    }
    
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
        fields: Array.from(fields)
      })
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json({
      success: true,
      issues: data.issues,
      total: data.total,
      mock: false
    });
    
  } catch (error) {
    console.error('Fetch error:', error);
    return handleMockResponse('fetchByJQL', { jql }, res);
  }
}

async function updateFields(ticketKey, updates, authHeader, baseUrl, fieldMappings, res) {
  try {
    const fields = {};
    
    // Map updates to JIRA field IDs
    Object.entries(updates).forEach(([field, value]) => {
      const exportMapping = fieldMappings?.export?.find(m => m.field === field);
      if (exportMapping?.jiraField) {
        fields[exportMapping.jiraField] = value;
      }
    });
    
    const response = await fetch(`${baseUrl}/rest/api/3/issue/${ticketKey}`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Updated ${ticketKey} successfully`
    });
    
  } catch (error) {
    console.error('Update error:', error);
    return res.status(200).json({
      success: false,
      error: error.message
    });
  }
}

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
      message: 'Connection successful'
    });
    
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      message: 'Connection failed'
    });
  }
}

function handleMockResponse(action, params, res) {
  const issues = generateMockIssues(action, params);
  return res.status(200).json({
    success: true,
    mock: true,
    issues,
    total: issues.length,
    message: 'Using mock data - JIRA not configured'
  });
}

function generateMockIssues(action, params) {
  const count = Math.floor(Math.random() * 3) + 2;
  const issues = [];
  
  const summaries = [
    'Payment gateway timeout affecting transactions',
    'Dashboard performance optimization needed',
    'Security vulnerability in authentication',
    'Database query optimization',
    'Mobile app crash on latest iOS',
    'GDPR compliance implementation',
    'API rate limiting feature',
    'User permissions system update',
    'Integration with payment processor',
    'Automated testing framework'
  ];
  
  const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
  const statuses = ['To Do', 'In Progress', 'In Review', 'Done'];
  const types = ['Bug', 'Story', 'Task', 'Improvement', 'New Feature'];
  const teams = ['Backend', 'Frontend', 'DevOps', 'QA', 'Compliance'];
  const customers = ['Enterprise Corp', 'Tech Startup', 'Global Bank', 'Healthcare Provider', 'Retail Chain'];
  const marketTimings = ['Pointless afterwards', 'Drops steeply', 'Slowly degrading', 'Nice to meet deadline', 'No timing impact'];
  
  for (let i = 0; i < count; i++) {
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    issues.push({
      key: `DEMO-${1000 + Math.floor(Math.random() * 9000)}`,
      fields: {
        summary: summaries[Math.floor(Math.random() * summaries.length)],
        priority: { name: priority },
        status: { name: statuses[Math.floor(Math.random() * statuses.length)] },
        issuetype: { name: types[Math.floor(Math.random() * types.length)] },
        created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        duedate: Math.random() > 0.3 ? 
          new Date(Date.now() + (Math.random() * 60 - 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          null,
        
        // Custom fields for WSJF calculation
        customfield_10001: Math.floor(Math.random() * 100000) + 10000, // Issue Value
        customfield_10002: Math.floor(Math.random() * 15), // Enterprise Accounts
        customfield_10003: Math.floor(Math.random() * 8), // Flagged Accounts
        customfield_10004: marketTimings[Math.floor(Math.random() * marketTimings.length)], // Market Timing
        customfield_10005: Math.floor(Math.random() * 13) + 1, // RR/OE Value
        customfield_10006: Math.floor(Math.random() * 13) + 1, // Story Points
        customfield_10007: customers[Math.floor(Math.random() * customers.length)], // Customer
        customfield_10008: teams[Math.floor(Math.random() * teams.length)], // Team
        customfield_10009: `Sprint ${Math.floor(Math.random() * 5) + 20}`, // Sprint
        
        labels: generateLabels(),
        components: [{ name: teams[Math.floor(Math.random() * teams.length)] }]
      }
    });
  }
  
  return issues;
}

function generateLabels() {
  const allLabels = ['critical', 'customer-reported', 'security', 'performance', 
                     'compliance', 'enhancement', 'tech-debt', 'urgent', 'blocked'];
  const count = Math.floor(Math.random() * 3) + 1;
  const labels = [];
  
  for (let i = 0; i < count; i++) {
    const label = allLabels[Math.floor(Math.random() * allLabels.length)];
    if (!labels.includes(label)) {
      labels.push(label);
    }
  }
  
  return labels;
}
