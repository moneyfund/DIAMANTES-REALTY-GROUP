(function () {
  function isPublicProperty(property = {}) {
    const approved =
      property.publicationStatus === "approved" &&
      property.publicVisible === true;

    const legacy =
      property.publicationStatus === undefined &&
      property.publicVisible === undefined;

    return approved || legacy;
  }

  window.inmoPublicPropertyFilter = {
    isPublicProperty
  };
})();
