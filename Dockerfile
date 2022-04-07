FROM denoland/deno:1.20.5

WORKDIR /app

COPY deps.ts .
RUN deno cache deps.ts

ADD . .
RUN deno cache main.ts

EXPOSE 8080
CMD ["run", "--allow-env", "--allow-net", "--allow-read", "main.ts"]