ALTER TABLE `services` ADD `has_return` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `return_amount` integer;--> statement-breakpoint
ALTER TABLE `services` ADD `return_unit` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `kind` text DEFAULT 'procedure' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `parent_appointment_id` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `return_adjusted` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `return_planned_at` integer;--> statement-breakpoint
CREATE INDEX `appointments_parent_idx` ON `appointments` (`parent_appointment_id`);
