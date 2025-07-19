import {
  integer,
  pgTable,
  varchar,
  timestamp,
  jsonb,
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

// relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  organizations: many(organizationsTable),
}))

export const organizationsRelations = relations(organizationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [organizationsTable.userId],
    references: [usersTable.id],
  }),
}))