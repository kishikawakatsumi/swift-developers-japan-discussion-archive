"use strict";

const { createWriteStream, readFileSync } = require("fs");
const { resolve } = require("path");
const { SitemapAndIndexStream, SitemapStream } = require("sitemap");

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

const sms = new SitemapAndIndexStream({
  getSitemapStream: (i) => {
    const sitemapStream = new SitemapStream({
      hostname: "https://archive.swiftdevelopers.jp",
    });
    const path = `static/sitemap-${i}.xml`;

    const ws = createWriteStream(resolve(path));
    sitemapStream.pipe(ws);

    return [
      new URL(path, "https://archive.swiftdevelopers.jp").toString(),
      sitemapStream,
      ws,
    ];
  },
});

sms.pipe(createWriteStream(resolve("static/sitemap-index.xml")));
links.forEach((link) => {
  sms.write(link);
});
sms.end();
