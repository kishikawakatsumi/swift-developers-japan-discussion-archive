"use strict";

const fs = require("fs");
const { JSDOM } = require("jsdom");
const beautify = require("js-beautify").html;

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
            .querySelectorAll(".chatlog__message")
            .forEach((message) => {
              const html = beautify(messageGroup.outerHTML, {
                indent_size: 2,
                preserve_newlines: false,
              });
              fs.writeFileSync(
                `data/message_html_fragments/${message.dataset.messageId}.html`,
                html,
                "utf-8"
              );
            });
        }
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
    messageGroup.querySelectorAll(".chatlog__message").forEach((message) => {
      const html = beautify(messageGroup.outerHTML, {
        indent_size: 2,
        preserve_newlines: false,
      });
      fs.writeFileSync(
        `data/message_html_fragments/${message.dataset.messageId}.html`,
        html,
        "utf-8"
      );
    });
  }
});
