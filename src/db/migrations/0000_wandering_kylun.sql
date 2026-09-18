CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `blocked_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `blocked_periods_start_at_idx` ON `blocked_periods` (`start_at`);--> statement-breakpoint
CREATE TABLE `business_hours` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weekday` integer NOT NULL,
	`is_closed` integer DEFAULT false NOT NULL,
	`open_minute` integer,
	`close_minute` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_hours_weekday_unique` ON `business_hours` (`weekday`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`duration_minutes` integer NOT NULL,
	`price_cents` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`image_path` text,
	`color` text DEFAULT '#B86F78' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_demo` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE INDEX `services_active_idx` ON `services` (`active`);--> statement-breakpoint
CREATE INDEX `services_sort_order_idx` ON `services` (`sort_order`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_whatsapp_idx` ON `customers` (`whatsapp`);--> statement-breakpoint
CREATE TABLE `appointment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`note` text,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `appointment_events_appointment_idx` ON `appointment_events` (`appointment_id`);--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`protocol` text NOT NULL,
	`customer_id` text NOT NULL,
	`service_id` text,
	`service_name_snapshot` text NOT NULL,
	`service_duration_snapshot` integer NOT NULL,
	`service_price_snapshot` integer NOT NULL,
	`start_at_utc` integer NOT NULL,
	`end_at_utc` integer NOT NULL,
	`timezone` text DEFAULT 'America/Cuiaba' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`origin` text DEFAULT 'site' NOT NULL,
	`public_note` text,
	`internal_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_protocol_unique` ON `appointments` (`protocol`);--> statement-breakpoint
CREATE INDEX `appointments_start_at_idx` ON `appointments` (`start_at_utc`);--> statement-breakpoint
CREATE INDEX `appointments_status_idx` ON `appointments` (`status`);--> statement-breakpoint
CREATE INDEX `appointments_service_idx` ON `appointments` (`service_id`);--> statement-breakpoint
CREATE INDEX `appointments_customer_idx` ON `appointments` (`customer_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`financial_date` integer NOT NULL,
	`category` text NOT NULL,
	`description` text,
	`note` text,
	`payment_method` text NOT NULL,
	`status` text DEFAULT 'paid' NOT NULL,
	`appointment_id` text,
	`service_id` text,
	`created_by_user_id` text,
	`idempotency_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_idempotency_key_unique` ON `transactions` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `transactions_financial_date_idx` ON `transactions` (`financial_date`);--> statement-breakpoint
CREATE INDEX `transactions_type_idx` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `transactions_status_idx` ON `transactions` (`status`);--> statement-breakpoint
CREATE INDEX `transactions_appointment_idx` ON `transactions` (`appointment_id`);--> statement-breakpoint
CREATE TABLE `rate_limit_hits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
