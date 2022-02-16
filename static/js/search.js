"use strict";

const { autocomplete, getAlgoliaResults } = window["@algolia/autocomplete-js"];
const { createQuerySuggestionsPlugin } =
  window["@algolia/autocomplete-plugin-query-suggestions"];

const searchClient = algoliasearch(
  "GP0DLH6H8N",
  "33d2d683d760f0a63181958fabe1665f"
);

const INSTANT_SEARCH_INDEX_NAME = "messages";
const widgets = instantsearch.widgets;
const connectors = instantsearch.connectors;
const historyRouter = instantsearch.routers.history;
const instantSearchRouter = historyRouter();
const search = instantsearch({
  searchClient,
  indexName: INSTANT_SEARCH_INDEX_NAME,
  routing: instantSearchRouter,
});

const virtualSearchBox = connectors.connectSearchBox(() => {});
let lastRenderArgs;
const infiniteHits = connectors.connectInfiniteHits(
  (renderArgs, isFirstRender) => {
    const { hits, showMore, widgetParams } = renderArgs;
    const { container } = widgetParams;

    lastRenderArgs = renderArgs;

    if (isFirstRender) {
      const sentinel = document.createElement("div");
      sentinel.textContent = "\u00A0";
      container.appendChild(document.createElement("ul"));
      container.appendChild(sentinel);

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !lastRenderArgs.isLastPage) {
            showMore();
          }
        });
      });

      observer.observe(sentinel);
      return;
    }

    container.querySelector("ul").innerHTML = hits
      .map((hit) => {
        const channel = hit.channel;
        const isThread = channel.type === "11";
        const headerText = isThread
          ? `${channel.category}/${channel.name}`
          : channel.name;
        const link = isThread
          ? `${channel.categoryId}/${channel.id}`
          : `${channel.id}`;
        return `<li class="search-results-item" onclick="location.href='/channels/${link}?category=${channel.category}&channel=${channel.name}&message_id=${hit.id}';">
    <div class="has-text-grey has-text-weight-medium is-size-6 px-1"><span class="fa-light fa-hashtag fa-sm is-size-7 pl-2 pr-1"></span>${headerText}</div>
    ${hit.html}
  </li>`;
      })
      .join("");
  }
);

search.addWidgets([
  widgets.configure({
    hitsPerPage: 40,
  }),
  virtualSearchBox({}),
  infiniteHits({
    container: document.querySelector("#hits"),
  }),
]);
search.start();

const searchPageState = getInstantSearchUiState();

const querySuggestionsPlugin = createQuerySuggestionsPlugin({
  searchClient,
  indexName: "messages_query_suggestions",
  getSearchParams() {
    return {
      hitsPerPage: 5,
    };
  },
});

const debounced = debouncePromise((items) => Promise.resolve(items), 400);

autocomplete({
  container: "#autocomplete",
  placeholder: "Search",
  openOnFocus: false,
  plugins: [querySuggestionsPlugin],
  detachedMediaQuery: "",
  initialState: {
    query: searchPageState.query || "",
  },
  onSubmit({ state }) {
    if (!state.query) {
      return;
    }

    document.getElementById("modal-search-results-title").textContent =
      state.query;
    openModal(document.getElementById("modal-search-results"));

    setInstantSearchUiState({ query: state.query });
  },
  onReset() {
    setInstantSearchUiState({ query: "" });
  },
  onStateChange({ prevState, state }) {
    if (prevState.query !== state.query) {
      setInstantSearchUiState({ query: state.query });
    }
  },
  getSources({ query }) {
    return debounced([
      {
        sourceId: "messages",
        getItems() {
          return getAlgoliaResults({
            searchClient,
            queries: [
              {
                indexName: "messages",
                query,
                attributesToRetrieve: ["id", "channel", "html"],
                params: {
                  hitsPerPage: 50,
                  snippetEllipsisText: "…",
                },
              },
            ],
          });
        },
        templates: {
          header({ createElement, Fragment }) {
            return createElement(
              Fragment,
              null,
              createElement(
                "span",
                {
                  className: "aa-SourceHeaderTitle",
                },
                "Messages"
              ),
              createElement("div", {
                className: "aa-SourceHeaderLine",
              })
            );
          },
          item({ item, createElement }) {
            const channel = item.channel;
            const isThread = channel.type === "11";
            const headerText = isThread
              ? `${channel.category}/${channel.name}`
              : channel.name;
            const link = isThread
              ? `${channel.categoryId}/${channel.id}`
              : `${channel.id}`;

            return createElement("div", {
              dangerouslySetInnerHTML: {
                __html: `<div onclick="location.href='/channels/${link}?category=${channel.category}&channel=${channel.name}&message_id=${item.id}';">
  <div class="has-text-grey has-text-weight-medium is-size-6 p-1"><span class="fa-light fa-hashtag fa-sm is-size-7 pl-2 pr-1"></span>${headerText}</div>
  ${item.html}
</div>`,
              },
            });
          },
          noResults() {
            return "No messages for this query.";
          },
        },
      },
    ]);
  },
});

function setInstantSearchUiState(indexUiState) {
  search.setUiState((uiState) => ({
    ...uiState,
    [INSTANT_SEARCH_INDEX_NAME]: {
      ...uiState[INSTANT_SEARCH_INDEX_NAME],
      page: 1,
      ...indexUiState,
    },
  }));
}

function getInstantSearchUiState() {
  const uiState = instantSearchRouter.read();

  return (uiState && uiState[INSTANT_SEARCH_INDEX_NAME]) || {};
}

function debouncePromise(fn, time) {
  let timerId = undefined;

  return function debounced(...args) {
    if (timerId) {
      clearTimeout(timerId);
    }

    return new Promise((resolve) => {
      timerId = setTimeout(() => resolve(fn(...args)), time);
    });
  };
}
