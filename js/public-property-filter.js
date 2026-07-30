(function () {
  function isPublicProperty(property = {}) {
    const hasPublicVisibility = !property.visibility || property.visibility === 'public';
    const approved =
      property.publicationStatus === "approved" &&
      property.publicVisible === true;

    const legacy =
      property.publicationStatus === undefined &&
      property.publicVisible === undefined;

    return hasPublicVisibility && (approved || legacy);
  }

  function getVisibility(property = {}) {
    return ['public', 'agents', 'private'].includes(property.visibility) ? property.visibility : 'public';
  }

  window.inmoPublicPropertyFilter = {
    isPublicProperty,
    getVisibility
  };
})();
