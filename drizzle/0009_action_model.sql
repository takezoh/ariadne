-- Reset disposable test data and retire the task/dependency contract.
DELETE FROM operations;
--> statement-breakpoint
DELETE FROM catalog_identity_ledger;
--> statement-breakpoint
DELETE FROM projects;
--> statement-breakpoint
DELETE FROM tags;
--> statement-breakpoint
DROP TABLE task_tags;
--> statement-breakpoint
DROP TABLE dependencies;
--> statement-breakpoint
DROP TABLE tasks;
--> statement-breakpoint
CREATE TABLE actions (
 owner text NOT NULL,
 id text NOT NULL,
 title text NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 created_at text NOT NULL,
 updated_at text NOT NULL,
 parent_id text,
 status text NOT NULL DEFAULT 'active',
 due_at text,
 defer_until text,
 notes text NOT NULL DEFAULT '',
 project_id text,
 "order" integer NOT NULL DEFAULT 0 CONSTRAINT actions_order_valid CHECK (typeof("order")='integer' AND "order" BETWEEN 0 AND 9007199254740991),
 flagged integer NOT NULL DEFAULT 0 CONSTRAINT actions_flagged_valid CHECK (flagged IN (0,1)),
 PRIMARY KEY (owner,id)
);
--> statement-breakpoint
CREATE TABLE action_tags (
 owner text NOT NULL,
 action_id text NOT NULL,
 tag_id text NOT NULL,
 revision integer NOT NULL,
 PRIMARY KEY (owner,action_id,tag_id)
);
