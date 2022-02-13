"use strict";

(() => {
  const element = document.getElementById("sidebar-apple-dev");
  element.classList.add("disabled");
  element.innerHTML = `<span class="fa-light fa-hashtag"></span>
  <span class="pl-1"><span class="pr-1"><span class="fa-solid fa-lock fa-xs"></span></span>apple-dev</span>`;
})();
