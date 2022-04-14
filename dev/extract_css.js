"use strict";

const fs = require("fs");
const { JSDOM } = require("jsdom");
const beautify = require("js-beautify").css;

const root = "data/html";
fs.readdirSync(root, { withFileTypes: true }).some((dirent) => {
  if (dirent.isDirectory()) {
    return false;
  }
  if (!dirent.name.endsWith(".html")) {
    return false;
  }
  const data = fs.readFileSync(`${root}/${dirent.name}`, "utf-8");
  const dom = new JSDOM(data);
  const style = dom.window.document.querySelector("style");
  const css = beautify(style.textContent, {
    indent_size: 2,
    preserve_newlines: false,
  });
  fs.writeFileSync("static/css/discord.css", css, "utf-8");

  return true;
});
