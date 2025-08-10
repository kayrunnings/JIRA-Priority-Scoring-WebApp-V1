# 🚀 WSJF Prioritization System v2.0

Advanced **Weighted Shortest Job First (WSJF)** prioritization system with JQL support and custom field mapping for JIRA tickets. Built for fintech teams to make data-driven prioritization decisions.

![WSJF Dashboard](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.0-61dafb)
![JQL Support](https://img.shields.io/badge/JQL-Supported-orange)

## ✨ What's New in v2.0

- **🔍 JQL Query Support** - Import tickets using powerful JIRA Query Language
- **🔧 Custom Field Mapping** - Configure and import any JIRA custom fields
- **🏷️ Advanced Filtering** - Filter by text, labels, and custom fields
- **📊 Dynamic Sorting** - Sort by any field including custom fields
- **📋 Field Configuration UI** - Visual interface for managing field mappings
- **🎯 Enhanced Export** - Export includes all custom fields

## 📋 Features

### Core Functionality
- **📥 Multiple Import Methods**
  - Import by JIRA issue keys (comma-separated)
  - Import using JQL queries
  - Manual ticket entry
- **🔧 Custom Field Management**
  - Map JIRA custom fields to WSJF fields
  - Add unlimited additional fields
  - Control field visibility in tables
- **⚙️ Configurable Scoring Engine**
  - Customize severity scores
  - Adjust due date urgency values
  - Configure market timing multipliers
  - Set custom weights for factors
- **📊 Advanced Prioritization**
  - Real-time WSJF score calculations
  - Multi-field filtering
  - Dynamic sorting options
  - Label-based filtering
- **💾 Data Management**
  - Local browser storage
  - CSV export with custom fields
  - Bulk ticket operations

### WSJF Components
- **Severity Scoring** (Level 1-5: Low to FIRE)
- **Client Value Tracking** 
  - Issue value in dollars
  - Enterprise accounts impacted
  - Flagged accounts impacted
- **Time Criticality** 
  - Due date urgency
  - Market timing multipliers
- **Risk Reduction/Opportunity Enablement** (RR/OE)
- **Story Point Estimation**

## 🎯 Quick Start

### Option 1: Direct Browser (Instant)
```bash
1. Download index.html
2. Open in any modern browser
3. Start prioritizing!
```

### Option 2: Local Server
```bash
# Clone repository
git clone https://github.com/YOUR-USERNAME/wsjf-prioritization-system.git
cd wsjf-prioritization-system

# Install dependencies (optional)
npm install

# Start server
npm start

# Open http://localhost:3000
```

### Option 3: Cloud Deployment
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/wsjf-prioritization-system)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR-USERNAME/wsjf-prioritization-system)

## 🔍 JQL Query Examples

The system supports full JQL syntax for importing tickets:

```sql
-- Basic queries
project = PROD AND status = "In Progress"
assignee = currentUser() AND priority = High
issuetype = Bug AND created >= -7d

-- Complex queries
project = PROD AND (priority = High OR severity = "Critical") AND status != Done
labels in (customer-reported, critical) AND resolution is EMPTY
fixVersion = "2024.1" AND component = "Payment Module"
"Epic Link" = PROD-100 AND updated >= -24h

-- Custom field queries
"Customer Impact" = High AND "Revenue at Risk" > 10000
cf[10001] = "Enterprise" AND cf[10002] > 5
```

## 🔧 Field Mapping Configuration

### Required WSJF Fields
Configure these JIRA custom field IDs in the Field Mappings tab:

| WSJF Field | Default JIRA Field | Description |
|------------|-------------------|-------------|
| Issue Value | customfield_10001 | Dollar value of the issue |
| Enterprise Accounts | customfield_10002 | Number of enterprise accounts affected |
| Flagged Accounts | customfield_10003 | Number of flagged accounts affected |
| Market Timing | customfield_10004 | Market timing category |
| RR/OE Value | customfield_10005 | Risk Reduction/Opportunity Enablement score |
| Story Points | customfield_10006 | Estimated story points |

### Additional Custom Fields
Add any JIRA fields for enhanced tracking:

```javascript
// Common fields to add:
- labels           // Issue labels
- components       // Project components  
- fixVersions      // Target release versions
- priority         // JIRA priority
- customfield_10007 // Customer name
- customfield_10008 // Sprint
- customfield_10009 // Epic Link
- customfield_10010 // Team
```

## 📐 WSJF Formula

```
WSJF Score = (Cost of Delay ÷ Job Size) × 10

Where:
Cost of Delay = ROUND(
  Weighted Business Value + 
  Weighted Time Criticality + 
  Weighted RR/OE
)
```

### Detailed Calculations

#### Weighted Business Value (40% default)
```
= (Severity Score + Client Count Bonus + Strategic Tier Bonus) × Weight
```

#### Weighted Time Criticality (30% default)
```
= (Due Date Urgency × Market Timing Multiplier) × Weight
```

#### Weighted RR/OE Value (30% default)
```
= RR/OE Value × Weight
```

## 🎨 Configuration Options

### Severity Scores
| Level | Default | Example Criteria |
|-------|---------|------------------|
| Level 5 - FIRE | 21 | System down, security breach, legal liability |
| Level 4 - Critical | 13 | Business operations blocked, churn risk |
| Level 3 - High | 8 | Difficult workaround, >50% workflows affected |
| Level 2 - Medium | 5 | Functional issues, <50% workflows affected |
| Level 1 - Low | 3 | Cosmetic issues, minor improvements |

### Strategic Tier Bonus
| Condition | Bonus Points |
|-----------|-------------|
| Both Enterprise & Flagged Accounts > 0 | 5 |
| Only Flagged Accounts > 0 | 3 |
| Only Enterprise Accounts > 0 | 2 |
| Neither > 0 | 0 |

## 🔌 JIRA Integration Setup

### 1. Create API Token
```bash
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create new API token
3. Save securely
```

### 2. Configure Custom Fields
```javascript
// In your JIRA instance, create custom fields:
1. Go to Settings → Issues → Custom fields
2. Create fields for:
   - Issue Value (Number field)
   - Enterprise Accounts Impacted (Number field)
   - Flagged Accounts Impacted (Number field)
   - Market Timing (Select list)
   - RR/OE Value (Number field)
3. Note the customfield_xxxxx IDs
4. Update in Field Mappings tab
```

### 3. Connect to Real JIRA (Advanced)
Replace mock functions in the code with actual API calls:

```javascript
// Example JIRA API integration
async fetchTicketsByJQL(jql) {
  const response = await fetch(`${JIRA_URL}/rest/api/3/search`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(EMAIL + ':' + API_TOKEN)}`,
      'Content-Type': 'application/json'
    },
    params: {
      jql: jql,
      fields: fieldMappings.getAllFields()
    }
  });
  return transformJiraResponse(response.json());
}
```

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 🚦 Usage Guide

### Importing Tickets

1. **By Issue Keys**
   - Enter comma-separated keys: `PROD-1234, PROD-1235`
   - Click "Import by Keys"

2. **By JQL Query**
   - Enter JQL: `project = PROD AND status = "In Progress"`
   - Click "Import by JQL"

### Managing Fields

1. Go to **Field Mappings** tab
2. Update Required WSJF field IDs
3. Add Additional Custom Fields:
   - Enter JIRA field ID
   - Set display name
   - Enable "Import" to fetch from JIRA
   - Enable "Show" to display in table

### Filtering & Sorting

1. **Text Filter**: Search by key, summary, or status
2. **Label Filter**: Select multiple labels to filter
3. **Sort Options**: Choose field and direction
4. **Clear Filters**: Reset all filters

### Exporting Data

1. Click "Export to CSV"
2. Includes all enabled custom fields
3. Opens in Excel/Google Sheets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR-USERNAME/wsjf-prioritization-system/issues)
- **Email**: your-email@company.com
- **Documentation**: [Wiki](https://github.com/YOUR-USERNAME/wsjf-prioritization-system/wiki)

## 🗺️ Roadmap

### Version 2.1
- [ ] Real-time JIRA sync
- [ ] Bulk edit capabilities
- [ ] Advanced analytics dashboard

### Version 3.0
- [ ] User authentication
- [ ] Team collaboration
- [ ] Historical tracking
- [ ] AI-powered insights
- [ ] Slack/Teams integration

### Future
- [ ] Mobile app
- [ ] API endpoints
- [ ] Webhook support
- [ ] Custom scoring algorithms
- [ ] Machine learning predictions

## 🏆 Credits

- WSJF framework from Scaled Agile Framework (SAFe)
- Built for fintech teams requiring sophisticated prioritization
- Inspired by the need for data-driven decision making

---

**Made with ❤️ for better prioritization decisions**

*Last updated: 2024*