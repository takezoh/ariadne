-- Fail before dropping state if operation history cannot reproduce its revision.
CREATE TABLE action_migration_revision_check (valid INTEGER NOT NULL CHECK (valid = 1));
--> statement-breakpoint
INSERT INTO action_migration_revision_check(valid)
SELECT CASE WHEN s.revision = COALESCE((SELECT MAX(o.revision_after) FROM operations AS o WHERE o.owner = s.owner), 0) THEN 1 ELSE 0 END FROM owner_state AS s;
--> statement-breakpoint
DROP TABLE action_migration_revision_check;
--> statement-breakpoint
DROP TABLE `owner_state`;--> statement-breakpoint
CREATE UNIQUE INDEX `operations_owner_revision_uq` ON `operations` (`owner`,`revision_after`);--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `initial_title`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `last_request`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `defer_zone`;
--> statement-breakpoint
CREATE TRIGGER operations_revision_guard BEFORE INSERT ON operations
BEGIN
 SELECT (CASE WHEN NEW.revision_before != COALESCE((SELECT MAX(revision_after) FROM operations WHERE owner = NEW.owner), 0)
  OR NEW.revision_after != NEW.revision_before + 1
 THEN RAISE(ABORT, 'action_revision_conflict') END);
END;
