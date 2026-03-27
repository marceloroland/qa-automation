import { type Page, type Locator, expect } from '@playwright/test';

export class BlogPage {
  readonly page: Page;
  readonly searchToggleButton: Locator;
  readonly searchInput: Locator;
  readonly searchResultItems: Locator;
  readonly noResultsMessage: Locator;
  readonly searchResultsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    // The magnifier icon in the top-right corner
    this.searchToggleButton = page.locator('a[aria-label="Buscar"], .search-icon, button.search, a.search, [class*="search-toggle"], [class*="search-icon"]').first();
    // The search input field (visible after toggle)
    this.searchInput = page.locator('input[type="search"], input[name="s"], input[placeholder*="Buscar"], input[placeholder*="buscar"], input[placeholder*="Pesquisar"]').first();
    // Article/post result items
    this.searchResultItems = page.locator('article, .post, .search-result, .entry, [class*="post-item"], h2.entry-title, .blog-post');
    // "No results" feedback
    this.noResultsMessage = page.locator('.no-results, .not-found, [class*="no-result"], p:has-text("não encontramos"), p:has-text("nenhum resultado"), p:has-text("Nothing Found")');
    // Results container
    this.searchResultsSection = page.locator('#main, .search-results, main, [class*="content"]').first();
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openSearch() {
    // Try clicking the search toggle; if already visible, skip
    const inputVisible = await this.searchInput.isVisible().catch(() => false);
    if (!inputVisible) {
      await this.searchToggleButton.click();
      await this.searchInput.waitFor({ state: 'visible', timeout: 5000 });
    }
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
