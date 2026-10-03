DROP TRIGGER IF EXISTS operations_revision_guard;
--> statement-breakpoint
CREATE TRIGGER operations_revision_guard BEFORE INSERT ON operations
BEGIN
 SELECT (CASE WHEN NEW.revision_before != COALESCE((SELECT MAX(revision_after) FROM operations WHERE owner = NEW.owner), 0)
  OR NEW.revision_after != NEW.revision_before + 1
 THEN RAISE(ABORT, 'revision_conflict') END);
END;
