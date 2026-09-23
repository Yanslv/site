ALTER TABLE `customers` ADD `birth_date` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `rg` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `cpf` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `address` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `city` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `state` text;--> statement-breakpoint
CREATE TABLE `anamneses` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`payload` text NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX `anamneses_appointment_unique` ON `anamneses` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `anamneses_customer_idx` ON `anamneses` (`customer_id`);