const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
require('dotenv').config();

const {SessionsClient} = require('@google-cloud/dialogflow-cx');
const { response } = require("express");

const project_id = process.env.PROJECT_ID;
const location = 'global';
const agentId = process.env.AGENTID;
const port = process.env.PORT || 8080;
const languageCode = 'en';
const client = new SessionsClient();



const app = express().use(body_parser.json());
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
    const sessionId = Math.random().toString(36).substring(7);
    const sessionPath = client.projectLocationAgentSessionPath(
      projectId,
      location,
      agentId,
      sessionId
    );
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
        },
        languageCode,
      },
    };
    const [response] = await client.detectIntent(request);
    for (const message of response.queryResult.responseMessages) {
      if (message.text) {
        console.log(`Agent Response: ${message.text.text}`);
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
  }
  
app.post("/webhook",(req,res)=>{ //i want some 

    let body_param=req.body;

    console.log(JSON.stringify(body_param,null,2));

    if(body_param.object){
        console.log("inside body param");
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
               let response = detectIntentText(msg_body);     
               console.log("Response: "+response)
               axios({
                   method:"POST",
                   url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
                   data:{
                       messaging_product:"whatsapp",
                       to:from,
                       text:{
                           body:"Hi..... Welcome to Alluring Lens by AR"
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