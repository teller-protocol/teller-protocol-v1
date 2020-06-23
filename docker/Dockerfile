FROM node:10.21.0-alpine3.11 as build

RUN sed -i 's/http\:\/\/dl-cdn.alpinelinux.org/https\:\/\/alpine.global.ssl.fastly.net/g' /etc/apk/repositories

WORKDIR /app
# Switch to the app folder to make installation
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
# Install dependencies and then install node deps
RUN apk add --no-cache --virtual .build-deps git \
    && yarn install \
    && apk del .build-deps

FROM node:10.21.0-alpine3.11

WORKDIR /app
# Create a non root user for the app & give permissions to app folder
RUN addgroup -S app && adduser -S -G app app && chown app:app /app

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod a+x /wait

COPY --chown=app:app --from=build /app /app
COPY --chown=app:app . /app

USER app
