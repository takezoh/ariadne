-- Rename only lifecycle status; preserve revisions, dates, relations and receipts.
CREATE TABLE `__new_tasks` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`parent_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`due_at` text,
	`defer_until` text,
	`notes` text DEFAULT '' NOT NULL,
	`project_id` text,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("owner", "id", "title", "revision", "created_at", "updated_at", "parent_id", "status", "due_at", "defer_until", "notes", "project_id") SELECT "owner", "id", "title", "revision", "created_at", "updated_at", "parent_id", CASE WHEN "status"='open' THEN 'active' ELSE "status" END, "due_at", "defer_until", "notes", "project_id" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint