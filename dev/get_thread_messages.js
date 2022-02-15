"use strict";

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
      execSync(`docker run --rm -v $PWD/data/json/${parentId}:/output tyrrrz/discordchatexporter:stable export \
  -t ${process.env.DISCORD_TOKEN} \
  -c ${threadId} \
  -o "/output/%P_${index}_%T_%C.json" \
  -f Json`);
      execSync(`docker run --rm -v $PWD/data/html/${parentId}:/output tyrrrz/discordchatexporter:stable export \
  -t ${process.env.DISCORD_TOKEN} \
  -c ${threadId} \
  -o "/output/%C.html" \
  -f HtmlLight`);
    }
  }
});
