Deno.serve(async (req) => {
  const url = new URL(req.url);
  const page = url.searchParams.get('page') || 'home';
  const productId = url.searchParams.get('id');

  // Default meta tags
  let title = 'Dragonfly - Premium Cannabis Delivery';
  let description = 'Explore our curated selection of premium cannabis products. Fast delivery, exceptional quality, always discreet.';
  let imageUrl = 'https://images.unsplash.com/photo-1587579286550-d42fcad93ec2?w=1600&q=80';
  let redirectUrl = `${url.origin}`;

  // Customize based on page
  if (page === 'product' && productId) {
    redirectUrl = `${url.origin}/?page=ProductDetail&id=${productId}`;
    title = 'Premium Cannabis Product - Dragonfly';
    description = 'Check out this premium cannabis product from Dragonfly';
  } else if (page === 'shop') {
    redirectUrl = `${url.origin}/?page=Shop`;
    title = 'Shop - Dragonfly';
    description = 'Browse our premium cannabis products. High-quality flower, edibles, concentrates, and more.';
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${req.url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${req.url}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- iMessage / WhatsApp -->
  <meta property="og:site_name" content="Dragonfly">
  <meta property="og:image:alt" content="${title}">
  
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      font-family: system-ui, -apple-system, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh;
      background: linear-gradient(to bottom right, #d1fae5, #ffffff);
    }
    .container {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 { color: #064e3b; margin: 0 0 10px; }
    p { color: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Dragonfly</h1>
    <p>Redirecting...</p>
  </div>
  <script>
    setTimeout(() => {
      window.location.href = "${redirectUrl}";
    }, 100);
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
});