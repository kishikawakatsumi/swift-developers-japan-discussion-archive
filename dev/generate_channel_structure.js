"use strict";

const fs = require("fs");

const channels = [];
const threads = [];

const root = "data/json";
fs.readdirSync(root, { withFileTypes: true }).forEach((dirent) => {
  if (dirent.isDirectory()) {
    const channelId = dirent.name;
    fs.readdirSync(`${root}/${dirent.name}`, { withFileTypes: true }).forEach(
      (dirent) => {
        if (dirent.name === "metadata.json" || !dirent.name.endsWith(".json")) {
          return;
        }
        const comps = dirent.name.split("|");
        const data = JSON.parse(
          fs.readFileSync(`${root}/${channelId}/${dirent.name}`, "utf-8")
        );
        threads.push({
          categoryPosition: Number(comps[0]),
          channelPosition: Number(comps[1]),
          categoryName: data.channel.category,
          categoryId: data.channel.categoryId,
          channelName: data.channel.name,
          id: data.channel.id,
          channelId,
        });
      }
    );
    return;
  }
  if (!dirent.name.endsWith(".json")) {
    return;
  }
  const comps = dirent.name.split("|");
  const data = JSON.parse(fs.readFileSync(`${root}/${dirent.name}`, "utf-8"));
  channels.push({
    categoryPosition: Number(comps[0]),
    channelPosition: Number(comps[1]),
    categoryName: data.channel.category,
    categoryId: data.channel.categoryId,
    channelName: data.channel.name,
    channelId: data.channel.id,
  });
});

channels.sort((a, b) => {
  return (
    a.categoryPosition - b.categoryPosition ||
    a.channelPosition - b.channelPosition
  );
});

threads.sort((a, b) => {
  return a.channelId - b.channelId || a.id - b.id;
});

for (const [k, v] of Object.entries(groupBy(threads, "channelId"))) {
  for (const channel of channels) {
    if (channel.channelId === k) {
      channel.threads = v.map((x) => {
        return {
          categoryName: x.categoryName,
          channelName: x.channelName,
          id: x.id,
          channelId: x.channelId,
        };
      });
    }
  }
}

const categories = groupBy(
  channels
    .sort((a, b) => {
      return (
        a.categoryPosition - b.categoryPosition ||
        a.channelPosition - b.channelPosition
      );
    })
    .map((x) => {
      return {
        categoryName: x.categoryName,
        categoryId: x.categoryId,
        channelName: x.channelName,
        channelId: x.channelId,
        threads: x.threads,
      };
    }),
  "categoryName"
);

fs.writeFileSync(
  `data/channel_structure.json`,
  JSON.stringify(categories, null, 2),
  "utf-8"
);

function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}
