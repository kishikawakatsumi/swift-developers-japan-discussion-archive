"use strict";

page("/", () => {
  page.redirect("/channels/swift");
});
page("/channels/:channelName", (ctx) => {
  const channelName = ctx.params.channelName;

  for (const activeMenu of document.querySelectorAll(
    ".menu-list a.is-active"
  )) {
    activeMenu.classList.remove("is-active");
  }
  document.getElementById(`sidebar-${channelName}`).classList.add("is-active");

  document.getElementById("header-channel-name").innerText = channelName;
  loadChannel(channelName);
});
page("/channels/:channelId/:threadId", (ctx) => {
  const channelId = ctx.params.channelId;
  const threadId = ctx.params.threadId;

  const threads = Object.values(window.categories)
    .flat()
    .filter((x) => x.threads)
    .map((x) => x.threads)
    .flat();
  const thread = threads.find((x) => x.id === threadId);

  for (const activeMenu of document.querySelectorAll(
    ".menu-list a.is-active"
  )) {
    activeMenu.classList.remove("is-active");
  }
  document
    .getElementById(`sidebar-${channelId}/${threadId}`)
    .classList.add("is-active");

  document.getElementById(
    "header-channel-name"
  ).innerText = `${thread.categoryName}/${thread.channelName}`;

  loadChannel(`${thread.channelId}/${thread.channelName}`);
});

page();
