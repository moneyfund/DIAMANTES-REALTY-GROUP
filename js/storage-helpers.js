import { storage, ref, uploadBytes, getDownloadURL, deleteObject } from './firebase-services.js';

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
