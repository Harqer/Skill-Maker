import { pgTable, text, timestamp, integer, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  tags: text('tags').array().notNull(),
  authorId: varchar('author_id', { length: 255 }).notNull().references(() => users.id),
  upvotes: integer('upvotes').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
