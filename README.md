# QA Technical Test – Playwright + TypeScript

Automated test suite covering two challenges:

| Challenge | Target | Tool |
|---|---|---|
| **Web** | [Blog do Agi](https://blogdoagi.com.br/) – search feature | Playwright (browser) |
| **API** | [Dog API](https://dog.ceo/dog-api/documentation) | Playwright (request context) |

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

---

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd qa-technical-test

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (Chromium only is enough)
npx playwright install chromium
```

---

## Running the tests

| Command | Description |
|---|---|
| `npm test` | Run all tests (web + API) |
| `npm run test:web` | Run only the Blog do Agi web tests |
| `npm run test:api` | Run only the Dog API tests |
| `npm run test:headed` | Run all tests with a visible browser |
| `npm run test:report` | Open the HTML report after a test run |

### Examples

```bash
# All tests headless (default)
npm test

# Web tests only, visible browser
npx playwright test tests/web/ --headed

# API tests only
npm run test:api

# Run a specific spec file
npx playwright test tests/api/specs/dog-api.spec.ts

# Run with verbose output
npx playwright test --reporter=list
```

---

## Test Report

After any test run, an HTML report is generated at `playwright-report/index.html`.

```bash
npm run test:report
```

Screenshots and videos for failed tests are saved under `test-results/`.

---

## Project Structure

```
qa-technical-test/
├── tests/
│   ├── web/
│   │   ├── pages/
│   │   │   └── BlogPage.ts          # Page Object for Blog do Agi
│   │   └── specs/
│   │       └── blog-search.spec.ts  # Web test scenarios
│   └── api/
│       └── specs/
│           └── dog-api.spec.ts      # API test scenarios
├── .github/
│   └── workflows/
│       └── tests.yml                # GitHub Actions CI pipeline
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Test Scenarios

### Web – Blog do Agi Search

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Search with a **valid keyword** (e.g. `financeiro`) | Results are displayed; URL contains `?s=` |
| 2 | Search with a **non-existent keyword** | "No results" message is shown or result list is empty |
| 3 | **URL contains query parameter** after search | URL matches `?s=<keyword>` |
| 4 | **Search input opens** when magnifier icon is clicked | Input becomes visible |

### API – Dog API

| # | Endpoint | Scenario |
|---|---|---|
| 1 | `GET /breeds/list/all` | Returns 200, `status: success`, non-empty object |
| 2 | `GET /breeds/list/all` | Contains well-known breeds (labrador, husky, poodle) |
| 3 | `GET /breeds/list/all` | Sub-breeds are arrays |
| 4 | `GET /breed/labrador/images` | Returns 200, non-empty image array |
| 5 | `GET /breed/labrador/images` | Every URL matches `https://images.dog.ceo/breeds/...` |
| 6 | `GET /breed/invalid/images` | Returns 404 with `status: error` |
| 7 | `GET /breeds/image/random` | Returns 200, single valid image URL |
| 8 | `GET /breeds/image/random/3` | Returns array of exactly 3 valid image URLs |

---

## CI/CD – GitHub Actions

The pipeline runs automatically on every push to `main` or `feature/**` branches and on pull requests.

Steps:
1. Install Node.js + dependencies
2. Install Playwright Chromium browser
3. Run web tests
4. Run API tests
5. Upload HTML report as a build artifact (retained for 30 days)

You can trigger it manually via **Actions → QA Automation Tests → Run workflow**.
