CREATE TABLE `tasks` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`title` text NOT NULL,
	`initial_title` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`last_request` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
