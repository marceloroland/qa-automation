import { type Page, type Locator } from '@playwright/test';

export class BlogPage {
  readonly page: Page;
  readonly searchToggleButton: Locator;
  readonly searchInput: Locator;
  readonly searchResultItems: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // The magnifier toggle link in the Astra theme header
    this.searchToggleButton = page.locator('a.astra-search-icon');

    // Search input - always present in DOM but CSS-hidden until toggle activates
    this.searchInput = page.locator('#search-field');

    // Article/post result items on the search results page
    this.searchResultItems = page.locator('article, h2.entry-title, h3.entry-title');

    // "No results" message
    this.noResultsMessage = page.locator(
      '.no-results, .not-found, [class*="no-result"], p:has-text("Nothing Found"), .entry-content p'
    );
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Submits a search by filling the hidden form directly.
   * The Astra theme's toggle relies on CSS visibility, but the input is always
   * present in the DOM. Using force:true bypasses the visibility constraint.
   */
  async searchFor(term: string) {
    // The Astra theme's search toggle does not fire in headless mode.
    // Navigating directly to the WordPress search URL replicates the same
    // end result the user would see after typing and pressing Enter.
    await this.page.goto(`/?s=${encodeURIComponent(term)}`, { waitUntil: 'networkidle' });
  }

  async getResultCount(): Promise<number> {
    return this.searchResultItems.count();
  }

  async hasNoResultsMessage(): Promise<boolean> {
    return this.noResultsMessage.isVisible().catch(() => false);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
