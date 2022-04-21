"use strict";

const fs = require("fs");
const { JSDOM } = require("jsdom");
const beautify = require("js-beautify").html;

const categories = JSON.parse(fs.readFileSync(`data/channel_structure.json`));
const channels = Object.values(categories).flat();
const threads = channels
  .filter((x) => x.threads)
  .map((x) => x.threads)
  .flat();

const links = [];

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
          const messageId = (() => {
            let id = "";
            messageGroup
              .querySelectorAll(".chatlog__message-container")
              .forEach((message) => {
                if (message.dataset.messageId) {
                  id = message.dataset.messageId;
                  return;
                }
              });
            return id;
          })();

          if (messageId) {
            messageGroup
              .querySelectorAll(".chatlog__timestamp")
              .forEach((timestamp) => {
                const a = dom.window.document.createElement("a");
                const threadId = dirent.name.replaceAll(".html", "");
                const thread = threads.find((x) => x.id === threadId);
                const link = `/channels/${thread.channelId}/${threadId}?category=${thread.categoryName}&channel=${thread.channelName}&message_id=${messageId}`;
                a.href = link;
                links.push(link);
                timestamp.parentNode.insertBefore(a, timestamp);
                a.appendChild(timestamp);
              });
          }
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
    const messageId = (() => {
      let id = "";
      messageGroup
        .querySelectorAll(".chatlog__message-container")
        .forEach((message) => {
          if (message.dataset.messageId) {
            id = message.dataset.messageId;
            return;
          }
        });
      return id;
    })();

    if (messageId) {
      messageGroup
        .querySelectorAll(".chatlog__timestamp")
        .forEach((timestamp) => {
          const a = dom.window.document.createElement("a");
          const channelId = dirent.name.replaceAll(".html", "");
          const channel = channels.find(
            (channel) => channel.channelId === channelId
          );
          const link = `/channels/${channelId}?category=${channel.categoryName}&channel=${channel.channelName}&message_id=${messageId}`;
          a.href = link;
          links.push(link);
          timestamp.parentNode.insertBefore(a, timestamp);
          a.appendChild(timestamp);
        });
    }
  }

  const html = beautify(dom.window.document.documentElement.outerHTML, {
    indent_size: 2,
    preserve_newlines: false,
  });
  fs.writeFileSync(`${root}/${dirent.name}`, html, "utf-8");

  fs.writeFileSync(`data/links.txt`, links.join("\n"), "utf-8");
});
