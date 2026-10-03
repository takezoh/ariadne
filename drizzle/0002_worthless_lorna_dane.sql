CREATE TABLE `projects` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `task_tags` (
	`owner` text NOT NULL,
	`task_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`revision` integer NOT NULL,
	PRIMARY KEY(`owner`, `task_id`, `tag_id`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `project_id` text;