"use strict";

page("/", () => {
  page.redirect("/channels/291054454793306112");
});
page("/channels/:id(\\d+)", (ctx) => {
  const channelId = ctx.params.id;
  const searchParams = new URLSearchParams(ctx.querystring);
  const channelName = searchParams.get("channel");

  for (const activeMenu of document.querySelectorAll(
    ".menu-list a.is-active"
  )) {
    activeMenu.classList.remove("is-active");
  }
  document.getElementById(`sidebar-${channelId}`).classList.add("is-active");

  document.getElementById("header-channel-name").innerText = channelName;
  loadChannel(channelId);
});
page("/channels/:channelId/:threadId", (ctx) => {
  const channelId = ctx.params.channelId;
  const threadId = ctx.params.threadId;
  const searchParams = new URLSearchParams(ctx.querystring);
  const categoryName = searchParams.get("category");
  const channelName = searchParams.get("channel");

  for (const activeMenu of document.querySelectorAll(
    ".menu-list a.is-active"
  )) {
    activeMenu.classList.remove("is-active");
  }
  document
    .getElementById(`sidebar-${channelId}/${threadId}`)
    .classList.add("is-active");

  const title = `${categoryName}/${channelName}`;
  document.getElementById("header-channel-name").innerText = title;

  loadChannel(`${channelId}/${threadId}`);
});

page();
