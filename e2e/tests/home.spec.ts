import { expect, test } from "@playwright/test";

import { gotoAndWaitForHydration } from "../helpers/auth";

test.use({ storageState: { cookies: [], origins: [] } });

test("homepage has the expected title", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/");

  await expect(page).toHaveTitle(/Kevin Von Erich Peredo/);
});

test("homepage hero shows name and position", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/");

  await expect(page.getByRole("heading", { name: "KEVIN VON ERICH PEREDO" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Senior Frontend Engineer", exact: true }),
  ).toBeVisible();
});

test("homepage has functional navigation links", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/");

  await expect(page.getByRole("link", { name: "Config" })).toHaveAttribute("href", "/config");
  await expect(page.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
});

test("homepage contact links point to the right destinations", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/");

  const footer = page.locator("footer");

  const email = footer.getByLabel("Email link");
  await expect(email).toHaveAttribute("href", "mailto:contact@kevinperedo.com");
  await expect(email).toHaveAttribute("target", "_blank");
  await expect(email).toHaveAttribute("rel", "noreferrer");

  const github = footer.getByLabel("Github link");
  await expect(github).toHaveAttribute("href", "https://github.com/kveperedo");
  await expect(github).toHaveAttribute("target", "_blank");
  await expect(github).toHaveAttribute("rel", "noreferrer");

  const linkedin = footer.getByLabel("LinkedIn link");
  await expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/kveperedo/");
  await expect(linkedin).toHaveAttribute("target", "_blank");
  await expect(linkedin).toHaveAttribute("rel", "noreferrer");
});

test("homepage resume button opens the resume in a new tab", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/");

  const resume = page.getByRole("link", { name: "Resume" });
  await expect(resume).toHaveAttribute("href", "/resume.pdf");
  await expect(resume).toHaveAttribute("target", "_blank");
  await expect(resume).toHaveAttribute("rel", /noopener|noreferrer/);
});

test("homepage renders all main sections", async ({ page }) => {
  await gotoAndWaitForHydration(page, "/");

  await expect(page.locator("#intro")).toBeVisible();
  await expect(page.locator("#summary")).toBeVisible();
  await expect(page.locator("#info")).toBeVisible();
  await expect(page.locator("#projects")).toBeVisible();
});
