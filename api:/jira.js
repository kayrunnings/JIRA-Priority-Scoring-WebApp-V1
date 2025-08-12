const axios = require('axios');

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
        customfield_10006: Math.floor(Math.random() * 8) + 1,
        customfield_10007: ['Enterprise Corp', 'Small Business', 'Startup Inc'][i % 3],
        customfield_10008: ['Backend', 'Frontend', 'DevOps'][i % 3],
        labels: ['urgent', 'customer-reported', 'enhancement'][i % 3]
      }
    });
  }
  
  return tickets;
}

// Fetch tickets from JIRA
async function fetchFromJira(baseUrl, authHeader, jql, fieldMappings) {
  try {
    // Build fields list from mappings
    const fields = [
      'key', 'summary', 'issuetype', 'status', 'created', 'priority', 'duedate'
    ];
    
    if (fieldMappings) {
      if (fieldMappings.calculation) {
        fieldMappings.calculation.forEach(m => {
          if (m.enabled && m.jiraField) fields.push(m.jiraField);
        });
      }
      if (fieldMappings.display) {
        fieldMappings.display.forEach(m => {
          if (m.enabled && m.jiraField) fields.push(m.jiraField);
        });
      }
    }
    
    const response = await axios.post(
      `${baseUrl}/rest/api/3/search`,
      {
        jql: jql,
        fields: [...new Set(fields)], // Remove duplicates
        maxResults: 100
      },
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      issues: response.data.issues || []
    };
  } catch (error) {
    console.error('JIRA Fetch Error:', error.response?.data || error.message);
    throw error;
  }
}

// Update JIRA ticket
async function updateJiraTicket(baseUrl, authHeader, ticketKey, updates) {
  try {
    const response = await axios.put(
      `${baseUrl}/rest/api/3/issue/${ticketKey}`,
      {
        fields: updates
      },
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      message: `Ticket ${ticketKey} updated successfully`
    };
  } catch (error) {
    console.error('JIRA Update Error:', error.response?.data || error.message);
    throw error;
  }
}

// Main handler function
const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, jiraConfig, fieldMappings, ...params } = req.body;
    
    // Validate JIRA configuration
    if (!jiraConfig || !jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      // Return mock data if JIRA not configured
      return res.status(200).json({
        mock: true,
        issues: generateMockTickets(params)
      });
    }

    const authHeader = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64');
    
    switch (action) {
      case 'fetchByKeys':
        const keys = params.keys.split(',').map(k => k.trim());
        const jqlKeys = `key in (${keys.join(',')})`;
        const keysResult = await fetchFromJira(jiraConfig.baseUrl, authHeader, jqlKeys, fieldMappings);
        return res.status(200).json(keysResult);
        
      case 'fetchByJQL':
        const jqlResult = await fetchFromJira(jiraConfig.baseUrl, authHeader, params.jql, fieldMappings);
        return res.status(200).json(jqlResult);
        
      case 'updateFields':
        const updateResult = await updateJiraTicket(
          jiraConfig.baseUrl, 
          authHeader, 
          params.ticketKey, 
          params.updates
        );
        return res.status(200).json(updateResult);
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('JIRA API Error:', error);
    return res.status(200).json({ 
      error: error.message,
      mock: true,
      issues: generateMockTickets(req.body)
    });
  }
};

module.exports = allowCors(handler);
