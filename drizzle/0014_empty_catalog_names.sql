DROP INDEX `projects_owner_root_name_uq`;
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_owner_root_name_uq` ON `projects` (owner,name) WHERE parent_id IS NULL AND name <> '';
--> statement-breakpoint
DROP INDEX `projects_owner_parent_name_uq`;
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_owner_parent_name_uq` ON `projects` (owner,parent_id,name) WHERE parent_id IS NOT NULL AND name <> '';
--> statement-breakpoint
DROP INDEX `tags_owner_root_name_uq`;
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_owner_root_name_uq` ON `tags` (owner,name) WHERE parent_id IS NULL AND name <> '';
--> statement-breakpoint
DROP INDEX `tags_owner_parent_name_uq`;
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_owner_parent_name_uq` ON `tags` (owner,parent_id,name) WHERE parent_id IS NOT NULL AND name <> '';
