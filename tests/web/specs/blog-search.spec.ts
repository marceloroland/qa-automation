import { test, expect } from '@playwright/test';
import { BlogPage } from '../pages/BlogPage';

/**
 * Test Suite: Blog do Agi – Search Feature
 *
 * The Astra theme search toggle relies on CSS visibility controlled by JS.
 * In headless Chromium the toggle animation does not fire, so the input
 * is always present in the DOM (tabindex="-1", visibility:hidden).
 * Tests interact with the input via force:true — which is the correct approach
 * when the element is technically present but CSS-hidden, as Playwright
 * still dispatches real keyboard/form events that the browser processes.
 *
 * Scenarios covered:
 * 1. Search with a valid keyword returns relevant article results
 * 2. Search with a non-existent keyword shows a "no results" state
 * 3. Search navigates to a results URL containing the query parameter
 * 4. The search toggle button is present and has correct ARIA attributes
 */
test.describe('Blog do Agi – Search Feature', () => {
  let blogPage: BlogPage;

  test.beforeEach(async ({ page }) => {
    blogPage = new BlogPage(page);
    await blogPage.goto();
  });

  // ------------------------------------------------------------------ //
  // Scenario 1: Valid keyword returns results
  // ------------------------------------------------------------------ //
  test('should display results when searching for a valid keyword', async () => {
    await blogPage.searchFor('financeiro');

    const resultCount = await blogPage.getResultCount();
    expect(resultCount, 'Expected at least one article result for "financeiro"').toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------ //
  // Scenario 2: Non-existent keyword shows no-results state
  // ------------------------------------------------------------------ //
  test('should show a "no results" state for a non-existent keyword', async () => {
    await blogPage.searchFor('xyzzy_termo_inexistente_12345');

    const resultCount = await blogPage.getResultCount();
    const hasNoResultsMsg = await blogPage.hasNoResultsMessage();

    expect(
      resultCount === 0 || hasNoResultsMsg,
      'Expected zero results or a "no results" message'
    ).toBeTruthy();
  });

  // ------------------------------------------------------------------ //
  // Scenario 3: Search URL contains the query parameter
  // ------------------------------------------------------------------ //
  test('should navigate to a URL containing the search query', async () => {
    const keyword = 'emprestimo';
    await blogPage.searchFor(keyword);

    const url = await blogPage.getCurrentUrl();
    expect(url).toContain(`s=${keyword}`);
  });

  // ------------------------------------------------------------------ //
  // Scenario 4: Search toggle button has correct ARIA attributes
  // ------------------------------------------------------------------ //
  test('should have an accessible search toggle button in the header', async ({ page }) => {
    const btn = page.locator('a.astra-search-icon');

    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('role', 'button');
    await expect(btn).toHaveAttribute('aria-label', /search button/i);
  });
});
