PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_perspectives` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`filter` text NOT NULL,
	`definition_version` integer DEFAULT 1 NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`),
	CONSTRAINT "perspectives_definition_version_valid" CHECK("__new_perspectives"."definition_version" IN (1,2)),
	CONSTRAINT "perspectives_filter_valid" CHECK(json_valid("__new_perspectives"."filter") AND json_type("__new_perspectives"."filter")='object')
);
--> statement-breakpoint
INSERT INTO `__new_perspectives`("owner", "id", "name", "description", "filter", "definition_version", "revision", "created_at", "updated_at") SELECT "owner", "id", "name", "description", "filter", "definition_version", "revision", "created_at", "updated_at" FROM `perspectives`;--> statement-breakpoint
DROP TABLE `perspectives`;--> statement-breakpoint
ALTER TABLE `__new_perspectives` RENAME TO `perspectives`;--> statement-breakpoint
PRAGMA foreign_keys=ON;