import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { url } = await req.json();

    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url);
    const html = await response.text();

    // Extract image URLs using regex
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const images = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const imgUrl = match[1];
      
      // Skip data URLs, SVGs, and very small images
      if (imgUrl.startsWith('data:') || imgUrl.endsWith('.svg') || imgUrl.includes('1x1') || imgUrl.includes('placeholder')) {
        continue;
      }

      // Convert relative URLs to absolute
      let fullUrl = imgUrl;
      if (imgUrl.startsWith('//')) {
        fullUrl = 'https:' + imgUrl;
      } else if (imgUrl.startsWith('/')) {
        const urlObj = new URL(url);
        fullUrl = urlObj.origin + imgUrl;
      } else if (!imgUrl.startsWith('http')) {
        const urlObj = new URL(url);
        fullUrl = urlObj.origin + '/' + imgUrl;
      }

      images.push(fullUrl);
    }

    // Also look for background images in style attributes
    const bgImgRegex = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/g;
    while ((match = bgImgRegex.exec(html)) !== null) {
      const bgUrl = match[1];
      if (!bgUrl.startsWith('data:') && !bgUrl.endsWith('.svg')) {
        let fullUrl = bgUrl;
        if (bgUrl.startsWith('//')) {
          fullUrl = 'https:' + bgUrl;
        } else if (bgUrl.startsWith('/')) {
          const urlObj = new URL(url);
          fullUrl = urlObj.origin + bgUrl;
        } else if (!bgUrl.startsWith('http')) {
          const urlObj = new URL(url);
          fullUrl = urlObj.origin + '/' + bgUrl;
        }
        images.push(fullUrl);
      }
    }

    // Remove duplicates
    const uniqueImages = [...new Set(images)];

    return Response.json({ 
      success: true, 
      images: uniqueImages,
      count: uniqueImages.length
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});