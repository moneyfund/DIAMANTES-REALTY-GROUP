(function initImageUtils(globalScope) {
  const PLACEHOLDER = 'assets/placeholder.svg';

  function isValidHttpUrl(value) {
    try {
      const parsed = new URL(String(value || '').trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function normalizeImageList(values = []) {
    const unique = new Set();

    return (Array.isArray(values) ? values : [values])
      .map((item) => String(item || '').trim())
      .filter((item) => {
        if (!item || unique.has(item) || !isValidHttpUrl(item)) return false;
        unique.add(item);
        return true;
      });
  }

  function getPropertyImages(property = {}) {
    return normalizeImageList([
      ...(Array.isArray(property.images) ? property.images : []),
      ...(Array.isArray(property.imageUrls) ? property.imageUrls : []),
      ...(Array.isArray(property.imagenes) ? property.imagenes : []),
      property.coverImage,
      property.mainImage,
      property.imageUrl,
      property.image,
      property.imagen
    ]);
  }

  function getCoverImage(property = {}) {
    const images = getPropertyImages(property);
    if (!images.length) return PLACEHOLDER;

    const explicitCover = String(property.coverImage || '').trim();
    return images.includes(explicitCover) ? explicitCover : images[0];
  }

  function getPropertyPhotoUrls(property = {}) {
    const images = getPropertyImages(property);
    const cover = getCoverImage(property);
    const coverImage = cover === PLACEHOLDER ? '' : cover;
    const orderedImages = coverImage ? [coverImage, ...images.filter((image) => image && image !== coverImage)] : images;
    const galleryImages = orderedImages.filter((image) => image && image !== coverImage);

    return { coverImage, galleryImages, orderedImages };
  }

  globalScope.inmoImageUtils = {
    PLACEHOLDER,
    isValidHttpUrl,
    normalizeImageList,
    getPropertyImages,
    getCoverImage,
    getPropertyPhotoUrls
  };
})(window);
