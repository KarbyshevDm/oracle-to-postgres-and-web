
-- We put things inside the basic_auth schema to hide
-- them from public view. Certain public procs/views will
-- refer to helpers and tables inside.
CREATE EXTENSION pgcrypto;
CREATE EXTENSION pgjwt;
CREATE SCHEMA IF NOT EXISTS basic_auth;

CREATE FUNCTION basic_auth.pbkdf2(salt bytea, pw text, count integer, desired_length integer, algorithm text) RETURNS bytea
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  hash_length integer;
  block_count integer;
  output bytea;
  the_last bytea;
  xorsum bytea;
  i_as_int32 bytea;
  i integer;
  j integer;
  k integer;
BEGIN
  algorithm := lower(algorithm);
  CASE algorithm
  WHEN 'md5' then
    hash_length := 16;
  WHEN 'sha1' then
    hash_length = 20;
  WHEN 'sha256' then
    hash_length = 32;
  WHEN 'sha512' then
    hash_length = 64;
  ELSE
    RAISE EXCEPTION 'Unknown algorithm "%"', algorithm;
  END CASE;
  --
  block_count := ceil(desired_length::real / hash_length::real);
  --
  FOR i in 1 .. block_count LOOP
    i_as_int32 := E'\\000\\000\\000'::bytea || chr(i)::bytea;
    i_as_int32 := substring(i_as_int32, length(i_as_int32) - 3);
    --
    the_last := salt::bytea || i_as_int32;
    --
    xorsum := public.HMAC(the_last, pw::bytea, algorithm);
    the_last := xorsum;
    --
    FOR j IN 2 .. count LOOP
      the_last := public.HMAC(the_last, pw::bytea, algorithm);

      -- xor the two
      FOR k IN 1 .. length(xorsum) LOOP
        xorsum := set_byte(xorsum, k - 1, get_byte(xorsum, k - 1) # get_byte(the_last, k - 1));
      END LOOP;
    END LOOP;
    --
    IF output IS NULL THEN
      output := xorsum;
    ELSE
      output := output || xorsum;
    END IF;
  END LOOP;
  --
  RETURN substring(output FROM 1 FOR desired_length);
END $$;

ALTER FUNCTION basic_auth.pbkdf2(salt bytea, pw text, count integer, desired_length integer, algorithm text) OWNER TO postgres;

CREATE FUNCTION basic_auth.check_user_pass(username text, password text) RETURNS name
    LANGUAGE sql
    AS
$$
  SELECT rolname AS username
  FROM pg_authid
  -- regexp-split scram hash:
  CROSS JOIN LATERAL regexp_match(rolpassword, '^SCRAM-SHA-256\$(.*):(.*)\$(.*):(.*)$') AS rm
  -- identify regexp groups with sane names:
  CROSS JOIN LATERAL (SELECT rm[1]::integer AS iteration_count, decode(rm[2], 'base64') as salt, decode(rm[3], 'base64') AS stored_key, decode(rm[4], 'base64') AS server_key, 32 AS digest_length) AS stored_password_part
  -- calculate pbkdf2-digest:
  CROSS JOIN LATERAL (SELECT basic_auth.pbkdf2(salt, check_user_pass.password, iteration_count, digest_length, 'sha256')) AS digest_key(digest_key)
  -- based on that, calculate hashed passwort part:
  CROSS JOIN LATERAL (SELECT public.digest(public.hmac('Client Key', digest_key, 'sha256'), 'sha256') AS stored_key, public.hmac('Server Key', digest_key, 'sha256') AS server_key) AS check_password_part
  WHERE rolpassword IS NOT NULL
    AND pg_authid.rolname = check_user_pass.username
    -- verify password:
    AND check_password_part.stored_key = stored_password_part.stored_key
    AND check_password_part.server_key = stored_password_part.server_key;
$$;

ALTER FUNCTION basic_auth.check_user_pass(username text, password text) OWNER TO postgres;

CREATE TYPE basic_auth.jwt_token AS (
  token text
);

-- if you are not using psql, you need to replace :DBNAME with the current database's name.
ALTER DATABASE postgres SET "app.jwt_secret" to 'reallyreallyreallyreallyverysafe';


CREATE FUNCTION public.login(username text, password text) RETURNS basic_auth.jwt_token
    LANGUAGE plpgsql security definer
    AS $$
DECLARE
  _role name;
  result basic_auth.jwt_token;
BEGIN
  -- check email and password
  SELECT basic_auth.check_user_pass(username, password) INTO _role;
  IF _role IS NULL THEN
    RAISE invalid_password USING message = 'invalid user or password';
  END IF;
  --
  SELECT public.sign(
      row_to_json(r), current_setting('app.jwt_secret')
    ) AS token
    FROM (
      SELECT login.username as role,
        extract(epoch FROM now())::integer + 60*60 AS exp
    ) r
    INTO result;
  RETURN result;
END;
$$;

ALTER FUNCTION public.login(username text, password text) OWNER TO postgres;

CREATE ROLE anon NOINHERIT;
CREATE role authenticator NOINHERIT LOGIN PASSWORD 'secret';
GRANT anon TO authenticator;

CREATE FUNCTION public.signup(username text, password text) RETURNS text
    LANGUAGE plpgsql security definer
    AS $$
DECLARE
  check_user smallint;
  result text;
BEGIN
	
  -- check user
  SELECT 1 FROM pg_roles WHERE rolname=username INTO   check_user;
  IF check_user = 1 THEN
    RAISE NOTICE 'this user already exists';
  END IF;
  --
	EXECUTE FORMAT('CREATE ROLE "%I" LOGIN PASSWORD %L', username, password);
    SELECT 'User '+ username + ' created successfuly'
    INTO result;
  RETURN result;
    -- Simple Exception Catch

     RAISE EXCEPTION 'Error!';
  
END;
$$;

ALTER FUNCTION public.signup(username text, password text) OWNER TO postgres;



GRANT EXECUTE ON FUNCTION public.signup(username text, password text) TO anon;



CREATE ROLE test_user PASSWORD 'password';
SELECT * FROM public.login('test_user', 'password');
NOTIFY pgrst, 'reload schema';


-- watch CREATE and ALTER
CREATE OR REPLACE FUNCTION pgrst_ddl_watch() RETURNS event_trigger AS $$
DECLARE
  cmd record;
	alter_query text;
	table_name_splitted text;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'

    THEN
		table_name_splitted = split_part(cmd.object_identity, '.', 2);
		if cmd.command_tag = 'CREATE TABLE' and EXISTS (SELECT cmd.object_identity::regclass)
		THEN
			IF EXISTS (
							SELECT *
				FROM information_schema.columns 
				WHERE table_name=table_name_splitted and column_name='id'
			)
				THEN
					
					alter_query = format('alter table %1$s	add primary key (id); CREATE SEQUENCE "%1$s_id_seq" OWNED BY %1$s.id; ALTER TABLE %1$s ALTER COLUMN id SET DEFAULT nextval(''"%1$s_id_seq"'');',table_name_splitted );
					EXECUTE alter_query;
					ELSE
						alter_query = format('alter table %1$s	ADD COLUMN id SERIAL PRIMARY KEY;' , table_name_splitted );
						EXECUTE alter_query;
				END IF;

		END IF;
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$ LANGUAGE plpgsql;

-- watch DROP
CREATE OR REPLACE FUNCTION pgrst_drop_watch() RETURNS event_trigger AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER pgrst_ddl_watch
  ON ddl_command_end
  EXECUTE PROCEDURE pgrst_ddl_watch();

CREATE EVENT TRIGGER pgrst_drop_watch
  ON sql_drop
  EXECUTE PROCEDURE pgrst_drop_watch();