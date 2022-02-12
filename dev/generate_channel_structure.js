"use strict";

const fs = require("fs");

const channels = [];

fs.readdirSync("data/json").forEach((file) => {
  if (!file.endsWith(".json")) {
    return;
  }
  const comps = file.split("_");
  channels.push({
    categoryPosition: Number(comps[0]),
    channelPosition: Number(comps[1]),
    categoryName: comps[2],
    channelName: comps[3].replace(".json", ""),
  });
});

channels
  .sort((a, b) => {
    return (
      a.categoryPosition - b.categoryPosition ||
      a.channelPosition - b.channelPosition
    );
  })
  .map((x) => {
    return { categoryName: x.categoryName, channelName: x.channelName };
  });

const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const categories = groupBy(
  channels
    .sort((a, b) => {
      return (
        a.categoryPosition - b.categoryPosition ||
        a.channelPosition - b.channelPosition
      );
    })
    .map((x) => {
      return { categoryName: x.categoryName, channelName: x.channelName };
    }),
  "categoryName"
);

fs.writeFileSync(
  `data/channel_structure.json`,
  JSON.stringify(categories, null, 2),
  "utf-8"
);
