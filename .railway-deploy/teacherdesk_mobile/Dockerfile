FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

COPY teacherdesk_mobile/pubspec.yaml ./
COPY teacherdesk_mobile/analysis_options.yaml ./
COPY teacherdesk_mobile/env.json ./
COPY teacherdesk_mobile/lib ./lib
COPY teacherdesk_mobile/assets ./assets

RUN flutter config --enable-web
RUN flutter create . --platforms=web
RUN flutter pub get
RUN flutter build web --release

FROM node:20-alpine AS runtime

WORKDIR /srv

RUN npm install -g serve

COPY --from=build /app/build/web ./build/web

ENV PORT=8080

CMD ["sh", "-c", "serve -s /srv/build/web -l ${PORT}"]

