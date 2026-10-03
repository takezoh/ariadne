-- Preserve original input and wait reasons in the ordinary task model.
-- Abort before destructive changes when legacy identities collide or notes overflow.
CREATE TABLE action_inbox_migration_check (valid INTEGER NOT NULL CHECK(valid=1));
--> statement-breakpoint
INSERT INTO action_inbox_migration_check SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM captures c JOIN tasks t ON t.owner=c.owner AND t.id=c.id
 WHERE c.status='pending' OR NOT EXISTS (SELECT 1 FROM tasks r WHERE r.owner=c.owner AND r.source_capture_id=c.id)
) AND NOT EXISTS (SELECT 1 FROM captures WHERE instr(text,char(0))>0) THEN 1 ELSE 0 END;
--> statement-breakpoint
CREATE TABLE action_migrated_notes AS SELECT t.owner,t.id,
 t.notes || CASE WHEN c.text IS NOT NULL AND c.text!=t.notes THEN CASE WHEN t.notes='' THEN '' ELSE char(10)||char(10) END || c.text ELSE '' END
 || CASE WHEN t.manual_wait IS NOT NULL THEN char(10)||char(10)||'他者待ち：'||t.manual_wait ELSE '' END AS notes
 FROM tasks t LEFT JOIN captures c ON c.owner=t.owner AND c.id=t.source_capture_id
 WHERE c.id IS NOT NULL OR t.manual_wait IS NOT NULL;
--> statement-breakpoint
-- Count UTF-16 units, matching JavaScript notes.length. Split into chunks to
-- avoid repeatedly scanning a whole large note for every codepoint.
INSERT INTO action_inbox_migration_check
WITH RECURSIVE chunks(owner,id,rest,part) AS (
 SELECT owner,id,substr(notes,257),substr(notes,1,256) FROM action_migrated_notes
 UNION ALL SELECT owner,id,substr(rest,257),substr(rest,1,256) FROM chunks WHERE rest!=''
), chars(owner,id,part,pos,units) AS (
 SELECT owner,id,part,1,CASE WHEN unicode(substr(part,1,1))>65535 THEN 2 ELSE 1 END FROM chunks WHERE part!=''
 UNION ALL SELECT owner,id,part,pos+1,CASE WHEN unicode(substr(part,pos+1,1))>65535 THEN 2 ELSE 1 END FROM chars WHERE pos<length(part)
)
SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM chars GROUP BY owner,id HAVING sum(units)>65536)
 AND NOT EXISTS (SELECT 1 FROM action_migrated_notes WHERE instr(notes,char(0))>0)
 THEN 1 ELSE 0 END;
--> statement-breakpoint
UPDATE tasks SET notes=(SELECT n.notes FROM action_migrated_notes n WHERE n.owner=tasks.owner AND n.id=tasks.id),revision=revision+1,status=CASE WHEN status='open' AND manual_wait IS NOT NULL THEN 'waiting' ELSE status END
 WHERE EXISTS (SELECT 1 FROM action_migrated_notes n WHERE n.owner=tasks.owner AND n.id=tasks.id);
--> statement-breakpoint
INSERT INTO tasks(owner,id,title,revision,created_at,updated_at,notes)
 SELECT c.owner,c.id,substr(trim(c.text,char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279)),1,100),c.revision,
 COALESCE((SELECT MIN(created_at) FROM operations WHERE owner=c.owner),'1970-01-01T00:00:00.000Z'),
 COALESCE((SELECT MAX(created_at) FROM operations WHERE owner=c.owner),'1970-01-01T00:00:00.000Z'),c.text
 FROM captures c WHERE c.status='pending' OR NOT EXISTS (SELECT 1 FROM tasks t WHERE t.owner=c.owner AND t.source_capture_id=c.id);
--> statement-breakpoint
DROP TABLE action_migrated_notes;
--> statement-breakpoint
DROP TABLE action_inbox_migration_check;
--> statement-breakpoint
DROP TABLE `captures`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `manual_wait`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `source_capture_id`;