import { type Page, type Locator } from '@playwright/test';

export class BlogPage {
  readonly page: Page;
  readonly searchToggleButton: Locator;
  readonly searchInput: Locator;
  readonly searchResultItems: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // The magnifier/search toggle button (common WordPress class)
    this.searchToggleButton = page.locator(
      '.search-toggle, [class*="search-toggle"], [class*="search-icon"], button[class*="search"], a[class*="search-link"]'
    ).first();

    // Use the known ID from the blog's HTML
    this.searchInput = page.locator('#search-field, input[name="s"][type="search"]').first();

    // Article/post result items
    this.searchResultItems = page.locator('article, h2.entry-title, .post, [class*="post-item"]');

    // "No results" feedback
    this.noResultsMessage = page.locator(
      '.no-results, .not-found, [class*="no-result"], p:has-text("Nothing Found"), p:has-text("não encontramos"), p:has-text("nenhum resultado")'
    );
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openSearch() {
    const inputVisible = await this.searchInput.isVisible().catch(() => false);
    if (inputVisible) return;

    // Click the toggle button to reveal the search input
    await this.searchToggleButton.click();

    // Wait for input to become visible (up to 8s)
    await this.searchInput.waitFor({ state: 'visible', timeout: 8000 }).catch(async () => {
      // Fallback: some themes require a second interaction — force the click
      await this.searchToggleButton.click({ force: true }).catch(() => {});
      await this.searchInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    });
  }

  async searchFor(term: string) {
    await this.openSearch();
    // Use force:true in case the input is still CSS-hidden but interactable
    await this.searchInput.fill(term, { force: true });
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
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
