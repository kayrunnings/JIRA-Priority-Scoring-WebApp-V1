// api/jira.js - Vercel Function for JIRA Integration
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/api/jira/health') {
    return res.status(200).json({ status: 'ok' });
  }
  
  // Main JIRA API handler
  if (req.method === 'POST') {
    try {
      const { type, keys, jql } = req.body;
      
      // Get credentials from environment variables
      const JIRA_URL = process.env.JIRA_URL;
      const JIRA_EMAIL = process.env.JIRA_EMAIL;
      const JIRA_TOKEN = process.env.JIRA_TOKEN;
      
      if (!JIRA_URL || !JIRA_EMAIL || !JIRA_TOKEN) {
        return res.status(500).json({ 
          error: 'JIRA credentials not configured in environment variables' 
        });
      }
      
      // Build JQL query based on request type
      let jqlQuery = '';
      if (type === 'byKeys' && keys) {
        jqlQuery = `key in (${keys.join(',')})`;
      } else if (type === 'byJQL' && jql) {
        jqlQuery = jql;
      } else {
        return res.status(400).json({ error: 'Invalid request type' });
      }
      
      // Call JIRA API
      const jiraResponse = await fetch(`${JIRA_URL}/rest/api/3/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jql: jqlQuery,
          maxResults: 100,
          fields: [
            'summary',
            'priority',
            'issuetype',
            'status',
            'created',
            'duedate',
            'customfield_10001', // Issue Value
            'customfield_10002', // Enterprise Accounts
            'customfield_10003', // Flagged Accounts
            'customfield_10004', // Market Timing
            'customfield_10005', // RR/OE Value
            'customfield_10006'  // Story Points
          ]
        })
      });
      
      if (!jiraResponse.ok) {
        throw new Error(`JIRA API error: ${jiraResponse.status}`);
      }
      
      const data = await jiraResponse.json();
      res.status(200).json(data);
      
    } catch (error) {
      console.error('JIRA API Error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch from JIRA',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
