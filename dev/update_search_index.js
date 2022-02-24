"use strict";

require("dotenv").config();

const fs = require("fs");
const algoliasearch = require("algoliasearch");

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = client.initIndex("messages");

const optoutUsers = new Set();

fs.readdirSync("temp/dm", { withFileTypes: true }).forEach((dirent) => {
  if (!dirent.name.endsWith(".json")) {
    return;
  }
  const data = JSON.parse(fs.readFileSync(`temp/dm/${dirent.name}`, "utf-8"));
  const messages = data.messages;
  for (const message of messages) {
    if (message.author) {
      optoutUsers.add(message.author.id);
    }
  }
});

const root = "data/json";
fs.readdirSync(root, { withFileTypes: true }).forEach(async (dirent) => {
  if (dirent.isDirectory()) {
    const channelId = dirent.name;
    fs.readdirSync(`${root}/${dirent.name}`, { withFileTypes: true }).forEach(
      async (dirent) => {
        if (dirent.name === "metadata.json" || !dirent.name.endsWith(".json")) {
          return;
        }
        const data = JSON.parse(
          fs.readFileSync(`${root}/${channelId}/${dirent.name}`, "utf-8")
        );
        const messages = data.messages.map((message) => ({
          objectID: message.id,
          channel: data.channel,
          ...message,
          html: fs.readFileSync(
            `data/message_html_fragments/${message.id}.html`,
            "utf-8"
          ),
        }));
        await index.saveObjects(messages, {
          autoGenerateObjectIDIfNotExist: false,
        });

        const optOutMessageIds = messages
          .filter((message) => {
            return optoutUsers.has(message.author.id);
          })
          .map((message) => message.id);
        if (optOutMessageIds.length) {
          await index.deleteObjects(optOutMessageIds);
        }
      }
    );
    return;
  }
  if (!dirent.name.endsWith(".json")) {
    return;
  }
  const data = JSON.parse(fs.readFileSync(`${root}/${dirent.name}`, "utf-8"));
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

  const optOutMessageIds = messages
    .filter((message) => {
      return optoutUsers.has(message.author.id);
    })
    .map((message) => message.id);
  if (optOutMessageIds.length) {
    await index.deleteObjects(optOutMessageIds);
  }
});
