CREATE TABLE `site_images` (
	`id` text PRIMARY KEY NOT NULL,
	`mime` text NOT NULL,
	`bytes` blob NOT NULL,
	`created_at` integer NOT NULL
);
