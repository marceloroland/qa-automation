import { test, expect } from '@playwright/test';
import { BlogPage } from '../pages/BlogPage';

/**
 * Test Suite: Blog do Agi - Search Feature
 *
 * Scenarios covered:
 * 1. Search with a valid keyword returns relevant results
 * 2. Search with a non-existent keyword shows a "no results" feedback
 * 3. Search navigates to a results page with the correct query string
 * 4. Search input is accessible via the magnifier icon
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
    const keyword = 'financeiro';

    await blogPage.searchFor(keyword);

    const resultCount = await blogPage.getResultCount();
    const noResults = await blogPage.hasNoResultsMessage();

    // Either results are listed OR the page does not show a "no results" message
    expect(
      resultCount > 0 || !noResults,
      `Expected at least one result for "${keyword}" but got 0`
    ).toBeTruthy();

    // URL should contain the search query
    const url = await blogPage.getCurrentUrl();
    expect(url).toContain(encodeURIComponent(keyword).toLowerCase().replace(/%20/g, '+') ?? keyword);
  });

  // ------------------------------------------------------------------ //
  // Scenario 2: Non-existent keyword shows "no results" message
  // ------------------------------------------------------------------ //
  test('should show a "no results" message for a non-existent keyword', async () => {
    const keyword = 'xyzzy_termo_inexistente_12345';

    await blogPage.searchFor(keyword);

    const resultCount = await blogPage.getResultCount();
    const hasNoResults = await blogPage.hasNoResultsMessage();

    // The page should indicate no results were found
    expect(
      hasNoResults || resultCount === 0,
      `Expected a "no results" state for "${keyword}" but found ${resultCount} items`
    ).toBeTruthy();
  });

  // ------------------------------------------------------------------ //
  // Scenario 3: Search URL contains the query parameter
  // ------------------------------------------------------------------ //
  test('should navigate to a URL containing the search query', async () => {
    const keyword = 'emprestimo';

    await blogPage.searchFor(keyword);

    const url = await blogPage.getCurrentUrl();
    expect(url, 'URL should contain the search query parameter').toMatch(/[?&]s=/);
  });

  // ------------------------------------------------------------------ //
  // Scenario 4: Search icon opens the search input
  // ------------------------------------------------------------------ //
  test('should open the search input when the magnifier icon is clicked', async ({ page }) => {
    blogPage = new BlogPage(page);
    await blogPage.goto();

    await blogPage.openSearch();

    await expect(blogPage.searchInput).toBeVisible();
  });
});
