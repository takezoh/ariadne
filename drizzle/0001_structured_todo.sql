ALTER TABLE tasks ADD COLUMN parent_id TEXT;
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN due_at TEXT;
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN defer_until TEXT;
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN defer_zone TEXT;
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN manual_wait TEXT;
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN notes TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN source_capture_id TEXT;
--> statement-breakpoint
CREATE TABLE owner_state (owner TEXT PRIMARY KEY NOT NULL, schema_version INTEGER NOT NULL DEFAULT 2, revision INTEGER NOT NULL DEFAULT 0, timezone TEXT, timezone_revision INTEGER NOT NULL DEFAULT 0, commit_token TEXT);
--> statement-breakpoint
CREATE TABLE captures (owner TEXT NOT NULL,id TEXT NOT NULL,text TEXT NOT NULL,source TEXT NOT NULL,status TEXT NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(owner,id));
--> statement-breakpoint
CREATE TABLE dependencies (owner TEXT NOT NULL,dependent TEXT NOT NULL,prerequisite TEXT NOT NULL,revision INTEGER NOT NULL,PRIMARY KEY(owner,dependent,prerequisite));
--> statement-breakpoint
CREATE TABLE operations (owner TEXT NOT NULL,operation_id TEXT NOT NULL,canonical_payload TEXT NOT NULL,result TEXT NOT NULL,delta TEXT NOT NULL,revision_before INTEGER NOT NULL,revision_after INTEGER NOT NULL,undo_of TEXT,created_at TEXT NOT NULL,PRIMARY KEY(owner,operation_id));
--> statement-breakpoint
INSERT INTO owner_state(owner) SELECT DISTINCT owner FROM tasks;
