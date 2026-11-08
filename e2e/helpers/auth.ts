import type { Page, Response } from "@playwright/test";

// The hydration marker is set from a root `useEffect`, so a document that fails before
// hydration (edge 503s such as Cloudflare 1102, SSR errors) never sets it. Waiting the
// whole test timeout hides the real failure, so bound the wait and report the response.
const HYDRATION_TIMEOUT_MS = 20_000;
const BODY_SNIPPET_LENGTH = 300;
const BODY_READ_TIMEOUT_MS = 1_000;

function snippet(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, BODY_SNIPPET_LENGTH);
}

// `@playwright/test` does not export TimeoutError, but Playwright sets `name` from the class.
function isTimeoutError(error: unknown) {
  return error instanceof Error && error.name === "TimeoutError";
}

/** Visible page text, so a Cloudflare error page reads as text instead of raw HTML. */
async function describePage(page: Page, response?: Response) {
  const visibleText = await page
    .locator("body")
    .innerText({ timeout: BODY_READ_TIMEOUT_MS })
    .catch(() => "");
  const fallback = response ? await response.text().catch(() => "") : "";
  const details = snippet(visibleText || fallback);

  return details ? `: ${details}` : "";
}

export async function waitForHydration(page: Page) {
  try {
    await page.waitForSelector("html[data-hydrated]", { timeout: HYDRATION_TIMEOUT_MS });
  } catch (error) {
    if (!isTimeoutError(error)) {
      throw error;
    }

    throw new Error(
      `Page ${page.url()} did not hydrate within ${HYDRATION_TIMEOUT_MS}ms${await describePage(page)}`,
    );
  }
}

export async function gotoAndWaitForHydration(page: Page, url: string) {
  const response = await page.goto(url);

  // Edge failures return a document that never hydrates; surface the status and body
  // instead of timing out on the marker.
  if (response && !response.ok()) {
    // HTTP/2 responses carry no status text.
    const status = [response.status(), response.statusText()].filter(Boolean).join(" ");

    throw new Error(`${url} responded ${status}${await describePage(page, response)}`);
  }

  await waitForHydration(page);
}

export async function loginAsAdmin(page: Page) {
  const password = process.env.E2E_PASSWORD;

  if (!password) {
    throw new Error("E2E_PASSWORD environment variable is required for authenticated tests");
  }

  await gotoAndWaitForHydration(page, "/login");
  await page.getByLabel(/password/i).pressSequentially(password);
  await page.getByRole("button", { name: /continue/i }).click();

  await page.waitForURL(/\/finances/, { timeout: 30000 });
}
