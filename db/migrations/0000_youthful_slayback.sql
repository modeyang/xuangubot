CREATE TABLE `stock_daily_bars` (
	`stock_id` integer NOT NULL,
	`trade_date` text NOT NULL,
	`open` real,
	`high` real,
	`low` real,
	`close` real,
	`volume` integer,
	`turnover` real,
	PRIMARY KEY(`stock_id`, `trade_date`),
	FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_daily_bars_stock_id_trade_date_idx` ON `stock_daily_bars` (`stock_id`,`trade_date`);--> statement-breakpoint
CREATE TABLE `stock_quotes` (
	`stock_id` integer NOT NULL,
	`quoted_at` text NOT NULL,
	`last_price` real,
	`pct_change` real,
	`turnover` real,
	`volume` integer,
	PRIMARY KEY(`stock_id`, `quoted_at`),
	FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_quotes_stock_id_quoted_at_idx` ON `stock_quotes` (`stock_id`,`quoted_at`);--> statement-breakpoint
CREATE TABLE `stocks` (
	`id` integer PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`exchange` text NOT NULL,
	`name` text,
	`status` text,
	`industry` text,
	`profile_json` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stocks_symbol_unique` ON `stocks` (`symbol`);--> statement-breakpoint
CREATE INDEX `stocks_symbol_idx` ON `stocks` (`symbol`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY NOT NULL,
	`stock_id` integer NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`published_at` text,
	`source_name` text,
	`source_url` text,
	FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `article_stocks` (
	`article_id` integer NOT NULL,
	`stock_id` integer NOT NULL,
	PRIMARY KEY(`article_id`, `stock_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `article_themes` (
	`article_id` integer NOT NULL,
	`theme_id` integer NOT NULL,
	PRIMARY KEY(`article_id`, `theme_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body_markdown` text,
	`body_html` text,
	`article_type` text NOT NULL,
	`visibility` text NOT NULL,
	`status` text NOT NULL,
	`cover_url` text,
	`published_at` text,
	`source_name` text,
	`source_ref` text
);
--> statement-breakpoint
CREATE INDEX `articles_published_at_idx` ON `articles` (`published_at`);--> statement-breakpoint
CREATE TABLE `homepage_modules` (
	`id` integer PRIMARY KEY NOT NULL,
	`module_key` text NOT NULL,
	`title` text NOT NULL,
	`config_json` text,
	`sort_order` integer,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `theme_snapshots` (
	`theme_id` integer NOT NULL,
	`captured_at` text NOT NULL,
	`heat_score` real,
	`rank` integer,
	`payload_json` text,
	PRIMARY KEY(`theme_id`, `captured_at`),
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `theme_stocks` (
	`theme_id` integer NOT NULL,
	`stock_id` integer NOT NULL,
	`score` real,
	`source` text,
	PRIMARY KEY(`theme_id`, `stock_id`),
	FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`summary` text,
	`source_ref` text
);
--> statement-breakpoint
CREATE TABLE `beta_access_phones` (
	`phone` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`created_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `login_code_debug` (
	`id` integer PRIMARY KEY NOT NULL,
	`login_code_id` integer,
	`phone` text NOT NULL,
	`code_plain` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`login_code_id`) REFERENCES `login_codes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `login_codes` (
	`id` integer PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`request_ip` text
);
--> statement-breakpoint
CREATE INDEX `login_codes_phone_expires_at_idx` ON `login_codes` (`phone`,`expires_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`session_token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`last_seen_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`display_name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`entitlement_type` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`source_order_id` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`plan_id` integer NOT NULL,
	`provider` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text NOT NULL,
	`provider_order_id` text,
	`created_at` text NOT NULL,
	`paid_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_provider_order_id_unique` ON `orders` (`provider_order_id`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` integer PRIMARY KEY NOT NULL,
	`plan_code` text NOT NULL,
	`name` text NOT NULL,
	`duration_days` integer NOT NULL,
	`price_cents` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plans_plan_code_unique` ON `plans` (`plan_code`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`payload_json` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ingest_runs` (
	`id` integer PRIMARY KEY NOT NULL,
	`job_name` text NOT NULL,
	`source_name` text,
	`started_at` text NOT NULL,
	`finished_at` text,
	`status` text NOT NULL,
	`summary_json` text
);
--> statement-breakpoint
CREATE TABLE `raw_source_records` (
	`id` integer PRIMARY KEY NOT NULL,
	`source_name` text NOT NULL,
	`source_ref` text NOT NULL,
	`fetched_at` text NOT NULL,
	`payload_path` text,
	`payload_hash` text,
	`normalize_status` text
);
