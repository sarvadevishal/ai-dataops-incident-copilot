require('dotenv').config();

const OpenAI = require('openai');

const zaiClient = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: 'https://api.z.ai/api/paas/v4',
});

async function testZaiConnection() {
  if (!process.env.ZAI_API_KEY) {
    throw new Error('Missing ZAI_API_KEY in .env file');
  }

  const response = await zaiClient.chat.completions.create({
    model: 'glm-5.1',
    messages: [
      {
        role: 'user',
        content: 'Say hello and confirm the Z.AI API is working.',
      },
    ],
  });

  console.log(response.choices[0].message.content);
}

testZaiConnection().catch((error) => {
  console.error('Z.AI API test failed:', error.message);
});