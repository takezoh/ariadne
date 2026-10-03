ALTER TABLE `tags` ADD `order` integer DEFAULT 0 NOT NULL CONSTRAINT `tags_order_valid` CHECK(typeof(`order`)='integer' AND `order` BETWEEN 0 AND 9007199254740991);
