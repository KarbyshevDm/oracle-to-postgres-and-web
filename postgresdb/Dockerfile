FROM chumaky/postgres_oracle_fdw
RUN apt-get update && apt-get install -y make git postgresql-server-dev-16 postgresql-16-pgtap postgresql-contrib
COPY create_auth_context.sql  /docker-entrypoint-initdb.d
RUN mkdir "/pgjwt"
WORKDIR "/pgjwt"
COPY . .
RUN make && make install