import * as schema from "@/db/schema";

export type User = typeof schema.usersTable.$inferSelect;
export type NewUser = typeof schema.usersTable.$inferInsert;

export type Organization = typeof schema.organizationsTable.$inferSelect;
export type NewOrganization = typeof schema.organizationsTable.$inferInsert;

export type Integration = typeof schema.integrationsTable.$inferSelect;
export type NewIntegration = typeof schema.integrationsTable.$inferInsert;

export type ComposioIntegration =
  typeof schema.composioIntegrations.$inferSelect;
export type NewComposioIntegration =
  typeof schema.composioIntegrations.$inferInsert;

export type Chat = typeof schema.chats.$inferSelect;
export type NewChat = typeof schema.chats.$inferInsert;

export type Checkpoint = typeof schema.checkpoints.$inferSelect;
export type NewCheckpoint = typeof schema.checkpoints.$inferInsert;
