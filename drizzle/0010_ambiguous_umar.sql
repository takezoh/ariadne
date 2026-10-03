CREATE TABLE `perspectives` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`filter` text NOT NULL,
	`definition_version` integer DEFAULT 1 NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `id`),
	CONSTRAINT "perspectives_definition_version_valid" CHECK("perspectives"."definition_version"=1),
	CONSTRAINT "perspectives_filter_valid" CHECK(json_valid("perspectives"."filter") AND json_type("perspectives"."filter")='object')
);
