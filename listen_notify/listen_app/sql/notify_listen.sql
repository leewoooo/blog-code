CREATE TABLE tmp_notify (
	f_input_date varchar(8) NOT NULL,
	"data" text NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE OR REPLACE FUNCTION fn_notify_trigger() RETURNS trigger AS 
$$
BEGIN
	PERFORM pg_notify('tmp_notify',row_to_json(NEW)::text);
	RETURN null;
END;
$$ 
LANGUAGE plpgsql;

CREATE TRIGGER tmp_notify_trigger AFTER INSERT ON tmp_notify
FOR EACH ROW EXECUTE FUNCTION fn_notify_trigger();

insert into tmp_notify (f_input_date, "data") values ('20230308', 'Notify & Listen Example'::text);