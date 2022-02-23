"use strict";

const fs = require("fs");
const { JSDOM } = require("jsdom");
const beautify = require("js-beautify").html;

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

const root = "data/html";
fs.readdirSync(root, { withFileTypes: true }).forEach((dirent) => {
  if (dirent.isDirectory()) {
    const channelId = dirent.name;
    fs.readdirSync(`${root}/${dirent.name}`, { withFileTypes: true }).forEach(
      (dirent) => {
        if (!dirent.name.endsWith(".html")) {
          return;
        }
        const data = fs.readFileSync(
          `${root}/${channelId}/${dirent.name}`,
          "utf-8"
        );
        const dom = new JSDOM(data);
        const messageGroups = dom.window.document.querySelectorAll(
          ".chatlog__message-group"
        );
        for (const messageGroup of messageGroups) {
          messageGroup
            .querySelectorAll(".chatlog__author-name")
            .forEach((authorData) => {
              const userId = authorData.dataset.userId;
              if (optoutUsers.has(userId)) {
                messageGroup.parentNode.removeChild(messageGroup);
              }
            });
        }

        const html = beautify(dom.window.document.documentElement.outerHTML, {
          indent_size: 2,
          preserve_newlines: false,
        });
        fs.writeFileSync(`${root}/${channelId}/${dirent.name}`, html, "utf-8");
      }
    );
    return;
  }
  if (!dirent.name.endsWith(".html")) {
    return;
  }
  const data = fs.readFileSync(`${root}/${dirent.name}`, "utf-8");
  const dom = new JSDOM(data);
  const messageGroups = dom.window.document.querySelectorAll(
    ".chatlog__message-group"
  );
  for (const messageGroup of messageGroups) {
    messageGroup
      .querySelectorAll(".chatlog__author-name")
      .forEach((authorData) => {
        const userId = authorData.dataset.userId;
        if (optoutUsers.has(userId)) {
          messageGroup.parentNode.removeChild(messageGroup);
        }
      });
  }

  const html = beautify(dom.window.document.documentElement.outerHTML, {
    indent_size: 2,
    preserve_newlines: false,
  });
  fs.writeFileSync(`${root}/${dirent.name}`, html, "utf-8");
});
