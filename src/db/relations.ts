import { relations } from "drizzle-orm/relations";
import { user, session, previsao, tag, account, transaction, pluggyItem, accountMember, apiKey, post, postComment, tagToTransaction, postTopics, postTopic } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	previsaos: many(previsao),
	tags: many(tag),
	accounts: many(account),
	transactions: many(transaction),
	pluggyItems_userId: many(pluggyItem, {
		relationName: "pluggyItem_userId_user_id"
	}),
	pluggyItems_connectedByUserId: many(pluggyItem, {
		relationName: "pluggyItem_connectedByUserId_user_id"
	}),
	accountMembers_ownerId: many(accountMember, {
		relationName: "accountMember_ownerId_user_id"
	}),
	accountMembers_memberId: many(accountMember, {
		relationName: "accountMember_memberId_user_id"
	}),
	apiKeys: many(apiKey),
	posts: many(post),
	postComments: many(postComment),
}));

export const previsaoRelations = relations(previsao, ({one}) => ({
	user: one(user, {
		fields: [previsao.userId],
		references: [user.id]
	}),
}));

export const tagRelations = relations(tag, ({one, many}) => ({
	user: one(user, {
		fields: [tag.userId],
		references: [user.id]
	}),
	tagToTransactions: many(tagToTransaction),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const transactionRelations = relations(transaction, ({one, many}) => ({
	user: one(user, {
		fields: [transaction.userId],
		references: [user.id]
	}),
	pluggyItem: one(pluggyItem, {
		fields: [transaction.pluggyItemId],
		references: [pluggyItem.id]
	}),
	tagToTransactions: many(tagToTransaction),
}));

export const pluggyItemRelations = relations(pluggyItem, ({one, many}) => ({
	transactions: many(transaction),
	user_userId: one(user, {
		fields: [pluggyItem.userId],
		references: [user.id],
		relationName: "pluggyItem_userId_user_id"
	}),
	user_connectedByUserId: one(user, {
		fields: [pluggyItem.connectedByUserId],
		references: [user.id],
		relationName: "pluggyItem_connectedByUserId_user_id"
	}),
}));

export const accountMemberRelations = relations(accountMember, ({one}) => ({
	user_ownerId: one(user, {
		fields: [accountMember.ownerId],
		references: [user.id],
		relationName: "accountMember_ownerId_user_id"
	}),
	user_memberId: one(user, {
		fields: [accountMember.memberId],
		references: [user.id],
		relationName: "accountMember_memberId_user_id"
	}),
}));

export const apiKeyRelations = relations(apiKey, ({one}) => ({
	user: one(user, {
		fields: [apiKey.userId],
		references: [user.id]
	}),
}));

export const postRelations = relations(post, ({one, many}) => ({
	user: one(user, {
		fields: [post.authorId],
		references: [user.id]
	}),
	postComments: many(postComment),
	postTopics: many(postTopics),
}));

export const postCommentRelations = relations(postComment, ({one}) => ({
	post: one(post, {
		fields: [postComment.postId],
		references: [post.id]
	}),
	user: one(user, {
		fields: [postComment.userId],
		references: [user.id]
	}),
}));

export const tagToTransactionRelations = relations(tagToTransaction, ({one}) => ({
	tag: one(tag, {
		fields: [tagToTransaction.a],
		references: [tag.id]
	}),
	transaction: one(transaction, {
		fields: [tagToTransaction.b],
		references: [transaction.id]
	}),
}));

export const postTopicsRelations = relations(postTopics, ({one}) => ({
	post: one(post, {
		fields: [postTopics.a],
		references: [post.id]
	}),
	postTopic: one(postTopic, {
		fields: [postTopics.b],
		references: [postTopic.id]
	}),
}));

export const postTopicRelations = relations(postTopic, ({many}) => ({
	postTopics: many(postTopics),
}));