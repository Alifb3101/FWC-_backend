# FWC Watches Admin Product API Guide

This guide covers create, update, delete, list, and media upload flows for products.

## Base
- Base URL: {API_BASE_URL}/admin
- Auth: Authorization: Bearer <JWT>
- Roles allowed: SUPER_ADMIN, ADMIN (STAFF can read)

## Product Create
- Method: POST /admin/products
- Content-Type: application/json

### Request Body
{
  "name": "Casio MTP/LTP-1314SG-1A",
  "slug": "casio-mtp-ltp-1314sg-1a",
  "sku": "MTP-LTP-1314SG-1A",
  "modelNumber": "MTP/LTP-1314SG-1A",
  "modelName": "MTP/LTP-1314SG-1A",
  "shortDescription": "Short summary",
  "description": "Full description",
  "brandId": 1,
  "categoryId": 2,
  "price": 499,
  "salePrice": 449,
  "originalPrice": 599,
  "currency": "AED",
  "stock": 20,
  "gender": "Unisex",
  "movement": "Quartz",
  "bandMaterial": "Stainless Steel",
  "bandColor": "Silver/Gold",
  "strapLength": "200 mm",
  "dialColor": "Black",
  "dialType": "Analog",
  "dialShape": "Round",
  "caseSizeDiameter": "46 mm",
  "whatsInTheBox": "2x Watch, Manual",
  "strapMaterial": "Stainless Steel",
  "caseMaterial": "Stainless Steel",
  "waterResistance": "50m",
  "warranty": "1 year",
  "videoUrl": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/video.mp4",
  "isFeatured": false,
  "isBestSeller": false,
  "isPublished": true,
  "isActive": true,
  "metaTitle": "SEO title",
  "metaDescription": "SEO description",
  "thumbnail": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/main.webp",
  "images": [
    "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/main.webp",
    "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/gallery-1.webp"
  ],
  "tags": ["classic", "metal"]
}

### Response (success)
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Casio MTP/LTP-1314SG-1A",
    "slug": "casio-mtp-ltp-1314sg-1a",
    "sku": "MTP-LTP-1314SG-1A",
    "modelNumber": "MTP/LTP-1314SG-1A",
    "shortDescription": "Short summary",
    "description": "Full description",
    "brandId": 1,
    "categoryId": 2,
    "price": 499,
    "salePrice": 449,
    "originalPrice": 599,
    "currency": "AED",
    "stock": 20,
    "thumbnail": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/main.webp",
    "videoUrl": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/video.mp4",
    "tags": ["classic", "metal"],
    "seoTitle": "SEO title",
    "seoDescription": "SEO description",
    "gender": "Unisex",
    "movement": "Quartz",
    "bandMaterial": "Stainless Steel",
    "bandColor": "Silver/Gold",
    "strapLength": "200 mm",
    "dialColor": "Black",
    "dialType": "Analog",
    "dialShape": "Round",
    "caseSizeDiameter": "46 mm",
    "whatsInTheBox": "2x Watch, Manual",
    "strapMaterial": "Stainless Steel",
    "caseMaterial": "Stainless Steel",
    "waterResistance": "50m",
    "warranty": "1 year",
    "isFeatured": false,
    "isBestSeller": false,
    "isPublished": true,
    "isActive": true,
    "createdAt": "2026-04-21T10:00:00.000Z",
    "updatedAt": "2026-04-21T10:00:00.000Z",
    "images": [
      { "url": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/main.webp", "sortOrder": 0 },
      { "url": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/gallery-1.webp", "sortOrder": 1 }
    ]
  }
}

## Product Update
- Method: PATCH /admin/products/:id
- Content-Type: application/json
- Body: same fields as create, all optional

### Response (success)
Same shape as create response.

## Product Delete
- Method: DELETE /admin/products/:id
- Response:
{
  "success": true,
  "data": { "id": 123 }
}

## Product List (Admin)
- Method: GET /admin/products
- Query params: page, limit, search, brandId, categoryId, status, isPublished, isActive, sortBy, sortOrder
- Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "name": "Casio MTP/LTP-1314SG-1A",
        "slug": "casio-mtp-ltp-1314sg-1a",
        "thumbnail": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/main.webp",
        "price": 499,
        "stock": 20
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1000, "totalPages": 50 }
  }
}

## Product Details (Admin)
- Method: GET /admin/products/:id
- Response: same shape as create response.

## Media Upload - Images (R2)
- Method: POST /admin/media/products/:slug/images
- Content-Type: multipart/form-data
- Field: files (1 to 6 images)
- Allowed: image/jpeg, image/png, image/webp
- Response:
{
  "success": true,
  "data": {
    "replace": true,
    "urls": [
      "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/main.webp",
      "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/gallery-1.webp"
    ]
  }
}

## Media Upload - Video (R2)
- Method: POST /admin/media/products/:slug/video
- Content-Type: multipart/form-data
- Field: file (mp4 or webm)
- Response:
{
  "success": true,
  "data": {
    "url": "https://media.mydomain.com/products/casio-mtp-ltp-1314sg-1a/video.mp4"
  }
}

## Recommended Implementation Flow (Admin UI)
1) Upload images to /admin/media/products/:slug/images
2) Upload video to /admin/media/products/:slug/video
3) Create product with images[] and videoUrl using the returned CDN URLs
4) On edit, re-upload if media changes, then PATCH the product with new URLs

## Notes
- All specification fields are optional and nullable.
- images max 6.
- videoUrl is optional.
- Use clean SEO-friendly slugs for stable CDN paths.
