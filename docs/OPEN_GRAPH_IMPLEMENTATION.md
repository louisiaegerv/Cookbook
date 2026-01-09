# Open Graph Meta Tags Implementation

This document describes the implementation of Open Graph (OG) meta tags for social media sharing previews in the Cookbook application.

## Overview

Open Graph meta tags allow social media platforms (Facebook, Twitter/X, LinkedIn, WhatsApp, etc.) to display rich previews when users share links to recipe and collection pages.

## Implementation

### Recipe Detail Pages

**File:** [`src/app/recipes/[id]/page.tsx`](../src/app/recipes/[id]/page.tsx)

The `generateMetadata` function:

1. Fetches the recipe data including images from the database
2. Selects the first image (sorted by `display_order`) as the preview image
3. Returns metadata object with:
   - Standard HTML meta tags (`title`, `description`)
   - Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`)
   - Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

### Collection Detail Pages

**File:** [`src/app/collections/[id]/layout.tsx`](../src/app/collections/[id]/layout.tsx)

The `generateMetadata` function:

1. Fetches the collection data including recipes and their images
2. Selects the first image from the first recipe as the preview image
3. Returns metadata object with the same structure as recipe pages

## Environment Variables

The implementation uses the `NEXT_PUBLIC_APP_URL` environment variable to construct absolute URLs for the OG tags.

**File:** [`.env.example`](../.env.example)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update this to your actual domain:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Image Requirements

### Recommended Dimensions

- **Width:** 1200 pixels
- **Height:** 630 pixels
- **Aspect Ratio:** 1.91:1

### Image Accessibility

- Ensure recipe images stored in Supabase Storage are publicly accessible
- The bucket should have public read permissions
- Alternatively, use signed URLs with appropriate caching headers

## Testing

### Facebook Sharing Debugger

1. Visit: https://developers.facebook.com/tools/debug/
2. Enter a recipe or collection URL
3. Click "Debug" to see how Facebook will display the link
4. Use "Scrape Again" to refresh the preview after making changes

### Twitter Card Validator

1. Visit: https://cards-dev.twitter.com/validator
2. Enter a recipe or collection URL
3. Click "Preview card" to see how Twitter will display the link

### LinkedIn Post Inspector

1. Visit: https://www.linkedin.com/post-inspector/
2. Enter a recipe or collection URL
3. Click "Inspect" to see how LinkedIn will display the link

### General Testing

- Share a link on social media platforms directly
- Test in messaging apps (WhatsApp, Telegram, Slack, etc.)
- Test on different devices (mobile, desktop)

## Fallback Behavior

If a recipe or collection doesn't have any images:

- The OG tags will be generated without an image
- Social media platforms will display a generic preview or no preview
- You can add a default fallback image by modifying the metadata function:

```typescript
const fallbackImage = `${siteUrl}/og-default.png`;

images: firstImage
  ? [{ url: firstImage, width: 1200, height: 630, alt: recipe.title }]
  : [{ url: fallbackImage, width: 1200, height: 630, alt: "Cookbook" }];
```

## Troubleshooting

### Images Not Showing

1. **Check image URLs:** Ensure image URLs are publicly accessible
2. **Verify storage permissions:** Check Supabase Storage bucket policies
3. **Test image URL:** Open the image URL directly in a browser
4. **Check CDN caching:** If using a CDN, ensure images are properly cached

### Outdated Previews

1. **Force refresh:** Use the "Scrape Again" button in Facebook Sharing Debugger
2. **Clear cache:** Social media platforms cache previews for 24-48 hours
3. **Update timestamps:** Some platforms use the page's last modified timestamp

### Incorrect Image Aspect Ratio

1. **Resize images:** Ensure images match the recommended 1200x630 dimensions
2. **Use image optimization:** Consider using an image optimization service
3. **Test multiple images:** Try different images to see which displays best

## Future Enhancements

- Add a default OG image for recipes/collections without images
- Implement dynamic image generation with text overlays
- Add support for additional OG tags (e.g., `og:locale`, `og:locale:alternate`)
- Implement structured data (JSON-LD) for better SEO
- Add support for multiple images in OG tags
- Implement image optimization and CDN integration

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
