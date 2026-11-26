import { expect, test } from "@playwright/test";

import { gotoAndWaitForHydration } from "../helpers/auth";

test.use({ storageState: { cookies: [], origins: [] } });

test("config page renders the setup tabs", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/config");

    await expect(page).toHaveTitle(/Config \| Kevin Von Erich Peredo/);

    const tabs = page.getByRole("tablist", { name: "Setup sections" });
    await expect(tabs.getByRole("tab")).toHaveText(["CLI tools", "Applications"]);
});

test("config page switches between CLI tools and Applications", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/config");

    await expect(page.locator("#cli-tools")).toBeVisible();

    await page.getByRole("tab", { name: "Applications" }).click();
    await expect(page.locator("#applications")).toBeVisible();
});

test("CLI tools pair copyable prompts with collapsible commands", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/config");

    const cliTools = page.locator("#cli-tools");

    await expect(cliTools.getByRole("button", { name: "Copy prompt" })).toHaveCount(5);

    const commandDisclosures = cliTools.getByRole("button", { name: "Exact commands" });
    await expect(commandDisclosures).toHaveCount(4);

    await commandDisclosures.first().click();
    await expect(cliTools.getByText("chsh -s $(which zsh)")).toBeVisible();
});
