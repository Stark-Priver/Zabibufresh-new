import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

/**
 * Upload image to Supabase Storage (free tier includes 1GB storage)
 */
export const uploadImage = async (imageUri, fileName) => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const response = await fetch(`data:image/jpeg;base64,${base64}`);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`products/${fileName}`, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${fileName}`);

    return { 
      success: true, 
      data: { 
        path: data.path, 
        publicUrl 
      } 
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete image from Supabase Storage
 */
export const deleteImage = async (imagePath) => {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([imagePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate unique filename for images
 */
export const generateImageFileName = (userId, originalName = 'image') => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'jpg';
  return `${userId}_${timestamp}.${extension}`;
};