"use strict";

let virtualScroller;

function loadChannel(channel) {
  document.getElementById("header-channel-name").innerText = channel;

  if (virtualScroller) {
    virtualScroller.virtualScroller.scrollableContainer.scrollToY(0);
    virtualScroller.stop();
    virtualScroller = undefined;
  }

  fetch(`/data/${channel}.html`)
    .then((res) => res.text())
    .then((text) => new DOMParser().parseFromString(text, "text/html"))
    .then((doc) => {
      const messages = [];
      for (const element of doc.body.children) {
        if (!element.classList.contains("chatlog")) {
          continue;
        }
        for (const message of element.children) {
          messages.push(message);
        }
      }
      virtualScroller = new VirtualScroller(
        document.getElementById("content-messages"),
        messages,
        (message) => {
          return message;
        }
      );

      const searchParams = new URL(document.location).searchParams;
      const messageId = searchParams.get("message_id");
      if (messageId !== null) {
        document
          .getElementById("content-messages")
          .classList.add("is-invisible");
        openModal(document.getElementById("modal-loading"));
        scrollToItem(messageId);
      }
    });
}

function scrollToItem(id) {
  const state = virtualScroller.virtualScroller.getState();
  const lastItem = state.items[state.lastShownItemIndex];
  if (findItem(id, lastItem)) {
    closeAllModals();

    const index = getItemIndex(id);
    const position =
      virtualScroller.virtualScroller.getItemScrollPosition(index);
    virtualScroller.virtualScroller.scrollableContainer.scrollToY(position);

    document
      .getElementById("content-messages")
      .classList.remove("is-invisible");
    scrollToMessage(null, id);
  } else {
    const itemHeights = state.itemHeights.reduce((a, b) => a + b, 0);
    virtualScroller.virtualScroller.scrollableContainer.scrollToY(itemHeights);
    setTimeout(() => {
      scrollToItem(id);
    }, 0);
  }
}

function findItem(id, lastItem) {
  for (const element of lastItem.children) {
    if (element.classList.contains("chatlog__messages")) {
      for (const el of element.children) {
        if (el.classList.contains("chatlog__message")) {
          if (el.dataset.messageId >= id) {
            return true;
          }
        }
      }
    }
  }
}

function getItemIndex(id) {
  const state = virtualScroller.virtualScroller.getState();
  const items = state.items;
  for (const [index, item] of items.entries()) {
    for (const element of item.children) {
      if (element.classList.contains("chatlog__messages")) {
        for (const el of element.children) {
          if (el.classList.contains("chatlog__message")) {
            if (el.dataset.messageId == id) {
              return index;
            }
          }
        }
      }
    }
  }
}

function openModal($el) {
  $el.classList.add("is-active");
}

function closeModal($el) {
  $el.classList.remove("is-active");
}

function closeAllModals() {
  (document.querySelectorAll(".modal") || []).forEach(($modal) => {
    closeModal($modal);
  });
}
