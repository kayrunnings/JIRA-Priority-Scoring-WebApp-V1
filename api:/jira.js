// This is a Vercel Function (serverless backend)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Your JIRA API logic here
    const jiraUrl = process.env.JIRA_URL;
    const jiraToken = process.env.JIRA_TOKEN;
    
    // Fetch from JIRA (example)
    const response = await fetch(`${jiraUrl}/rest/api/3/search`, {
      headers: {
        'Authorization': `Basic ${jiraToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from JIRA' });
  }
}