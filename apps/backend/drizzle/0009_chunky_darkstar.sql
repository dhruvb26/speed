CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"thread_id" text NOT NULL,
	"userId" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
