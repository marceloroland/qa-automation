import { type Page, type Locator } from '@playwright/test';

export class BlogPage {
  readonly page: Page;
  readonly searchToggleButton: Locator;
  readonly searchInput: Locator;
  readonly searchResultItems: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Exact button found in the page snapshot: button "Search button" with text "Pesquisar"
    this.searchToggleButton = page.getByRole('button', { name: /search button/i });

    // Known input ID from CI logs
    this.searchInput = page.locator('#search-field');

    // Article result items in search results page
    this.searchResultItems = page.locator('article, h2.entry-title, h3.entry-title');

    // "No results" feedback
    this.noResultsMessage = page.locator(
      '.no-results, .not-found, [class*="no-result"], p:has-text("Nothing Found"), p:has-text("nenhum resultado")'
    );
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openSearch() {
    const inputVisible = await this.searchInput.isVisible().catch(() => false);
    if (inputVisible) return;

    await this.searchToggleButton.click();
    await this.searchInput.waitFor({ state: 'visible', timeout: 8000 });
  }

  async searchFor(term: string) {
    await this.openSearch();
    await this.searchInput.fill(term);
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
