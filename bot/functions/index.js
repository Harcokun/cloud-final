const functions = require("firebase-functions");
const axios = require("axios");
const { Client } = require("@line/bot-sdk");
const csv = require('csv-parser');
const fs = require('fs');

const region = "asia-southeast1";

const config = {
  channelAccessToken:
    "QGRaL+p4QsvkfHgvoRlsBGZZ6heeitVQ64nrSH9HAnuWRXKqmk4lJ7EjxvvvO0oOrOnmXn7sssMEbXDMZNmUmg0YAEGzymRUGo48ek6j67wu+W+VCP15PU0Rflmi5Cb7DtjkrsDIpfxZJutakQylPAdB04t89/1O/w1cDnyilFU=",
  channelSecret: "6e8fb78d17e055ff6f1f193193a0f1d6",
};

var quizFlexMessage = {
  "type": "flex",
  "altText": "Q1. What is the capital of Japan?",
  "contents": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "md",
      "contents": [
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "Q",
              "align": "center",
              "size": "xxl",
              "weight": "bold"
            },
            {
              "type": "text",
              "text": "What is the capital of Japan?",
              "wrap": true,
              "weight": "bold",
              "margin": "lg"
            }
          ]
        },
        {
          "type": "separator"
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "contents": [
            {
              "type": "box",
              "layout": "baseline",
              "contents": [
                {
                  "type": "text",
                  "text": "1.",
                  "flex": 1,
                  "size": "lg",
                  "weight": "bold",
                  "color": "#666666"
                },
                {
                  "type": "text",
                  "text": "Tokyo",
                  "wrap": true,
                  "flex": 9
                }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "contents": [
                {
                  "type": "text",
                  "text": "2.",
                  "flex": 1,
                  "size": "lg",
                  "weight": "bold",
                  "color": "#666666"
                },
                {
                  "type": "text",
                  "text": "Osaka",
                  "wrap": true,
                  "flex": 9
                }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "contents": [
                {
                  "type": "text",
                  "text": "3.",
                  "flex": 1,
                  "size": "lg",
                  "weight": "bold",
                  "color": "#666666"
                },
                {
                  "type": "text",
                  "text": "Kyoto",
                  "wrap": true,
                  "flex": 9
                }
              ]
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "height": "sm",
          "action": {
            "type": "postback",
            "label": "1",
            "data": "1",
            "displayText": "Tokyo"
          }
        },
        {
          "type": "button",
          "style": "primary",
          "height": "sm",
          "action": {
            "type": "postback",
            "label": "2",
            "data": "2",
            "displayText": "Osaka"
          }
        },
        {
          "type": "button",
          "style": "primary",
          "height": "sm",
          "action": {
            "type": "postback",
            "label": "3",
            "data": "3",
            "displayText": "Kyoto"
          }
        }
      ]
    }
  }
} 

const client = new Client(config);

const questions = [];
var correct_idx_answer = "1";

fs.createReadStream('question_list.csv')
  .pipe(csv({ headers: false }))
  .on('data', (data) => {
    questions.push(data);
  })
  .on('end', () => {
    console.log(questions);
  });

exports.lineBot = functions.region(region).https.onRequest(async (req, res) => {
  if (req.method === "POST") {
    const events = req.body.events;
    var message = { type: "text", text: "" };
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.type === "message" && event.message.type === "text") {
        message = { type: "text", text: event.message.text };
        if (event.message.text == "Q" || event.message.text == "q") {
          // Generate question
          const question = questions[Math.floor(Math.random() * questions.length)];
          quizFlexMessage.contents.body.contents[0].contents[1].text = question[0]; // Question
          quizFlexMessage.contents.body.contents[2].contents[0].contents[1].text = question[1]; // Choice 1 - Text
          quizFlexMessage.contents.footer.contents[0].action.displayText = question[1]; // Choice 1 - Button
          quizFlexMessage.contents.body.contents[2].contents[1].contents[1].text = question[2]; // Choice 2 - Text
          quizFlexMessage.contents.footer.contents[1].action.displayText = question[2]; // Choice 2 - Button
          quizFlexMessage.contents.body.contents[2].contents[2].contents[1].text = question[3]; // Choice 3 - Text
          quizFlexMessage.contents.footer.contents[2].action.displayText = question[3]; // Choice 3 - Button
          correct_idx_answer = question[4];
          // Send the Flex Message template to the user
          await client.replyMessage(event.replyToken, quizFlexMessage);
        } else {
          await client.replyMessage(event.replyToken, message);
        }
      }

      // Handle the user's selection of an answer choice
      if (event.type === "postback") {
        console.log("event: " + JSON.stringify(event));
        if (event.postback.data == correct_idx_answer) {
          // Execute action for correct answer
          message = { type: "text", text: "Correct answer!" };
          await client.replyMessage(event.replyToken, message);
        } else {
          // Execute action for incorrect answer
          message = { type: "text", text: "Incorrect answer!" };
          await client.replyMessage(event.replyToken, message);
        }
      }
    }
  }
  res.status(200).send("OK");
});
