"use strict";

const messageManager = { messages: [] };
let virtualScroller;

function loadChannel(channel) {
  document.getElementById("header-channel-name").innerText = channel;

  if (virtualScroller) {
    virtualScroller.stop();
    virtualScroller.virtualScroller.scrollableContainer.scrollToY(0);
    virtualScroller = undefined;
  }

  fetch(`/data/channels/${channel}.html`)
    .then((res) => res.text())
    .then((text) => new DOMParser().parseFromString(text, "text/html"))
    .then((doc) => {
      const messages = items(doc);
      messageManager.messages = messages;

      const searchParams = new URL(document.location).searchParams;
      const messageId = searchParams.get("message_id");

      if (messageId === undefined || messageId === null) {
        virtualScroller = makeVirtualScroller(messages);
      } else {
        fetch(`/data/messages/${messageId}.html`)
          .then((res) => res.text())
          .then((text) => new DOMParser().parseFromString(text, "text/html"))
          .then((doc) => {
            const index = binarySearch(
              messages,
              items(doc)[0],
              (a, b) => getItemId(a) - getItemId(b)
            );

            virtualScroller = makeVirtualScroller(
              messages.slice(index, messages.length)
            );
          });
      }
    });
}

function items(doc) {
  const messages = [];
  for (const element of doc.body.children) {
    if (element.classList.contains("chatlog__message-group")) {
      messages.push(element);
      continue;
    }
    if (!element.classList.contains("chatlog")) {
      continue;
    }
    for (const message of element.children) {
      messages.push(message);
    }
  }
  return messages;
}

function getItemId(item) {
  for (const element of item.children) {
    if (!element.classList.contains("chatlog__messages")) {
      continue;
    }
    for (const message of element.children) {
      if (!message.classList.contains("chatlog__message")) {
        continue;
      }
      return message.dataset.messageId;
    }
  }
  return undefined;
}

function onScrollPositionChange(scrollY) {
  if (scrollY <= 200) {
    setTimeout(() => {
      if (virtualScroller) {
        const items = virtualScroller.virtualScroller.getState().items;
        if (items.length === messageManager.messages.length) {
          return;
        }
        loadPrevious(
          virtualScroller.virtualScroller,
          messageManager.messages,
          messageManager.messages.length - items.length,
          200
        );
      }
    }, 0);
  }
}

function makeVirtualScroller(items) {
  return new VirtualScroller(
    document.getElementById("content-messages"),
    items,
    (message) => {
      return message;
    },
    {
      scrollableContainer: document.getElementById("message-container"),
      getItemId,
      onScrollPositionChange,
    }
  );
}

function loadPrevious(virtualScroller, messages, index, count) {
  const start = Math.max(0, index - count);
  const end = messages.length;
  virtualScroller.setItems(messages.slice(start, end), {
    preserveScrollPositionOnPrependItems: true,
  });
}

function binarySearch(ar, el, compare_fn) {
  let m = 0;
  let n = ar.length - 1;
  while (m <= n) {
    const k = (n + m) >> 1;
    const cmp = compare_fn(el, ar[k]);
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return k;
    }
  }
  return -m - 1;
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

(
  document.querySelectorAll(
    ".modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button"
  ) || []
).forEach(($close) => {
  const $target = $close.closest(".modal");
  $close.addEventListener("click", () => {
    closeModal($target);
  });
});
