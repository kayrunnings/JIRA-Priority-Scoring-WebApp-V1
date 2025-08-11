# WSJF Enterprise Prioritization System

A professional **Weighted Shortest Job First (WSJF)** prioritization system for fintech teams, with JIRA integration and customizable scoring engine.

## 🚀 Live Demo
- **URL**: Your Vercel deployment URL
- **Status**: Production Ready v2.0

## ✨ Features

### Core Functionality
- **📥 JIRA Integration**
  - Import by JQL queries
  - Import by issue keys
  - Mock data fallback when API not configured
  
- **⚙️ Configurable Scoring Engine**
  - Customizable severity scores (Level 1-5)
  - Adjustable component weights
  - Market timing multipliers
  - Strategic tier bonuses
  
- **📊 WSJF Calculation**
  - Automatic score calculation
  - Cost of Delay computation
  - Real-time recalculation
  
- **🔍 Advanced Filtering**
  - Search by key or summary
  - Filter by severity, status, issue type
  - Dynamic sorting on all columns
  
- **💾 Data Management**
  - Browser storage persistence
  - CSV export functionality
  - Sync status tracking

## 📋 WSJF Formula

```
WSJF Score = (Cost of Delay ÷ Job Size) × 10

Cost of Delay = ROUND(
  Weighted Business Value + 
  Weighted Time Criticality + 
  Weighted RR/OE
)

Where:
- Weighted Business Value = (Severity + Client Bonus + Strategic Tier) × 0.4
- Weighted Time Criticality = (Due Date Urgency × Market Timing) × 0.3
- Weighted RR/OE = RR/OE Value × 0.3
```

## 🔧 Installation & Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd wsjf-prioritization-system
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm i -g vercel
vercel
```

#### Option B: GitHub Integration
1. Push to GitHub
2. Import project in Vercel Dashboard
3. Deploy automatically

### 3. Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
```

To get JIRA API token:
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create new API token
3. Copy and save securely

## 🎯 Usage Guide

### Importing Tickets

#### By JQL Query:
```sql
-- Examples:
project = PROD AND status != Done
assignee = currentUser() AND priority = High
labels in (critical, customer-reported)
sprint in openSprints() AND issuetype = Bug
```

#### By Issue Keys:
```
PROD-1234, PROD-1235, PROD-1236
```

### Configuring Scoring

1. Navigate to **Scoring Engine** tab
2. Adjust component weights (must sum to 1.0)
3. Modify severity scores as needed
4. Update calculation parameters

### Field Mappings

The system expects these JIRA custom fields:

| Field | Default ID | Description |
|-------|------------|-------------|
| Issue Value | customfield_10001 | Dollar value of issue |
| Enterprise Accounts | customfield_10002 | Number of enterprise accounts |
| Flagged Accounts | customfield_10003 | Number of flagged accounts |
| Market Timing | customfield_10004 | Timing category |
| RR/OE Value | customfield_10005 | Risk/Opportunity score |
| Story Points | customfield_10006 | Estimated points |

## 📁 Project Structure

```
wsjf-prioritization-system/
├── api/
│   └── jira.js          # Vercel API function
├── index.html           # Main application
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies
├── README.md           # Documentation
└── .gitignore          # Git ignore file
```

## 🐛 Bug Fixes Applied

### Fixed Issues:
1. ✅ localStorage error handling for restricted environments
2. ✅ Proper WSJF calculation according to formula
3. ✅ API mock data generation when credentials not configured
4. ✅ Correct market timing defaults based on severity
5. ✅ Due date urgency calculation with proper defaults
6. ✅ CORS handling in Vercel function
7. ✅ Error boundaries and fallbacks

## 🔌 API Endpoints

### Health Check
```
GET /api/jira
Response: { status: 'healthy', version: '2.0.0' }
```

### Import Tickets
```
POST /api/jira
Body: {
  action: 'fetchByJQL' | 'fetchByKeys',
  jql: 'your JQL query',
  keys: 'PROD-1234,PROD-1235'
}
```

## 🚦 Development

### Local Development
```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# Open http://localhost:3000
```

### Testing
- The system will use mock data if JIRA credentials are not configured
- Test with sample data before connecting to production JIRA

## 📊 Scoring Configuration

### Severity Levels
- **Level 5 - FIRE** (21 points): System down, security breach
- **Level 4 - Critical** (13 points): Business operations blocked
- **Level 3 - High** (8 points): Difficult workaround
- **Level 2 - Medium** (5 points): Functional issues
- **Level 1 - Low** (3 points): Cosmetic issues

### Strategic Tier Bonus
- Both Enterprise & Flagged: +5 points
- Only Flagged: +3 points
- Only Enterprise: +2 points
- Neither: 0 points

### Market Timing Multipliers
- Pointless afterwards: ×2.0
- Drops steeply: ×1.6
- Slowly degrading: ×1.4
- Nice to meet deadline: ×1.2
- No timing impact: ×1.0

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

For issues or questions:
- Create an issue in GitHub
- Contact your team lead
- Check JIRA API documentation

## 🔄 Changelog

### v2.0.0 (Current)
- Complete rewrite with bug fixes
- Improved error handling
- Mock data support
- Better WSJF calculations
- Storage fallbacks

### v1.0.0
- Initial release

---

**Built for better prioritization decisions** 🎯
