"use strict";

const { autocomplete, getAlgoliaResults } = window["@algolia/autocomplete-js"];
const { createQuerySuggestionsPlugin } =
  window["@algolia/autocomplete-plugin-query-suggestions"];

const searchClient = algoliasearch(
  "GP0DLH6H8N",
  "33d2d683d760f0a63181958fabe1665f"
);
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
