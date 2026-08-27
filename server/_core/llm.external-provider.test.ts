import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./env.js", () => ({
  ENV: {
    aiGatewayUrl: "https://ai-gateway.vercel.sh/v1",
    vercelOidcToken: "",
    forgeApiUrl: "",
    forgeApiKey: "",
  },
}));

import { ENV } from "./env.js";
import { invokeLLM, listLLMModels } from "./llm.js";

afterEach(() => {
  ENV.vercelOidcToken = "";
  ENV.forgeApiUrl = "";
  ENV.forgeApiKey = "";
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("external AI provider routing", () => {
  it("uses the request-scoped Vercel OIDC token for an AI Gateway completion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "completion", created: 0, model: "openai/gpt-5-mini", choices: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await invokeLLM({
      oidcToken: "short-lived-oidc-token",
      messages: [{ role: "user", content: "Summarize this issue." }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://ai-gateway.vercel.sh/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer short-lived-oidc-token" }),
      }),
    );
  });

  it("keeps the managed Forge adapter available only when no Vercel OIDC token exists", async () => {
    ENV.forgeApiUrl = "https://forge.manus.im";
    ENV.forgeApiKey = "managed-rollback-token";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ object: "list", data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listLLMModels();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://forge.manus.im/v1/models",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer managed-rollback-token" }),
      }),
    );
  });

  it("fails safely when no external or rollback AI credential is available", async () => {
    await expect(
      listLLMModels({ oidcToken: "" }),
    ).rejects.toThrow("No server-side AI credential is available");
  });
});
