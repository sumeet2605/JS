const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const express = require('express');
const http = require('http');
const morgan = require('morgan');

if (!process.env.AGENT_ID) {
  throw new Error('AGENT_ID environment variable is required.');
}

const agentId = process.env.AGENT_ID;
const [, projectId, , location, , agentUuid] = agentId.split(/\//);

const app = express();
app.use(express.json());
app.use(morgan('combined'));
app.get('/', async (req, res) => {
  const opts = {
    apiEndpoint: `${location}-dialogflow.googleapis.com`,
    projectId,
    language: 'en'
  };

  const sessionId = Math.random().toString(36).substring(7);
  const client = new SessionsClient(opts);
  const response = await client.detectIntent({
    session: `${agentId}/sessions/${sessionId}`,
    queryInput: {
      text: {
        text: 'hello',
      },
      languageCode: 'en',
    }
  });
  res.send(response)
  res.end();
});
const port = parseInt(process.env.PORT) || 80;
http.createServer(app).listen(port, () => {
  console.log(`Listening on port ${port}`);
});