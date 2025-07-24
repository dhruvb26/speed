import {
  integer,
  pgTable,
  varchar,
  timestamp,
  jsonb,
  text,
  primaryKey,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  usage: integer().notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const organizationsTable = pgTable("organizations", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  userId: varchar({ length: 255 }).references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const integrationsTable = pgTable("integrations", {
  id: varchar({ length: 255 }).primaryKey(),
  userId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  provider: varchar({ length: 50 }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  refreshTokenExpiry: timestamp("refresh_token_expiry"),
  providerUserId: varchar("provider_user_id", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const composioIntegrations = pgTable("composio_integrations", {
  id: varchar({ length: 255 }).primaryKey(),
  userId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  toolkits: jsonb("toolkits").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const checkpoints = pgTable(
  "checkpoints",
  {
    threadId: text("thread_id").notNull(),
    checkpointNs: text("checkpoint_ns").notNull(),
    checkpointId: text("checkpoint_id").notNull(),
    parentCheckpointId: text("parent_checkpoint_id"),
    type: text("type"),
    checkpoint: jsonb("checkpoint").notNull(),
    metadata: jsonb("metadata").notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.threadId, table.checkpointNs, table.checkpointId],
    }),
  })
);

export const checkpointWrites = pgTable(
  "checkpoint_writes",
  {
    threadId: text("thread_id").notNull(),
    checkpointNs: text("checkpoint_ns").notNull(),
    checkpointId: text("checkpoint_id").notNull(),
    taskId: text("task_id").notNull(),
    idx: integer("idx").notNull(),
    channel: text("channel").notNull(),
    type: text("type"),
    blob: bytea("blob").notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.threadId,
        table.checkpointNs,
        table.checkpointId,
        table.taskId,
        table.idx,
      ],
    }),
  })
);

export const checkpointBlobs = pgTable(
  "checkpoint_blobs",
  {
    threadId: text("thread_id").notNull(),
    checkpointNs: text("checkpoint_ns").notNull(),
    channel: text("channel").notNull(),
    version: text("version").notNull(),
    type: text("type").notNull(),
    blob: bytea("blob"),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.threadId,
        table.checkpointNs,
        table.channel,
        table.version,
      ],
    }),
  })
);

export const checkpointMigrations = pgTable("checkpoint_migrations", {
  v: integer("v").primaryKey(),
});

export const chats = pgTable("chats", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  organizations: many(organizationsTable),
  integrations: many(integrationsTable),
}));

export const organizationsRelations = relations(
  organizationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [organizationsTable.userId],
      references: [usersTable.id],
    }),
  })
);

export const integrationsRelations = relations(
  integrationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [integrationsTable.userId],
      references: [usersTable.id],
    }),
  })
);
