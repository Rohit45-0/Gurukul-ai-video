FROM ghcr.io/cirruslabs/flutter:stable AS web-build

WORKDIR /web

COPY .railway-deploy/teacherdesk_mobile/pubspec.yaml ./pubspec.yaml
COPY .railway-deploy/teacherdesk_mobile/analysis_options.yaml ./analysis_options.yaml
COPY .railway-deploy/teacherdesk_mobile/env.json ./env.json
COPY .railway-deploy/teacherdesk_mobile/lib ./lib
COPY .railway-deploy/teacherdesk_mobile/assets ./assets

RUN flutter config --enable-web
RUN flutter create . --platforms=web
RUN flutter pub get
RUN flutter build web --release

FROM node:22-alpine AS api-deps

WORKDIR /app

RUN apk add --no-cache openssl

COPY .railway-deploy/.temp/gurukul-ai-community/package.json ./package.json
COPY .railway-deploy/.temp/gurukul-ai-community/package-lock.json ./package-lock.json
COPY .railway-deploy/.temp/gurukul-ai-community/apps/api/package.json ./apps/api/package.json
COPY .railway-deploy/.temp/gurukul-ai-community/apps/web/package.json ./apps/web/package.json
COPY .railway-deploy/.temp/gurukul-ai-community/packages/shared/package.json ./packages/shared/package.json

RUN npm ci

FROM node:22-alpine AS api-build

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=api-deps /app/node_modules ./node_modules
COPY .railway-deploy/.temp/gurukul-ai-community/ ./

RUN npm run prisma:generate --workspace @community-ai/api
RUN npm run build --workspace @community-ai/api

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl postgresql16 postgresql16-client
RUN adduser -D postgres || true

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0

COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/package.json ./package.json
COPY --from=api-build /app/package-lock.json ./package-lock.json
COPY --from=api-build /app/apps/api/package.json ./apps/api/package.json
COPY --from=api-build /app/apps/api/dist ./apps/api/dist
COPY --from=api-build /app/apps/api/prisma ./apps/api/prisma
COPY --from=web-build /web/build/web ./public
COPY .railway-deploy/scripts/start-unified.sh ./scripts/start-unified.sh

RUN chmod +x ./scripts/start-unified.sh

EXPOSE 8080

CMD ["sh", "./scripts/start-unified.sh"]
