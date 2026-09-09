FROM postgis/postgis:16-3.4

# Install pgvector extension
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-16-pgvector \
    && rm -rf /var/lib/apt/lists/*

# Enable extensions on database creation
COPY init-extensions.sql /docker-entrypoint-initdb.d/01-extensions.sql
