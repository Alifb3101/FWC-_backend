# Brand & Category API Guide (Admin/Frontend)

This guide documents the API endpoints for managing and retrieving brands and categories in the FWC Watches backend. All endpoints are secured and return production-ready, frontend/admin-friendly responses.

---

## Brand API

### 1. Get All Brands
- **Endpoint:** `GET /brands`
- **Query Params:**
  - `limit` (optional, integer, default: 12, min: 1, max: 24): Max number of brands to return.
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Rolex",
      "slug": "rolex",
      "logo": "https://cdn.fwc.com/brands/rolex.png"
    },
    // ...more brands
  ]
}
```
- **Notes:**
  - Only active brands are returned, sorted by name ascending.
  - `logo` is a CDN URL (if present).

---

## Category API

### 1. Get All Categories
- **Endpoint:** `GET /categories`
- **Response:**
```json
[
  {
    "id": 1,
    "name": "Men's Watches",
    "slug": "mens-watches",
    "parentId": null
  },
  {
    "id": 2,
    "name": "Luxury",
    "slug": "luxury",
    "parentId": 1
  }
  // ...more categories
]
```
- **Notes:**
  - Only active categories are returned, sorted by name ascending.
  - `parentId` is `null` for root categories, or the parent category's `id` for subcategories.

---

## Copy-Paste Ready API Reference

### Get All Brands
- **Request:**
```bash
curl -X GET "https://api.fwc.com/brands?limit=12" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Rolex",
      "slug": "rolex",
      "logo": "https://cdn.fwc.com/brands/rolex.png"
    }
    // ...more brands
  ]
}
```

### Get All Categories
- **Request:**
```bash
curl -X GET "https://api.fwc.com/categories" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
- **Response:**
```json
[
  {
    "id": 1,
    "name": "Men's Watches",
    "slug": "mens-watches",
    "parentId": null
  }
  // ...more categories
]
```

> Replace `https://api.fwc.com` with your actual API base URL and `<YOUR_JWT_TOKEN>` with a valid access token.

---

## Integration Notes
- All endpoints are RESTful and return JSON.
- Use the `slug` field for frontend routing/links.
- For product creation/editing, use the `id` of the brand/category.
- For full CRUD (admin), see the respective controller/service for available endpoints (not all are public).
- All media (logos) are served via Cloudflare CDN.

---

For further details, see the code in `src/modules/brands/` and `src/modules/categories/`.
