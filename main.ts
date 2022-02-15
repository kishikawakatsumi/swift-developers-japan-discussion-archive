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

const response = await fetch(
  "https://raw.githubusercontent.com/monperrus/crawler-user-agents/master/crawler-user-agents.json",
);
const items = await response.json();
const patterns = items.map((item: { pattern: string }) => item.pattern);
const isBot = new RegExp(patterns.join("|"));

const router = new Router();
router
  .get("/healthz", (context) => {
    context.response.body = { status: "pass" };
  })
  .get("/", async (context) => {
    context.response.body = await renderBody();
  })
  .get("/channels/:id", async (context) => {
    const userAgent = context.request.headers.get("user-agent");
    if (userAgent && isBot.test(userAgent)) {
      context.response.body = await Deno.readTextFile(
        `${Deno.cwd()}/data/html/${context.params.id}.html`,
      );
    } else {
      context.response.body = await renderBody();
    }
  })
  .get("/channels/:thread/:id", async (context) => {
    const userAgent = context.request.headers.get("user-agent");
    if (userAgent && isBot.test(userAgent)) {
      const channelId = context.params.thread;
      const threadId = context.params.id;

      const threads = Object.values(categories)
        .flat()
        .filter((x) => (x as { threads: unknown }).threads)
        .map((x) => (x as { threads: unknown }).threads)
        .flat();
      const thread = threads.find((x) => (x as { id: string }).id === threadId);

      context.response.body = await Deno.readTextFile(
        `${Deno.cwd()}/data/html/${
          (thread as { channelId: string }).channelId
        }/${(thread as { channelName: string }).channelName}.html`,
      );
    } else {
      context.response.body = await renderBody();
    }
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
  const version = Deno.env.get("RENDER_GIT_COMMIT");
  console.log(`Listening on: ${scheme}://${host}:${port} (${version})`);
});

await app.listen({ port: 8080 });

async function renderBody(): Promise<string> {
  const cacheBuster = `?v=${Deno.env.get("RENDER_GIT_COMMIT")}`;
  return `${await renderFile("index.html", {
    categories: categories,
    cb: cacheBuster,
  })}`;
}
