"use strict";

require("dotenv").config();

const fs = require("fs");
const { execSync } = require("child_process");

const root = "data/json";
fs.readdirSync(root, { withFileTypes: true }).forEach((dirent) => {
  if (dirent.isDirectory()) {
    const data = JSON.parse(
      fs.readFileSync(`${root}/${dirent.name}/metadata.json`, "utf-8")
    );
    for (const [index, thread] of data.entries()) {
      const parentId = thread.parentId;
      const threadId = thread.threadId;

      try {
        execSync(`docker run --rm -v $PWD/data/json/${parentId}:/output tyrrrz/discordchatexporter:stable export \
  -t ${process.env.DISCORD_TOKEN} \
  -c ${threadId} \
  -o "/output/%P|${index}|%T|%C|%t|%c.json" \
  -f Json`);
      } catch (error) {
        if (error.stdout) {
          console.error(error.stdout.toString());
        }
        if (error.stderr) {
          console.error(error.stderr.toString());
        }
      }

      try {
        execSync(`docker run --rm -v $PWD/data/html/${parentId}:/output tyrrrz/discordchatexporter:stable export \
  -t ${process.env.DISCORD_TOKEN} \
  -c ${threadId} \
  -o "/output/%c.html" \
  -f HtmlLight`);
      } catch (error) {
        if (error.stdout) {
          console.error(error.stdout.toString());
        }
        if (error.stderr) {
          console.error(error.stderr.toString());
        }
      }
    }
  }
});
