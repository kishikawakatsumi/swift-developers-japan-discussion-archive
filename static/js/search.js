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
      .map(
        (hit) =>
          `<div onclick="location.href='/channels/${hit.channel.name}?message_id=${hit.id}';">${hit.html}</div>`
      )
      .join("");
  }
);

search.addWidgets([
  widgets.configure({
    hitsPerPage: 200,
  }),
  virtualSearchBox({}),
  infiniteHits({
    container: document.querySelector("#hits"),
  }),
]);
search.start();

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

autocomplete({
  container: "#autocomplete",
  placeholder: "Search",
  openOnFocus: false,
  plugins: [querySuggestionsPlugin],
  detachedMediaQuery: "none",
  initialState: {
    query: searchPageState.query || "",
  },
  onSubmit({ state }) {
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
    if (!query) {
      return [];
    }

    return [
      {
        sourceId: "messages",
        getItems() {
          return getAlgoliaResults({
            searchClient,
            queries: [
              {
                indexName: "messages",
                query,
                params: {
                  hitsPerPage: 200,
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
            return createElement("div", {
              dangerouslySetInnerHTML: {
                __html: `<div onclick="location.href='/channels/${item.channel.name}?message_id=${item.id}';">${item.html}</div>`,
              },
            });
          },
          noResults() {
            return "No messages for this query.";
          },
        },
      },
    ];
  },
});
