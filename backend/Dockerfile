FROM alpine:3.19

ARG PB_VERSION=0.36.8

RUN apk add --no-cache unzip ca-certificates curl && \
    curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -o /tmp/pb.zip && \
    unzip -q /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

WORKDIR /pb

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
RUN mkdir -p /pb/pb_public /pb/pb_data

EXPOSE 8090

CMD ["./pocketbase", "serve", \
     "--http=0.0.0.0:8090", \
     "--dir=/pb/pb_data", \
     "--migrationsDir=/pb/pb_migrations", \
     "--hooksDir=/pb/pb_hooks", \
     "--publicDir=/pb/pb_public"]
