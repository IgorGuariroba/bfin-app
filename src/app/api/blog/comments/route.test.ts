import { afterEach, describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { COMMENT_RATE_LIMIT } from "@/lib/rate-limit";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

// Mock do auth: o alvo do teste é a rota (validação + cota), não a sessão.
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));

import { POST } from "./route";

let createdUserIds: string[] = [];
let createdPostIds: string[] = [];

async function makeUserAndPost() {
  const user = await prisma.user.create({
    data: {
      name: "Comment User",
      email: `comment-${crypto.randomUUID()}@example.com`,
    },
  });
  createdUserIds.push(user.id);

  const post = await prisma.post.create({
    data: {
      slug: `post-${crypto.randomUUID()}`,
      title: "Post de teste",
      excerpt: "Excerpt",
      content: "Conteúdo",
      category: "financas",
      status: "published",
      authorId: user.id,
    },
  });
  createdPostIds.push(post.id);

  mockAuth.mockResolvedValue({ user: { id: user.id } });
  return { user, post };
}

function commentRequest(postId: string) {
  return new Request("http://localhost/api/blog/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ postId, body: "Comentário de teste válido" }),
  });
}

afterEach(async () => {
  vi.useRealTimers();
  mockAuth.mockReset();
  if (createdPostIds.length) {
    await prisma.post.deleteMany({ where: { id: { in: createdPostIds } } });
    createdPostIds = [];
  }
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

describe("POST /api/blog/comments", () => {
  it("cria comentários dentro da cota", async () => {
    const { post } = await makeUserAndPost();

    for (let i = 0; i < COMMENT_RATE_LIMIT.limit; i++) {
      const res = await POST(commentRequest(post.id));
      expect(res.status).toBe(201);
    }
  });

  it("responde 429 com retry-after ao exceder a cota do usuário", async () => {
    const { post } = await makeUserAndPost();

    for (let i = 0; i < COMMENT_RATE_LIMIT.limit; i++) {
      await POST(commentRequest(post.id));
    }

    const res = await POST(commentRequest(post.id));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("cota de um usuário não afeta outro", async () => {
    const { post } = await makeUserAndPost();
    for (let i = 0; i <= COMMENT_RATE_LIMIT.limit; i++) {
      await POST(commentRequest(post.id));
    }

    const { post: otherPost } = await makeUserAndPost();
    const res = await POST(commentRequest(otherPost.id));
    expect(res.status).toBe(201);
  });

  it("reabre a janela após windowMs e volta a aceitar comentários", async () => {
    const { post } = await makeUserAndPost();
    for (let i = 0; i < COMMENT_RATE_LIMIT.limit; i++) {
      await POST(commentRequest(post.id));
    }
    expect((await POST(commentRequest(post.id))).status).toBe(429);

    // Só o Date é mockado: prisma continua com scheduling real.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + COMMENT_RATE_LIMIT.windowMs);

    const res = await POST(commentRequest(post.id));
    expect(res.status).toBe(201);
  });

  it("exige autenticação", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(commentRequest("qualquer"));
    expect(res.status).toBe(401);
  });
});
