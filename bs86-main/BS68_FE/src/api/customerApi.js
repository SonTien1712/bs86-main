import { getApiBaseUrl } from '../config/runtime';

const API_BASE_URL = getApiBaseUrl();
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

import axiosClient from './axiosClient';
import { getCurrentUserId, getStoredToken, normalizeUserId, parseAuthFromToken } from "../utils/auth";

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? null;
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP error ${response.status}`);
    error.status = response.status;
    error.errors = data?.errors;
    throw error;
  }
  return data;
}

function requireUserId(value, message) {
  const userId = normalizeUserId(value);

  if (userId === null) {
    throw new Error(message);
  }

  return userId;
}

function getAuthenticatedUserId() {
  return requireUserId(
    getCurrentUserId(parseAuthFromToken()),
    'Authenticated user ID is unavailable. Please sign in again.'
  );
}

export async function getCurrentCustomerProfile(userId = null) {
  const authUserId = requireUserId(
    userId ?? getCurrentUserId(parseAuthFromToken()),
    'Authenticated user ID is unavailable. Please sign in again.'
  );

  const response = await axiosClient.get('/api/customer-profile', {
    headers: {
      'X-User-Id': String(authUserId)
    }
  });

  return unwrapResponse(response);
}

export async function getProfile(userId) {
  const profileUserId = requireUserId(userId, 'Profile user ID is required.');
  const authUserId = getAuthenticatedUserId();

  const response = await fetch(`${API_BASE_URL}/customer-profile/${profileUserId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(authUserId),
      'Authorization': `Bearer ${getStoredToken()}`
    },
  });
  return handleResponse(response);
}

export async function createProfile(profileData) {
  const authUserId = getAuthenticatedUserId();
  const bodyUserId = requireUserId(
    profileData?.userId ?? authUserId,
    'Authenticated user ID is required to create a profile.'
  );

  const response = await fetch(`${API_BASE_URL}/customer-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(authUserId),
      'Authorization': `Bearer ${getStoredToken()}`
    },
    body: JSON.stringify({
      ...profileData,
      userId: bodyUserId
    }),
  });
  return handleResponse(response);
}

export async function updateProfile(userId, profileData) {
  const authUserId = getAuthenticatedUserId();
  const bodyUserId = requireUserId(
    profileData?.userId ?? authUserId,
    'Authenticated user ID is required to update a profile.'
  );

  const response = await fetch(`${API_BASE_URL}/customer-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(authUserId),
      'Authorization': `Bearer ${getStoredToken()}`
    },
    body: JSON.stringify({
      ...profileData,
      userId: bodyUserId
    }),
  });
  return handleResponse(response);
}

export async function deleteProfile(userId) {
  const authUserId = getAuthenticatedUserId();

  const response = await fetch(`${API_BASE_URL}/customer-profile`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(authUserId),
      'Authorization': `Bearer ${getStoredToken()}`
    },
  });
  if (response.status === 204) return;
  return handleResponse(response);
}

export async function uploadToCloudinary(file, userId) {
  const authUserId = requireUserId(
    userId ?? getCurrentUserId(parseAuthFromToken()),
    'User ID is required for avatar upload'
  );
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/customer-profile/avatar`, {
    method: 'POST',
    headers: {
      'X-User-Id': String(authUserId),
      'Authorization': `Bearer ${getStoredToken()}`
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const url = await response.text();
  return url;
}

export const profileApi = {
  getCurrentCustomerProfile,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  uploadToCloudinary,
}
