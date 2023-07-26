FROM denoland/deno:1.35.3

WORKDIR /app

COPY deps.ts .
RUN deno cache --reload deps.ts

ADD . .
RUN deno cache --reload main.ts

EXPOSE 8080
CMD ["run", "--allow-env", "--allow-net", "--allow-read", "main.ts"]