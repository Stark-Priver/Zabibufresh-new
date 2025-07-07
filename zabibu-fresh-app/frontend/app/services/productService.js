import { supabase } from './supabase'; // Assuming supabase client is configured here

// Helper function to handle Supabase responses
const handleSupabaseResponse = (response) => {
  if (response.error) {
    console.error('Supabase error:', response.error.message);
    throw response.error;
  }
  return response.data;
};

// Helper function to simulate image conversion if backend doesn't do it.
// In a real scenario, backend should ideally send base64 or a direct image URL.
// For now, if `image` is an ArrayBuffer or similar, this function would be needed.
// If backend sends base64, this specific conversion might not be needed here.
const convertImageBytesToBase64 = (products) => {
  return products.map(product => {
    if (product.image && product.image.type === 'Buffer') { // Or check for ArrayBuffer etc.
      // This is a placeholder. Actual conversion depends on how Bytes are sent.
      // For example, if it's an array of numbers:
      // const base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(product.image.data)));
      // product.imageBase64 = `data:image/jpeg;base64,${base64String}`;
      // For now, let's assume the backend might send it as a field like `imageUrl` or `imageBase64`
      // or that the `Bytes` type from Prisma is directly usable/serializable in a way that client expects.
      // If Supabase returns it as a string that's already base64, no conversion needed.
      // Let's assume for now 'image' field might contain the base64 string directly from a custom function or view.
    }
    return product;
  });
};


/**
 * Fetches all products.
 * Assumes a Supabase function `get_all_products` or direct table access with RLS.
 * Products should include seller information.
 */
export const getProducts = async () => {
  // Option 1: Calling a Supabase Edge Function
  // const response = await supabase.functions.invoke('get-all-products');
  // return handleSupabaseResponse(response);

  // Option 2: Direct table query (ensure RLS is set up for public access or specific roles)
  // And that 'User' table (sellers) can be joined and selected fields are allowed.
  const response = await supabase
    .from('Product')
    .select(`
      id,
      title,
      description,
      image, // Assuming this is the base64 string or a URL
      price,
      quantity,
      location,
      createdAt,
      seller:User (
        id,
        fullName,
        email,
        phone
      )
    `)
    .order('createdAt', { ascending: false });

  const data = handleSupabaseResponse(response);
  return data ? convertImageBytesToBase64(data) : [];
};

/**
 * Fetches products for a specific seller.
 * Assumes a Supabase function `get_products_by_seller` or direct table access with RLS.
 */
export const getProductsBySeller = async (sellerId) => {
  if (!sellerId) {
    console.error('Seller ID is required to fetch products by seller.');
    return [];
  }
  // Option 1: Calling a Supabase Edge Function
  // const response = await supabase.functions.invoke('get-products-by-seller', { body: { sellerId } });
  // return handleSupabaseResponse(response);

  // Option 2: Direct table query
  const response = await supabase
    .from('Product')
    .select(`
      id,
      title,
      description,
      image,
      price,
      quantity,
      location,
      createdAt,
      seller:User (
        id,
        fullName
      )
    `)
    .eq('sellerId', sellerId)
    .order('createdAt', { ascending: false });

  const data = handleSupabaseResponse(response);
  return data ? convertImageBytesToBase64(data) : [];
};

/**
 * Fetches a single product by its ID.
 * Assumes a Supabase function `get_product_by_id` or direct table access with RLS.
 */
export const getProductById = async (productId) => {
  if (!productId) {
    console.error('Product ID is required to fetch a product.');
    return null;
  }
  // Option 1: Calling a Supabase Edge Function
  // const response = await supabase.functions.invoke('get-product-by-id', { body: { productId } });
  // return handleSupabaseResponse(response);

  // Option 2: Direct table query
  const response = await supabase
    .from('Product')
    .select(`
      id,
      title,
      description,
      image,
      price,
      quantity,
      location,
      createdAt,
      seller:User (
        id,
        fullName,
        email,
        phone
      )
    `)
    .eq('id', productId)
    .single(); // Expecting one row

  const data = handleSupabaseResponse(response);
  if (data && data.image) { // Single product
      const [convertedProduct] = convertImageBytesToBase64([data]);
      return convertedProduct;
  }
  return data;
};


// Placeholder for addProduct - will be implemented in Phase 2
/**
 * Adds a new product.
 * @param {object} productData - The product data (title, description, price, etc.).
 * @param {string | null} imageBase64 - The base64 encoded image string, or null if no image.
 * This will likely call a Supabase Edge Function to handle the image data and insert into Prisma.
 * Storing large base64 strings directly via RPC might hit size limits, Edge functions are better.
 */
export const addProduct = async (productData, imageBase64) => {
  console.log('addProduct called with:', productData, 'Image (first 20 chars):', imageBase64?.substring(0,20));
  // This will be implemented to call a Supabase Edge Function e.g., 'add-product'
  // The Edge Function would handle:
  // 1. Decoding base64 image if necessary.
  // 2. Storing the image bytes.
  // 3. Creating the product record in the database using Prisma.

  // Example structure for invoking an Edge Function:
  /*
  const { data, error } = await supabase.functions.invoke('add-product', {
    body: { ...productData, image: imageBase64 }, // Prisma schema expects 'image' as Bytes
  });

  if (error) {
    console.error('Error adding product:', error.message);
    throw error;
  }
  return data;
  */
  alert('Add product functionality is not fully implemented yet.');
  // For now, let's return a mock success or throw an error for testing UI flow.
  return { id: 'mock-product-id', ...productData, image: imageBase64 ? 'mock_image_path_or_bytes' : null };
};

// Placeholder for updateProduct - will be implemented in Phase 2
/**
 * Updates an existing product.
 * @param {string} productId - The ID of the product to update.
 * @param {object} productData - The product data to update.
 * @param {string | null} imageBase64 - The new base64 encoded image string, or null/undefined if image is not changed.
 */
export const updateProduct = async (productId, productData, imageBase64) => {
  console.log('updateProduct called for:', productId, 'with:', productData, 'Image (first 20 chars):', imageBase64?.substring(0,20));
  // Similar to addProduct, this would ideally call a Supabase Edge Function.
  /*
  const { data, error } = await supabase.functions.invoke('update-product', {
    body: { productId, ...productData, image: imageBase64 },
  });

  if (error) {
    console.error('Error updating product:', error.message);
    throw error;
  }
  return data;
  */
  alert('Update product functionality is not fully implemented yet.');
  return { id: productId, ...productData };
};

// It's also good practice to ensure the RLS policies on your Supabase 'Product' table
// and related 'User' table (for seller info) are correctly configured.
// For example, products should be publicly readable for the catalog,
// but only editable by their respective sellers.
// Seller info (like full name) linked to products should also be readable.
