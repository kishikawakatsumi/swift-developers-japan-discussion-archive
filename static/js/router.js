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

  loadChannel(channelName);
});

page();
