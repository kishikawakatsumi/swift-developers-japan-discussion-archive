"use strict";

const { createWriteStream, readFileSync } = require("fs");
const { SitemapStream } = require("sitemap");

const categories = JSON.parse(
  readFileSync("data/channel_structure.json", "utf-8")
);

const links = [];

Object.keys(categories).forEach((categoryName) => {
  categories[categoryName].forEach((channel) => {
    links.push({
      url: `/channels/${channel.channelId}?category=${channel.categoryName}&channel=${channel.channelName}`,
      changefreq: "weekly",
      priority: 0.5,
    });
    if (channel.threads) {
      channel.threads.forEach((thread) => {
        links.push({
          url: `/channels/${thread.channelId}/${thread.id}?category=${thread.categoryName}&channel=${thread.channelName}`,
          changefreq: "weekly",
          priority: 0.5,
        });
      });
    }
  });
});

readFileSync("data/links.txt", "utf-8")
  .split("\n")
  .forEach((link) => {
    if (link) {
      links.push({
        url: link,
        changefreq: "weekly",
        priority: 0.5,
      });
    }
  });

const sitemap = new SitemapStream({
  hostname: "https://archive.swiftdevelopers.jp",
});

const writeStream = createWriteStream("views/sitemap.xml");
sitemap.pipe(writeStream);
links.forEach((link) => {
  sitemap.write(link);
});

sitemap.end();
