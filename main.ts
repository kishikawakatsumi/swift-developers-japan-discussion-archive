import {
  Application,
  configure,
  isHttpError,
  renderFile,
  Router,
  send,
  Status,
  STATUS_TEXT,
} from "./deps.ts";

const views = `${Deno.cwd()}/views`;
configure({
  views,
});

const categories = JSON.parse(
  await Deno.readTextFile(`${Deno.cwd()}/data/channel_structure.json`),
);

const router = new Router();
router
  .get("/healthz", (context) => {
    context.response.body = { status: "pass" };
  })
  .get("/", async (context) => {
    context.response.body = `${await renderFile("index.html", {
      categories: categories,
    })}`;
  })
  .get("/channels/:id", async (context) => {
    context.response.body = `${await renderFile("index.html", {
      categories: categories,
    })}`;
  });

const app = new Application();

app.use(async (context, next) => {
  await next();
  console.log(
    `${context.request.method} | ${context.response.status} | ${context.request.url}`,
  );
});

app.use(async (context, next) => {
  try {
    await next();
  } catch (error) {
    if (isHttpError(error)) {
      const status = error.status;
      const statusText = STATUS_TEXT.get(status);
      context.response.status = status;
      context.response.body = `${status} | ${statusText}`;

      if (error.status === Status.NotFound) {
        return;
      }
    }
    throw error;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/static`,
  });
});

app.addEventListener("listen", ({ hostname, port, secure }) => {
  const scheme = secure ? "https" : "http";
  const host = hostname ?? "localhost";
  console.log(`Listening on: ${scheme}://${host}:${port}`);
});

await app.listen({ port: 8080 });
