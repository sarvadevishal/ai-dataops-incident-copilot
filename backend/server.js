require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Initialize Z.AI client using OpenAI SDK
const zaiClient = new OpenAI({
  baseURL: 'https://api.z.ai/api/paas/v4',
  apiKey: process.env.ZAI_API_KEY,
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { issueText, incidentType, audience } = req.body;

    if (!issueText || !incidentType || !audience) {
      return res.status(400).json({ error: 'Missing required fields: issueText, incidentType, audience' });
    }

    if (!process.env.ZAI_API_KEY) {
      return res.status(500).json({ error: 'Z.AI API key is not configured on the server.' });
    }

    const systemPrompt = `You are an elite enterprise DataOps incident copilot built by senior data architects, data platform CTOs, and production support experts.

You analyze ETL, SQL, Redshift, Informatica, AWS Glue, and data quality incidents.

Your job is to turn raw technical issue text into a practical incident package that helps:
- Engineers debug faster
- Managers understand impact
- Customers receive clear updates
- Teams prevent repeat failures

Return the response in valid JSON only with these keys:
"executiveSummary"
"rootCause"
"businessImpact"
"technicalExplanation"
"fixedSqlOrLogic"
"validationQuery"
"jiraReadyUpdate"
"customerStatusUpdate"
"preventionChecklist"
"assumptions"
"confidenceLevel"

Rules:
- Be accurate.
- Do not invent missing facts.
- If source table, target table, column, error code, or system is missing, mention it under assumptions.
- Use Redshift-safe SQL when possible.
- If SQL cannot be provided, provide ETL pseudo-logic.
- Keep executiveSummary under 3 lines.
- Keep customerStatusUpdate calm, professional, and non-technical.
- Make jiraReadyUpdate ready to paste into Jira.
- Use preventionChecklist as practical action items (array of strings).
- assumptions should be an array of strings.
- confidenceLevel must be High, Medium, or Low.
- Ensure the JSON format is strictly correct, without Markdown code blocks around it if possible, just the raw JSON, or ensure it is parseable JSON.`;

    const userPrompt = `Incident Type: ${incidentType}\nAudience: ${audience}\n\nIncident Details:\n${issueText}`;

    const completion = await zaiClient.chat.completions.create({
      model: 'glm-5.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    let resultContent = completion.choices[0].message.content;
    
    // Safety fallback: Parse the string just to make sure it's valid JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultContent);
    } catch (e) {
      // Sometimes models wrap json in markdown
      const jsonMatch = resultContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        parsedResult = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse model output as JSON.');
      }
    }

    res.json(parsedResult);
  } catch (error) {
    console.error('Error during analysis:', error);
    res.status(500).json({ error: 'Failed to process incident.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
