import { test, expect } from '@playwright/test';

/**
 * Test Suite: Dog API – https://dog.ceo/dog-api/documentation
 *
 * Endpoints covered:
 * 1. GET /breeds/list/all
 * 2. GET /breed/{breed}/images
 * 3. GET /breeds/image/random
 */

const IMAGE_URL_PATTERN = /^https:\/\/images\.dog\.ceo\/breeds\/.+\.(jpg|jpeg|png|gif|webp)$/i;

test.describe('Dog API – Breed Endpoints', () => {

  // ------------------------------------------------------------------ //
  // GET /breeds/list/all
  // ------------------------------------------------------------------ //
  test.describe('GET /breeds/list/all', () => {

    test('should return 200 and status "success"', async ({ request }) => {
      const response = await request.get('/breeds/list/all');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('success');
    });

    test('should return a non-empty breeds object', async ({ request }) => {
      const response = await request.get('/breeds/list/all');
      const body = await response.json();

      expect(typeof body.message).toBe('object');
      expect(Object.keys(body.message).length).toBeGreaterThan(0);
    });

    test('should contain well-known breeds', async ({ request }) => {
      const response = await request.get('/breeds/list/all');
      const body = await response.json();

      const breeds: string[] = Object.keys(body.message);
      expect(breeds).toContain('labrador');
      expect(breeds).toContain('husky');
      expect(breeds).toContain('poodle');
    });

    test('should list sub-breeds as arrays', async ({ request }) => {
      const response = await request.get('/breeds/list/all');
      const body = await response.json();

      // Every value must be an array (empty or populated)
      for (const [breed, subBreeds] of Object.entries(body.message)) {
        expect(Array.isArray(subBreeds), `Sub-breeds of "${breed}" should be an array`).toBe(true);
      }
    });
  });

  // ------------------------------------------------------------------ //
  // GET /breed/{breed}/images
  // ------------------------------------------------------------------ //
  test.describe('GET /breed/{breed}/images', () => {

    test('should return 200 and status "success" for a valid breed', async ({ request }) => {
      const response = await request.get('/breed/labrador/images');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('success');
    });

    test('should return a non-empty array of image URLs for a valid breed', async ({ request }) => {
      const response = await request.get('/breed/labrador/images');
      const body = await response.json();

      expect(Array.isArray(body.message)).toBe(true);
      expect(body.message.length).toBeGreaterThan(0);
    });

    test('every image URL should match the expected pattern', async ({ request }) => {
      const response = await request.get('/breed/labrador/images');
      const body = await response.json();

      for (const url of body.message as string[]) {
        expect(url, `Invalid image URL: ${url}`).toMatch(IMAGE_URL_PATTERN);
      }
    });

    test('should return 404 for a non-existent breed', async ({ request }) => {
      const response = await request.get('/breed/breedthatdoesnotexist/images');

      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body.status).toBe('error');
      expect(typeof body.message).toBe('string');
    });

    test('should return images for a breed with sub-breeds', async ({ request }) => {
      // "bulldog" has sub-breeds: boston, english, french
      const response = await request.get('/breed/bulldog/images');

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.message.length).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------------------------------ //
  // GET /breeds/image/random
  // ------------------------------------------------------------------ //
  test.describe('GET /breeds/image/random', () => {

    test('should return 200 and status "success"', async ({ request }) => {
      const response = await request.get('/breeds/image/random');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('success');
    });

    test('should return a valid image URL', async ({ request }) => {
      const response = await request.get('/breeds/image/random');
      const body = await response.json();

      expect(typeof body.message).toBe('string');
      expect(body.message).toMatch(IMAGE_URL_PATTERN);
    });

    test('should return a different image on consecutive calls', async ({ request }) => {
      const [r1, r2] = await Promise.all([
        request.get('/breeds/image/random'),
        request.get('/breeds/image/random'),
      ]);

      const b1 = await r1.json();
      const b2 = await r2.json();

      // Both must be valid; they *may* differ (not guaranteed but likely)
      expect(b1.message).toMatch(IMAGE_URL_PATTERN);
      expect(b2.message).toMatch(IMAGE_URL_PATTERN);
    });

    test('should return a random image from a specific count endpoint', async ({ request }) => {
      const count = 3;
      const response = await request.get(`/breeds/image/random/${count}`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(Array.isArray(body.message)).toBe(true);
      expect(body.message.length).toBe(count);

      for (const url of body.message as string[]) {
        expect(url).toMatch(IMAGE_URL_PATTERN);
      }
    });
  });
});
