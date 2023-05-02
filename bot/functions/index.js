require("dotenv").config();

const quizFlexMessage = require("./quiz_flex_message_template.json");
const functions = require("firebase-functions");
const axios = require("axios");
const { Client } = require("@line/bot-sdk");
const csv = require("csv-parser");
const fs = require("fs");

const region = "asia-southeast1";

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new Client(config);

const questions = [];
var correctIdxAnswer = "1";
var randomIdx = 0;

fs.createReadStream("question_list.csv")
  .pipe(csv({ headers: false }))
  .on("data", (data) => {
    questions.push(data);
  })
  .on("end", () => {
    // console.log(questions);
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
          randomIdx = Math.floor(Math.random() * questions.length);
          const question = questions[randomIdx]; // Random quiz
          quizFlexMessage.contents.body.contents[0].contents[1].text =
            question[0]; // Question
          quizFlexMessage.contents.body.contents[2].contents[0].contents[1].text =
            question[1]; // Choice 1 - Text
          quizFlexMessage.contents.footer.contents[0].action.displayText =
            question[1]; // Choice 1 - Button
          quizFlexMessage.contents.body.contents[2].contents[1].contents[1].text =
            question[2]; // Choice 2 - Text
          quizFlexMessage.contents.footer.contents[1].action.displayText =
            question[2]; // Choice 2 - Button
          quizFlexMessage.contents.body.contents[2].contents[2].contents[1].text =
            question[3]; // Choice 3 - Text
          quizFlexMessage.contents.footer.contents[2].action.displayText =
            question[3]; // Choice 3 - Button
          correctIdxAnswer = question[4];
          // Send the Flex Message template to the user
          await client.replyMessage(event.replyToken, quizFlexMessage);
        } else {
          await client.replyMessage(event.replyToken, message);
        }
      }

      // Handle the user's selection of an answer choice
      if (event.type === "postback") {
        // console.log("event: " + JSON.stringify(event));
        if (event.postback.data == correctIdxAnswer) {
          // Execute action for correct answer
          message = { type: "text", text: "Correct answer!" };
          await client.replyMessage(event.replyToken, message);
        } else {
          // Execute action for incorrect answer
          var correctTextChoice =
            quizFlexMessage.contents.body.contents[2].contents[
              parseInt(correctIdxAnswer) - 1
            ].contents[1].text;
          var messageText =
            "Incorrect answer! The correct answer is " + correctTextChoice;
          await axios({
            method: "get",
            url: "https://qgmochpzka.execute-api.ap-northeast-1.amazonaws.com/default/PollyLex_quiz",
            data: JSON.stringify({
              operation: "polly",
              name: "incorrect_q" + randomIdx + ".m4a",
              text: messageText,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => {
              console.log(response.data);
              message = {
                type: "audio",
                originalContentUrl: response.data.data,
                duration: response.data.duration * 1000, // duration in miliseconds
              };
            })
            .catch((error) => {
              console.error("Error from axios - Polly:", error);
            });
          // message = { type: "text", text: messageText };
          await client.replyMessage(event.replyToken, message);
        }
      }
    }
  }
  res.status(200).send("OK");
});
