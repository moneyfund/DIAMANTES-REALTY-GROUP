import { storage, firebaseConfig, ref, uploadBytes, getDownloadURL, deleteObject } from './firebase-services.js';

export async function uploadImage(file, agentId, propertyId) {
  if (!file) throw new Error('Archivo de imagen no válido.');
  if (!agentId) throw new Error('No se pudo determinar el agente de la propiedad.');
  if (!propertyId) throw new Error('No se pudo determinar la propiedad para la subida de imágenes.');

  const safeName = String(file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  const path = `properties/${agentId}/${propertyId}/${fileName}`;

  const fileRef = ref(storage, path);
  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type || 'image/jpeg'
  });

  const url = await getDownloadURL(snapshot.ref);
  return url;
}


export const LEGAL_DOCUMENT_MAX_SIZE_BYTES = 20 * 1024 * 1024;

export function validateLegalPdf(file) {
  if (!file) return { valid: false, message: 'Selecciona un archivo PDF para la documentación legal.' };

  const fileName = String(file.name || '').trim();
  const isPdfExtension = fileName.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';

  if (!isPdfExtension || !isPdfMime) {
    return { valid: false, message: 'El documento legal debe ser un archivo PDF. No se permiten imágenes, Word, Excel u otros formatos.' };
  }

  if (file.size > LEGAL_DOCUMENT_MAX_SIZE_BYTES) {
    return { valid: false, message: 'El PDF legal no puede superar los 20 MB.' };
  }

  return { valid: true, message: '' };
}

export async function uploadLegalDocument(file, propertyId) {
  const validation = validateLegalPdf(file);
  if (!validation.valid) throw new Error(validation.message);
  if (!propertyId) throw new Error('No se pudo determinar la propiedad para subir el documento legal.');

  const safeName = String(file.name || 'documento-legal.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  const storagePath = `property-legal-documents/${propertyId}/${fileName}`;

  const fileRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(fileRef, file, {
    contentType: 'application/pdf',
    customMetadata: {
      propertyId,
      visibility: 'private'
    }
  });

  const fileUrl = await getDownloadURL(snapshot.ref);
  return { fileName, fileUrl, storagePath };
}

export async function deleteStorageFile(storagePath) {
  if (!storagePath) return;
  await deleteObject(ref(storage, storagePath));
}


export const AGENT_PROFILE_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const AGENT_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateAgentProfilePhoto(file) {
  if (!file) return { valid: false, message: 'Selecciona una imagen en formato JPG, PNG o WEBP.' };
  if (!file.size) return { valid: false, message: 'No fue posible leer el archivo seleccionado.' };
  if (!AGENT_PROFILE_PHOTO_TYPES.includes(file.type)) {
    return { valid: false, message: 'Selecciona una imagen en formato JPG, PNG o WEBP.' };
  }
  if (file.size > AGENT_PROFILE_PHOTO_MAX_SIZE_BYTES) {
    return { valid: false, message: 'La imagen no puede superar los 5 MB.' };
  }
  return { valid: true, message: '' };
}

export async function uploadAgentProfilePhoto(file, userId) {
  const validation = validateAgentProfilePhoto(file);
  if (!validation.valid) throw new Error(validation.message);
  if (!userId) throw new Error('No se pudo identificar tu usuario para subir la foto.');

  const extension = (String(file.name || '').split('.').pop() || file.type.split('/').pop() || 'jpg')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'jpg';
  const storagePath = `agents/${userId}/profile/profile-${Date.now()}.${extension === 'jpeg' ? 'jpg' : extension}`;
  const fileRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(fileRef, file, { contentType: file.type });
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return { downloadUrl, storagePath };
}

export function isCurrentBucketStorageUrl(url = '') {
  const value = String(url || '').trim();
  if (!value) return false;
  const bucket = firebaseConfig.storageBucket;
  return value.startsWith(`gs://${bucket}/`) || value.includes(`/b/${bucket}/o/`) || value.includes(`${bucket}/`);
}

export async function deleteStorageUrlIfOwned(url = '') {
  if (!isCurrentBucketStorageUrl(url)) return false;
  const value = String(url || '').trim();
  try {
    let fileRef;
    if (value.startsWith('gs://')) {
      fileRef = ref(storage, value);
    } else {
      const parsed = new URL(value);
      const encodedPath = parsed.pathname.split('/o/')[1]?.split('?')[0];
      if (!encodedPath) return false;
      fileRef = ref(storage, decodeURIComponent(encodedPath));
    }
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.warn('[Storage] No se pudo eliminar la foto anterior del perfil.', error);
    return false;
  }
}
