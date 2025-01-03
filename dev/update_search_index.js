"use strict";

require("dotenv").config();

const fs = require("fs");
const { algoliasearch } = require("algoliasearch");
const { searchClient } = require("@algolia/client-search");

const client = searchClient(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);

const optoutUsers = new Set();
const optoutChannels = new Set(["453733491067322378"]);

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
        await client.saveObjects({
          indexName: "massages",
          objects: {
            messages,
          },
        });

        const optOutMessageIds = messages
          .filter((message) => {
            return (
              optoutUsers.has(message.author.id) ||
              optoutChannels.has(message.channel.categoryId)
            );
          })
          .map((message) => message.id);
        if (optOutMessageIds.length) {
          await index.deleteObjects({
            indexName: "massages",
            objectIDs: optOutMessageIds,
          });
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
  try {
    await client.saveObjects({
      indexName: "massages",
      objects: {
        messages,
      },
    });
  } catch (error) {
    console.error(error);
  }

  const optOutMessageIds = messages
    .filter((message) => {
      return (
        optoutUsers.has(message.author.id) ||
        optoutChannels.has(message.channel.id)
      );
    })
    .map((message) => message.id);
  if (optOutMessageIds.length) {
    await client.deleteObjects({
      indexName: "massages",
      objectIDs: optOutMessageIds,
    });
  }
});
