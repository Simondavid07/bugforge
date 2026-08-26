CREATE TABLE `aiRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`requestedById` int NOT NULL,
	`model` varchar(100) NOT NULL,
	`summary` longtext NOT NULL,
	`suggestedSeverity` varchar(20),
	`suggestedLabels` json NOT NULL,
	`duplicateCandidates` json NOT NULL,
	`reproducibleSteps` longtext NOT NULL,
	`caveats` longtext NOT NULL,
	`confidence` int NOT NULL,
	`state` enum('pending_review','applied','dismissed') NOT NULL DEFAULT 'pending_review',
	`reviewedById` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`uploadedById` int NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(750) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`contentType` varchar(160) NOT NULL,
	`sizeBytes` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`authorId` int NOT NULL,
	`parentId` int,
	`body` longtext NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` longtext,
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `components_id` PRIMARY KEY(`id`),
	CONSTRAINT `component_project_name_unique` UNIQUE(`projectId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `issueActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`actorId` int,
	`type` varchar(80) NOT NULL,
	`message` longtext,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `issueActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issueLabels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`labelId` int NOT NULL,
	CONSTRAINT `issueLabels_id` PRIMARY KEY(`id`),
	CONSTRAINT `issue_label_unique` UNIQUE(`issueId`,`labelId`)
);
--> statement-breakpoint
CREATE TABLE `issueLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`linkedIssueId` int NOT NULL,
	`type` enum('relates_to','duplicates','blocked_by','blocks') NOT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `issueLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `issue_link_unique` UNIQUE(`issueId`,`linkedIssueId`,`type`)
);
--> statement-breakpoint
CREATE TABLE `issueWatchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `issueWatchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `issue_watcher_unique` UNIQUE(`issueId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`number` int NOT NULL,
	`title` varchar(250) NOT NULL,
	`description` longtext,
	`expectedResult` longtext,
	`actualResult` longtext,
	`reproducibleSteps` longtext,
	`environment` longtext,
	`severity` enum('blocker','critical','major','minor','trivial') NOT NULL DEFAULT 'major',
	`priority` enum('urgent','high','medium','low','none') NOT NULL DEFAULT 'medium',
	`status` enum('intake','triage','in_progress','verify','done') NOT NULL DEFAULT 'intake',
	`resolution` enum('fixed','duplicate','wont_fix','invalid','works_as_intended'),
	`reporterId` int NOT NULL,
	`assigneeId` int,
	`componentId` int,
	`milestoneId` int,
	`dueAt` timestamp,
	`isReleaseBlocker` boolean NOT NULL DEFAULT false,
	`triagedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`),
	CONSTRAINT `issue_project_number_unique` UNIQUE(`projectId`,`number`)
);
--> statement-breakpoint
CREATE TABLE `labels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(60) NOT NULL,
	`color` varchar(12) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `labels_id` PRIMARY KEY(`id`),
	CONSTRAINT `label_project_name_unique` UNIQUE(`projectId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`targetDate` timestamp,
	`status` enum('planned','active','released','archived') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`projectId` int,
	`issueId` int,
	`type` enum('mention','assignment','watcher','status_change','system') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` longtext,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('viewer','reporter','member','triage','admin') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_member_unique` UNIQUE(`projectId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`key` varchar(12) NOT NULL,
	`description` longtext,
	`workflow` json NOT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_project_key_unique` UNIQUE(`workspaceId`,`key`)
);
--> statement-breakpoint
CREATE TABLE `savedViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`filters` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedViews_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_view_owner_name_unique` UNIQUE(`projectId`,`ownerId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `workspaceMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','member','viewer') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_member_unique` UNIQUE(`workspaceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` longtext;--> statement-breakpoint
CREATE INDEX `ai_recommendation_issue_idx` ON `aiRecommendations` (`issueId`);--> statement-breakpoint
CREATE INDEX `attachment_issue_idx` ON `attachments` (`issueId`);--> statement-breakpoint
CREATE INDEX `comment_issue_idx` ON `comments` (`issueId`);--> statement-breakpoint
CREATE INDEX `component_project_idx` ON `components` (`projectId`);--> statement-breakpoint
CREATE INDEX `issue_activity_issue_idx` ON `issueActivity` (`issueId`);--> statement-breakpoint
CREATE INDEX `issue_link_issue_idx` ON `issueLinks` (`issueId`);--> statement-breakpoint
CREATE INDEX `issue_watcher_user_idx` ON `issueWatchers` (`userId`);--> statement-breakpoint
CREATE INDEX `issue_project_status_idx` ON `issues` (`projectId`,`status`);--> statement-breakpoint
CREATE INDEX `issue_project_severity_idx` ON `issues` (`projectId`,`severity`);--> statement-breakpoint
CREATE INDEX `issue_assignee_idx` ON `issues` (`assigneeId`);--> statement-breakpoint
CREATE INDEX `label_project_idx` ON `labels` (`projectId`);--> statement-breakpoint
CREATE INDEX `milestone_project_idx` ON `milestones` (`projectId`);--> statement-breakpoint
CREATE INDEX `notification_user_read_idx` ON `notifications` (`userId`,`readAt`);--> statement-breakpoint
CREATE INDEX `notification_issue_idx` ON `notifications` (`issueId`);--> statement-breakpoint
CREATE INDEX `project_member_user_idx` ON `projectMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `project_workspace_idx` ON `projects` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `saved_view_project_idx` ON `savedViews` (`projectId`);--> statement-breakpoint
CREATE INDEX `workspace_member_user_idx` ON `workspaceMembers` (`userId`);