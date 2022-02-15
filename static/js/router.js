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
page("/channels/:channelId/:threadName", (ctx) => {
  const channelId = ctx.params.channelId;
  const threadName = ctx.params.threadName;
  const channelName = `${channelId}/${threadName}`;

  for (const activeMenu of document.querySelectorAll(
    ".menu-list a.is-active"
  )) {
    activeMenu.classList.remove("is-active");
  }
  document.getElementById(`sidebar-${channelName}`).classList.add("is-active");

  document.getElementById("header-channel-name").innerText = threadName;
  loadChannel(channelName);
});

page();
