import { expect, test } from "@playwright/test";

const authStateConfigured = Boolean(process.env.PLAYWRIGHT_AUTH_STATE);

test.describe("GitHub authentication", () => {
  test("shows the GitHub sign-in entry point to signed-out users", async ({
    page,
  }) => {
    test.skip(
      authStateConfigured,
      "Run this assertion without PLAYWRIGHT_AUTH_STATE."
    );
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /Continue with GitHub/i })
    ).toBeVisible();
  });

  test("opens an authenticated workspace and exposes the protected workspace contract", async ({
    page,
  }) => {
    test.skip(
      !authStateConfigured,
      "Set PLAYWRIGHT_AUTH_STATE to a saved GitHub-authenticated storage state."
    );
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /Simondavid07.*Signed in/i })
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Choose active project" })
    ).toContainText("WEB");

    const workspaceResponse = await page.request.get(
      "/api/trpc/workspace.mine?batch=1&input=" +
        encodeURIComponent(JSON.stringify({ "0": { json: null } }))
    );
    expect(workspaceResponse.ok()).toBeTruthy();
    const body = await workspaceResponse.json();
    const data = body?.[0]?.result?.data?.json;
    expect(
      data?.projects?.some((project: { key?: string }) => project.key === "WEB")
    ).toBeTruthy();
  });

  test("shows workspace deletion controls only after opening the personalization settings", async ({
    page,
  }) => {
    test.skip(
      !authStateConfigured,
      "Set PLAYWRIGHT_AUTH_STATE to a saved GitHub-authenticated storage state."
    );
    await page.goto("/");
    await page.locator("details.project-personalization > summary").click();
    await expect(page.getByText("Workspace settings")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete" }).first()
    ).toBeVisible();
  });
});
