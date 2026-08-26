CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sidebarOrder` json NOT NULL,
	`projectOrder` json NOT NULL,
	`savedSearches` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `logoKey` varchar(500);--> statement-breakpoint
ALTER TABLE `projects` ADD `logoUrl` varchar(750);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarKey` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` varchar(750);