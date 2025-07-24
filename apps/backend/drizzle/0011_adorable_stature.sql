CREATE TABLE IF NOT EXISTS "checkpoint_blobs" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text NOT NULL,
	"channel" text NOT NULL,
	"version" text NOT NULL,
	"type" text NOT NULL,
	"blob" "bytea",
	CONSTRAINT "checkpoint_blobs_thread_id_checkpoint_ns_channel_version_pk" PRIMARY KEY("thread_id","checkpoint_ns","channel","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checkpoint_migrations" (
	"v" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checkpoint_writes" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text NOT NULL,
	"checkpoint_id" text NOT NULL,
	"task_id" text NOT NULL,
	"idx" integer NOT NULL,
	"channel" text NOT NULL,
	"type" text,
	"blob" "bytea" NOT NULL,
	CONSTRAINT "checkpoint_writes_thread_id_checkpoint_ns_checkpoint_id_task_id_idx_pk" PRIMARY KEY("thread_id","checkpoint_ns","checkpoint_id","task_id","idx")
);
