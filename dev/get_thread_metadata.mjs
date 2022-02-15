"use strict";

import fetch from "node-fetch";
import * as fs from "fs";

const channels = await getChannels();
const channelIds = channels
  .filter((channel) => channel.type === 0)
  .sort((a, b) => a.position - b.position)
  .map((channel) => channel.id);

const threads = [];
for (const channelId of channelIds) {
  for (const thread of await getAllThreads(channelId)) {
    threads.push(thread);
  }
}

for (const [k, v] of Object.entries(groupBy(threads, "parent_id"))) {
  const parentDir = `data/json/${k}`;
  fs.mkdirSync(parentDir, { recursive: true });

  v.sort((a, b) => a.id - b.id);
  fs.writeFileSync(
    `${parentDir}/metadata.json`,
    JSON.stringify(
      v.map((x) => ({
        threadId: x.id,
        parentId: x.parent_id,
        name: x.name,
      })),
      null,
      2
    ),
    "utf-8"
  );
}

async function getChannels() {
  const response = await fetch(
    `https://discord.com/api/v9/guilds/${process.env.DISCORD_SERVER_ID}/channels`,
    {
      headers: {
        Authorization: process.env.DISCORD_TOKEN,
      },
    }
  );
  return await response.json();
}

async function getAllThreads(channelId) {
  const threads = [];
  let response = await getThreads(channelId);
  while (response.has_more) {
    for (const thread of response.threads) {
      threads.push(thread);
    }

    const lastThread = response.threads[response.threads.length - 1];
    const timestamp = lastThread.thread_metadata.archive_timestamp;
    const isoDate = new Date(timestamp).toISOString();
    if (isoDate) {
      response = await getThreads(channelId, isoDate);
    }
  }
  if (response.threads) {
    for (const thread of response.threads) {
      threads.push(thread);
    }
  }
  return threads;
}

async function getThreads(channelId, before) {
  const response = await fetch(
    `https://discord.com/api/v9/channels/${channelId}/threads/archived/public?limit=100${
      before ? `&before=${before}` : ""
    }`,
    {
      headers: {
        Authorization: process.env.DISCORD_TOKEN,
      },
    }
  );
  return await response.json();
}

function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}
