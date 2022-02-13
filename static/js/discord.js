"use strict";

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".pre--multiline")
    .forEach((block) => hljs.highlightBlock(block));
});

function scrollToMessage(event, id) {
  const element = document.getElementById("message-" + id);

  if (element) {
    event.preventDefault();

    element.classList.add("chatlog__message--highlighted");

    window.scrollTo({
      top:
        element.getBoundingClientRect().top -
        document.body.getBoundingClientRect().top -
        window.innerHeight / 2,
      behavior: "smooth",
    });

    setTimeout(function () {
      element.classList.remove("chatlog__message--highlighted");
    }, 2000);
  }
}

function showSpoiler(event, element) {
  if (element && element.classList.contains("spoiler-text--hidden")) {
    event.preventDefault();
    element.classList.remove("spoiler-text--hidden");
  }
  if (element && element.classList.contains("chatlog__attachment--hidden")) {
    event.preventDefault();
    element.classList.remove("chatlog__attachment--hidden");
  }
}
