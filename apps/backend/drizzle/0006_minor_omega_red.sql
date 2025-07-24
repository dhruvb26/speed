CREATE TABLE IF NOT EXISTS "checkpoints" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text NOT NULL,
	"checkpoint_id" text NOT NULL,
	"parent_checkpoint_id" text,
	"type" text,
	"checkpoint" jsonb NOT NULL,
	"metadata" jsonb NOT NULL,
	CONSTRAINT "checkpoints_thread_id_checkpoint_ns_checkpoint_id_pk" PRIMARY KEY("thread_id","checkpoint_ns","checkpoint_id")
);
