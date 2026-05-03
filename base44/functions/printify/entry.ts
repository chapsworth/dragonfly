import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PRINTIFY_API_KEY = Deno.env.get("PRINTIFY_API_KEY");
const PRINTIFY_API_URL = "https://api.printify.com/v1";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await req.json();

    const headers = {
      "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
      "Content-Type": "application/json"
    };

    let response;

    switch (action) {
      case 'getShops':
        response = await fetch(`${PRINTIFY_API_URL}/shops.json`, { headers });
        break;

      case 'getProducts':
        const { shopId } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products.json`, { headers });
        break;

      case 'getProduct':
        const { shopId: sid, productId } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${sid}/products/${productId}.json`, { headers });
        break;

      case 'getCatalog':
        response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints.json`, { headers });
        break;

      case 'getBlueprintProviders':
        const { blueprintId } = params;
        response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers.json`, { headers });
        break;

      case 'getBlueprintVariants':
        const { blueprintId: bid, printProviderId } = params;
        response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints/${bid}/print_providers/${printProviderId}/variants.json`, { headers });
        break;

      case 'createProduct':
        const { shopId: createShopId, productData } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${createShopId}/products.json`, {
          method: 'POST',
          headers,
          body: JSON.stringify(productData)
        });
        break;

      case 'updateProduct':
        const { shopId: updateShopId, productId: updateProductId, productData: updateData } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${updateShopId}/products/${updateProductId}.json`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        });
        break;

      case 'deleteProduct':
        const { shopId: deleteShopId, productId: deleteProductId } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${deleteShopId}/products/${deleteProductId}.json`, {
          method: 'DELETE',
          headers
        });
        break;

      case 'publishProduct':
        const { shopId: pubShopId, productId: pubProductId } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${pubShopId}/products/${pubProductId}/publish.json`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true })
        });
        break;

      case 'getOrders':
        const { shopId: orderShopId } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${orderShopId}/orders.json`, { headers });
        break;

      case 'createOrder':
        const { shopId: orderCreateShopId, orderData } = params;
        response = await fetch(`${PRINTIFY_API_URL}/shops/${orderCreateShopId}/orders.json`, {
          method: 'POST',
          headers,
          body: JSON.stringify(orderData)
        });
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const data = await response.json();
    
    if (!response.ok) {
      return Response.json({ error: data.message || 'Printify API error', details: data }, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});