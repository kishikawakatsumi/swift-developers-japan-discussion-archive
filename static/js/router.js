"use strict";

page("/", () => {
  page.redirect("/channels/291054454793306112?category=main&channel=swift");
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

  const fragment = document.createDocumentFragment();
  let current = "";
  for (const [date, messageId] of Object.entries(
    window.channelDateIndex[channelId]
  )) {
    const year = date.substring(0, 4);
    if (current && current !== year) {
      const hr = document.createElement("hr");
      hr.classList.add("dropdown-divider");
      fragment.appendChild(hr);
    }
    current = year;

    const a = document.createElement("a");
    a.href = `/channels/${channelId}?channel=${channelName}&message_id=${messageId}`;
    a.classList.add("dropdown-item");
    a.textContent = date;
    a.style = "font-family: monospace;";
    fragment.appendChild(a);
  }
  document.getElementById("date-index-menu").innerHTML = "";
  document.getElementById("date-index-menu").appendChild(fragment);

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
// Legacy routes
page("/channels/:channelName", (ctx) => {
  const channelName = ctx.params.channelName;

  for (const activeMenu of document.querySelectorAll(
    ".menu-list a.is-active"
  )) {
    activeMenu.classList.remove("is-active");
  }

  document.getElementById("header-channel-name").innerText = channelName;
  loadChannel(channelName);
});

page();
