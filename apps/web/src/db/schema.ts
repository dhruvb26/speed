import {
  integer,
  pgTable,
  varchar,
  timestamp,
  jsonb,
  text,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const usersTable = pgTable('users', {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  usage: integer().notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const organizationsTable = pgTable('organizations', {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  userId: varchar({ length: 255 }).references(() => usersTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const integrationsTable = pgTable('integrations', {
  id: varchar({ length: 255 }).primaryKey(),
  userId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id),
  provider: varchar({ length: 50 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  refreshTokenExpiry: timestamp('refresh_token_expiry'),
  providerUserId: varchar('provider_user_id', { length: 255 }),
  metadata: jsonb('metadata'), 
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  organizations: many(organizationsTable),
  integrations: many(integrationsTable),
}))

export const organizationsRelations = relations(
  organizationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [organizationsTable.userId],
      references: [usersTable.id],
    }),
  })
)

export const integrationsRelations = relations(
  integrationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [integrationsTable.userId],
      references: [usersTable.id],
    }),
  })
)
