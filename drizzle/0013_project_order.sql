ALTER TABLE `projects` ADD `order` integer DEFAULT 0 NOT NULL CONSTRAINT `projects_order_valid` CHECK(typeof(`order`)='integer' AND `order` BETWEEN 0 AND 9007199254740991);
