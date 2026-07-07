import { relations } from "drizzle-orm/relations";
import { user, previsao, tag, account, transaction, accountMember, post, postComment, tagToTransaction, postTopics, postTopic } from "./schema";

export const userRelations = relations(user, ({many}) => ({
	previsaos: many(previsao),
	tags: many(tag),
	accounts: many(account),
	transactions: many(transaction),
	accountMembers_ownerId: many(accountMember, {
		relationName: "accountMember_ownerId_user_id"
	}),
	accountMembers_memberId: many(accountMember, {
		relationName: "accountMember_memberId_user_id"
	}),
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
	tagToTransactions: many(tagToTransaction),
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