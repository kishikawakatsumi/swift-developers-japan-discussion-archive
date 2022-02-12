"use strict";

require("dotenv").config();

const fs = require("fs");
const algoliasearch = require("algoliasearch");

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = client.initIndex("messages");

const root = "data/json";
fs.readdirSync(root).forEach(async (file) => {
  if (!file.endsWith(".json")) {
    return;
  }
  const data = JSON.parse(fs.readFileSync(`${root}/${file}`, "utf-8"));
  const messages = data.messages.map((message) => ({
    objectID: message.id,
    channel: data.channel,
    ...message,
    html: fs.readFileSync(
      `data/message_html_fragments/${message.id}.html`,
      "utf-8"
    ),
  }));
  await index.saveObjects(messages, { autoGenerateObjectIDIfNotExist: false });
});
