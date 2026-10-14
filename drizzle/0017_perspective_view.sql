CREATE TABLE `__new_perspectives` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`filter` text NOT NULL,
	`view` text NOT NULL,
	`definition_version` integer NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`),
	CONSTRAINT "perspectives_definition_version_valid" CHECK("__new_perspectives"."definition_version"=2),
	CONSTRAINT "perspectives_filter_valid" CHECK(json_valid("__new_perspectives"."filter") AND json_type("__new_perspectives"."filter")='object'),
	CONSTRAINT "perspectives_view_valid" CHECK(json_valid("__new_perspectives"."view") AND json_type("__new_perspectives"."view")='object')
);
--> statement-breakpoint
INSERT INTO `__new_perspectives`("owner", "id", "name", "description", "filter", "view", "definition_version", "revision", "created_at", "updated_at") SELECT "owner", "id", "name", "description", "filter", '{"completion_label":"complete","direction":"asc","group":"none","show_notes":false,"sort":"action_order","type":"tasklist"}', CASE WHEN "definition_version"=1 THEN 2 END, "revision", "created_at", "updated_at" FROM `perspectives`;--> statement-breakpoint
DROP TABLE `perspectives`;--> statement-breakpoint
ALTER TABLE `__new_perspectives` RENAME TO `perspectives`;--> statement-breakpoint
