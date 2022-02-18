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
const channels = Object.values(categories)
  .flat();
const threads = channels
  .filter((x) => (x as { threads: unknown }).threads)
  .map((x) => (x as { threads: unknown }).threads)
  .flat();

const channelDateIndex = await (async () => {
  const index: any = {};

  const root = `${Deno.cwd()}/data/json`;
  for await (const file of await Deno.readDir(root)) {
    if (file.isFile && file.name.endsWith(".json")) {
      const channel = JSON.parse(
        await Deno.readTextFile(`${root}/${file.name}`),
      );

      const dateIndex: any = {};
      index[channel.channel.id] = dateIndex;

      for (const message of channel.messages) {
        const date = message.timestamp.substring(0, 7);
        if (!dateIndex[date]) {
          dateIndex[date] = message.id;
        }
      }
    }
  }
  return index;
})();

const isBot = await (async (): Promise<RegExp> => {
  const response = await fetch(
    "https://raw.githubusercontent.com/monperrus/crawler-user-agents/master/crawler-user-agents.json",
  );
  const items = await response.json();
  const patterns = items.map((item: { pattern: string }) => item.pattern);
  return new RegExp(patterns.join("|"));
})();

const router = new Router();
router
  .get("/healthz", (context) => {
    context.response.body = { status: "pass" };
  })
  .get("/", async (context) => {
    context.response.body = await renderBody();
  })
  .get("/channels/:id(\\d+)", async (context) => {
    const userAgent = context.request.headers.get("user-agent");
    if (userAgent && isBot.test(userAgent)) {
      context.response.body = await Deno.readTextFile(
        `${Deno.cwd()}/data/html/${context.params.id}.html`,
      );
    } else {
      context.response.body = await renderBody();
    }
  })
  .get("/channels/:thread/:id(\\d+)", async (context) => {
    const userAgent = context.request.headers.get("user-agent");
    if (userAgent && isBot.test(userAgent)) {
      const threadId = context.params.id;
      const thread = threads.find((x) => (x as { id: string }).id === threadId);

      const channelId = (thread as { channelId: string }).channelId;
      const channelName = (thread as { channelName: string }).channelName;
      context.response.body = await Deno.readTextFile(
        `${Deno.cwd()}/data/html/${channelId}/${channelName}.html`,
      );
    } else {
      context.response.body = await renderBody();
    }
  })
  .get("/data/channels/:id(\\d+).html", async (context) => {
    context.response.body = await Deno.readTextFile(
      `${Deno.cwd()}/data/html/${context.params.id}.html`,
    );
  })
  .get("/data/channels/:thread/:id(\\d+).html", async (context) => {
    context.response.body = await Deno.readTextFile(
      `${Deno.cwd()}/data/html/${context.params.thread}/${context.params.id}.html`,
    );
  })
  .get("/data/messages/:id(\\d+).html", async (context) => {
    context.response.body = await Deno.readTextFile(
      `${Deno.cwd()}/data/message_html_fragments/${context.params.id}.html`,
    );
  })
  // Legacy routes
  .get("/channels/:channelName", async (context) => {
    const channelName = context.params.channelName;

    const channel = channels.find((channel) =>
      (channel as { channelName: string }).channelName === channelName
    );
    const channelId = (channel as { channelId: string }).channelId;

    const userAgent = context.request.headers.get("user-agent");
    if (userAgent && isBot.test(userAgent)) {
      context.response.body = await Deno.readTextFile(
        `${Deno.cwd()}/data/html/${channelId}.html`,
      );
    } else {
      context.response.body = await renderBody();
    }
  })
  .get("/data/channels/:channelName.html", async (context) => {
    const channelName = context.params.channelName;

    const channel = channels.find((channel) =>
      (channel as { channelName: string }).channelName === channelName
    );
    const channelId = (channel as { channelId: string }).channelId;

    context.response.body = await Deno.readTextFile(
      `${Deno.cwd()}/data/html/${channelId}.html`,
    );
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
    dateIndex: JSON.stringify(channelDateIndex),
    cb: cacheBuster,
  })}`;
}
