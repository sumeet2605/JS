const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
const http = require('http');
const morgan = require('morgan');
require('dotenv').config();

const {SessionsClient} = require('@google-cloud/dialogflow-cx');
const { response } = require("express");

if (!process.env.AGENT_ID) {
  throw new Error('AGENT_ID environment variable is required.');
}

const agentId = process.env.AGENT_ID;
const [, projectId, , location, , agentUuid] = agentId.split(/\//);
const app = express();
app.use(express.json());
app.use(morgan('combined'));

const port = process.env.PORT || 8080;
const token = process.env.TOKEN;
const mytoken=process.env.MYTOKEN;

app.listen(port, ()=>{
    console.log("Webhook is listening");
});

app.get("/webhook",(req,res)=>{
    let mode = req.query["hub.mode"];
    let challenge = req.query["hub.challenge"];
    let token =req.query["hub.verify_token"];

    

    if(mode && token){
        if(mode=="subscribe" && token==mytoken){
            res.status(200).send(challenge);
        }else{
            res.status(403);
        }
    }
});

async function detectIntentText(query) {
  const opts = {
    apiEndpoint: `${location}-dialogflow.googleapis.com`,
    projectId,
    language: 'en'
  };

  const sessionId = Math.random().toString(36).substring(7);
  const client = new SessionsClient(opts);
  const [response] = await client.detectIntent({
    session: `${agentId}/sessions/${sessionId}`,
    queryInput: {
      text: {
        text: query,
      },
      languageCode: 'en',
    }
  });
  let text = "";
  for (const message of response.queryResult.responseMessages) {
    if (message.text) {
      console.log(`Agent Response: ${message.text.text}`);
      
      text += message.text.text;
      text += "\n"

      }
    }
    if (response.queryResult.match.intent) {
      console.log(
        `Matched Intent: ${response.queryResult.match.intent.displayName}`
      );
    }
    console.log(
      `Current Page: ${response.queryResult.currentPage.displayName}`
    );
    console.log(
      `Text: ${text.trim()}`
    );
  return text;
  }

app.post("/webhook",(req,res)=>{ //i want some 

    let body_param=req.body;

    // console.log(JSON.stringify(body_param,null,2));

    if(body_param.object){
        if(body_param.entry && 
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]  
            ){
               let phon_no_id=body_param.entry[0].changes[0].value.metadata.phone_number_id;
               let from = body_param.entry[0].changes[0].value.messages[0].from; 
               let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

               console.log("phone number "+phon_no_id);
               console.log("from "+from);
               console.log("boady param "+msg_body);
               
               let responses = detectIntentText(msg_body);     
               
               console.log(`Response: ${responses}`);

               
               axios({
                   method:"POST",
                   url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
                   data:{
                       messaging_product:"whatsapp",
                       to:from,
                       text:{
                           body: "Welcome to Alluring Lens."
                       }
                   },
                   headers:{
                       "Content-Type":"application/json"
                   }

               });

               res.sendStatus(200);
            }else{

                res.sendStatus(404);
            }

    }

});

app.get("/",(req,res)=>{
    res.status(200).send("Hello this is webhook setup");

});