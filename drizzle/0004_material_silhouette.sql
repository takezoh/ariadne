CREATE TABLE `catalog_identity_ledger` (
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`identity` text NOT NULL,
	`revision` integer NOT NULL,
	PRIMARY KEY(`owner`, `kind`, `identity`)
);
--> statement-breakpoint
INSERT INTO catalog_identity_ledger(owner, kind, identity, revision)
SELECT owner, kind, identity, MAX(revision_after) FROM (
	SELECT o.owner AS owner, 'project' AS kind, COALESCE(json_extract(entry.value, '$.after.id'), json_extract(entry.value, '$.before.id')) AS identity, o.revision_after AS revision_after
	FROM operations AS o, json_each(COALESCE(json_extract(o.delta, '$.projects'), '[]')) AS entry
	UNION ALL
	SELECT o.owner AS owner, 'tag' AS kind, COALESCE(json_extract(entry.value, '$.after.id'), json_extract(entry.value, '$.before.id')) AS identity, o.revision_after AS revision_after
	FROM operations AS o, json_each(COALESCE(json_extract(o.delta, '$.tags'), '[]')) AS entry
	UNION ALL
	SELECT o.owner AS owner, 'task_tag' AS kind, COALESCE(json_extract(entry.value, '$.after.task_id'), json_extract(entry.value, '$.before.task_id')) || ':' || COALESCE(json_extract(entry.value, '$.after.tag_id'), json_extract(entry.value, '$.before.tag_id')) AS identity, o.revision_after AS revision_after
	FROM operations AS o, json_each(COALESCE(json_extract(o.delta, '$.task_tags'), '[]')) AS entry
) AS history
WHERE identity IS NOT NULL
GROUP BY owner, kind, identity
ON CONFLICT(owner, kind, identity) DO UPDATE SET revision = MAX(revision, excluded.revision);
--> statement-breakpoint
INSERT OR IGNORE INTO catalog_identity_ledger(owner, kind, identity, revision)
SELECT p.owner, 'project', p.id, COALESCE(s.revision, 0) FROM projects AS p LEFT JOIN owner_state AS s ON s.owner = p.owner;
--> statement-breakpoint
INSERT OR IGNORE INTO catalog_identity_ledger(owner, kind, identity, revision)
SELECT t.owner, 'tag', t.id, COALESCE(s.revision, 0) FROM tags AS t LEFT JOIN owner_state AS s ON s.owner = t.owner;
--> statement-breakpoint
INSERT OR IGNORE INTO catalog_identity_ledger(owner, kind, identity, revision)
SELECT tt.owner, 'task_tag', tt.task_id || ':' || tt.tag_id, COALESCE(s.revision, 0) FROM task_tags AS tt LEFT JOIN owner_state AS s ON s.owner = tt.owner;
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_owner_root_name_uq` ON `projects` (`owner`,`name`) WHERE "projects"."parent_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_owner_parent_name_uq` ON `projects` (`owner`,`parent_id`,`name`) WHERE "projects"."parent_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_owner_root_name_uq` ON `tags` (`owner`,`name`) WHERE "tags"."parent_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_owner_parent_name_uq` ON `tags` (`owner`,`parent_id`,`name`) WHERE "tags"."parent_id" is not null;
