// api/jira.js - Complete Vercel Function for JIRA Integration
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Health check endpoint
  if (req.method === 'GET' && req.url.includes('/health')) {
    return res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  }
  
  // Main JIRA API handler
  if (req.method === 'POST') {
    try {
      const { type, keys, jql, action, data } = req.body;
      
      // Get credentials from environment variables
      const JIRA_URL = process.env.JIRA_URL;
      const JIRA_EMAIL = process.env.JIRA_EMAIL;
      const JIRA_TOKEN = process.env.JIRA_TOKEN;
      
      if (!JIRA_URL || !JIRA_EMAIL || !JIRA_TOKEN) {
        // Return mock data if credentials not configured
        return res.status(200).json({ 
          issues: generateMockIssues(jql || keys),
          mock: true 
        });
      }
      
      const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`;
      
      // Handle different action types
      switch (action || type) {
        case 'byKeys':
        case 'fetchByKeys':
          return await fetchByKeys(keys, authHeader, JIRA_URL, res);
          
        case 'byJQL':
        case 'fetchByJQL':
          return await fetchByJQL(jql, authHeader, JIRA_URL, res);
          
        case 'getFields':
          return await getJiraFields(authHeader, JIRA_URL, res);
          
        case 'updateField':
          return await updateJiraField(data, authHeader, JIRA_URL, res);
          
        case 'getProjects':
          return await getProjects(authHeader, JIRA_URL, res);
          
        case 'getSprints':
          return await getSprints(data.projectId, authHeader, JIRA_URL, res);
          
        default:
          // Default to JQL search
          const defaultJql = jql || 'project != EMPTY ORDER BY priority DESC';
          return await fetchByJQL(defaultJql, authHeader, JIRA_URL, res);
      }
      
    } catch (error) {
      console.error('JIRA API Error:', error);
      res.status(500).json({ 
        error: 'Failed to process JIRA request',
        details: error.message,
        mock: true,
        issues: generateMockIssues('error')
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Fetch tickets by issue keys
async function fetchByKeys(keys, authHeader, JIRA_URL, res) {
  const keyArray = Array.isArray(keys) ? keys : keys.split(',').map(k => k.trim());
  const jql = `key in (${keyArray.join(',')})`;
  return fetchByJQL(jql, authHeader, JIRA_URL, res);
}

// Fetch tickets by JQL query
async function fetchByJQL(jql, authHeader, JIRA_URL, res) {
  try {
    const response = await fetch(`${JIRA_URL}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: 100,
        fields: [
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
          'customfield_10010', // WSJF Score (for writing back)
          'customfield_10011', // Cost of Delay (for writing back)
          'customfield_10012'  // Rank (for writing back)
        ],
        expand: ['changelog', 'renderedFields']
      })
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json({
      issues: data.issues,
      total: data.total,
      maxResults: data.maxResults,
      startAt: data.startAt
    });
    
  } catch (error) {
    console.error('JQL Search Error:', error);
    return res.status(200).json({
      issues: generateMockIssues(jql),
      mock: true,
      error: error.message
    });
  }
}

// Get available JIRA fields
async function getJiraFields(authHeader, JIRA_URL, res) {
  try {
    const response = await fetch(`${JIRA_URL}/rest/api/3/field`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    const fields = await response.json();
    
    // Filter and format fields for easier consumption
    const formattedFields = fields.map(field => ({
      id: field.id,
      name: field.name,
      custom: field.custom,
      schema: field.schema,
      searchable: field.searchable,
      navigable: field.navigable,
      orderable: field.orderable
    }));
    
    return res.status(200).json({
      fields: formattedFields,
      customFields: formattedFields.filter(f => f.custom),
      systemFields: formattedFields.filter(f => !f.custom)
    });
    
  } catch (error) {
    console.error('Get Fields Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch JIRA fields',
      details: error.message
    });
  }
}

// Update a JIRA field
async function updateJiraField(data, authHeader, JIRA_URL, res) {
  const { issueKey, fieldId, value } = data;
  
  try {
    const response = await fetch(`${JIRA_URL}/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          [fieldId]: value
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Updated ${fieldId} for ${issueKey}`
    });
    
  } catch (error) {
    console.error('Update Field Error:', error);
    return res.status(500).json({
      error: 'Failed to update JIRA field',
      details: error.message
    });
  }
}

// Get available projects
async function getProjects(authHeader, JIRA_URL, res) {
  try {
    const response = await fetch(`${JIRA_URL}/rest/api/3/project`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`JIRA API returned ${response.status}`);
    }
    
    const projects = await response.json();
    return res.status(200).json({
      projects: projects.map(p => ({
        id: p.id,
        key: p.key,
        name: p.name,
        projectTypeKey: p.projectTypeKey
      }))
    });
    
  } catch (error) {
    console.error('Get Projects Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch projects',
      details: error.message
    });
  }
}

// Get sprints for a project
async function getSprints(projectId, authHeader, JIRA_URL, res) {
  try {
    const boardsResponse = await fetch(
      `${JIRA_URL}/rest/agile/1.0/board?projectKeyOrId=${projectId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!boardsResponse.ok) {
      throw new Error(`JIRA API returned ${boardsResponse.status}`);
    }
    
    const boardsData = await boardsResponse.json();
    const boards = boardsData.values || [];
    
    if (boards.length === 0) {
      return res.status(200).json({ sprints: [] });
    }
    
    // Get sprints from the first board
    const sprintsResponse = await fetch(
      `${JIRA_URL}/rest/agile/1.0/board/${boards[0].id}/sprint`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!sprintsResponse.ok) {
      throw new Error(`JIRA API returned ${sprintsResponse.status}`);
    }
    
    const sprintsData = await sprintsResponse.json();
    return res.status(200).json({
      sprints: sprintsData.values.map(s => ({
        id: s.id,
        name: s.name,
        state: s.state,
        startDate: s.startDate,
        endDate: s.endDate
      }))
    });
    
  } catch (error) {
    console.error('Get Sprints Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch sprints',
      details: error.message
    });
  }
}

// Generate mock issues for demo/testing
function generateMockIssues(context) {
  const severities = ['Level 5 - FIRE', 'Level 4 - Critical', 'Level 3 - High', 'Level 2 - Medium', 'Level 1 - Low'];
  const statuses = ['To Do', 'In Progress', 'In Review', 'Done'];
  const types = ['Bug', 'Story', 'Task', 'Improvement'];
  const teams = ['Backend', 'Frontend', 'DevOps', 'QA', 'Compliance'];
  const marketTimings = ['Pointless afterwards', 'Drops steeply', 'Slowly degrading', 'Nice to meet deadline', 'No timing impact'];
  
  const count = Math.floor(Math.random() * 5) + 3;
  const issues = [];
  
  for (let i = 0; i < count; i++) {
    issues.push({
      key: `DEMO-${Date.now() + i}`,
      fields: {
        summary: `Mock ticket ${i + 1} from: ${String(context).substring(0, 50)}`,
        priority: { name: ['Highest', 'High', 'Medium', 'Low', 'Lowest'][Math.floor(Math.random() * 5)] },
        issuetype: { name: types[Math.floor(Math.random() * types.length)] },
        status: { name: statuses[Math.floor(Math.random() * statuses.length)] },
        created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        duedate: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString() : null,
        assignee: { displayName: `User ${Math.floor(Math.random() * 10)}` },
        customfield_10001: Math.floor(Math.random() * 100000) + 10000, // Issue Value
        customfield_10002: Math.floor(Math.random() * 15), // Enterprise Accounts
        customfield_10003: Math.floor(Math.random() * 8), // Flagged Accounts
        customfield_10004: marketTimings[Math.floor(Math.random() * marketTimings.length)], // Market Timing
        customfield_10005: Math.floor(Math.random() * 13) + 1, // RR/OE Value
        customfield_10006: Math.floor(Math.random() * 13) + 1, // Story Points
        customfield_10007: `Customer ${Math.floor(Math.random() * 20) + 1}`, // Customer
        customfield_10008: teams[Math.floor(Math.random() * teams.length)], // Team
        customfield_10009: `Sprint ${Math.floor(Math.random() * 5) + 20}` // Sprint
      }
    });
  }
  
  return issues;
}
