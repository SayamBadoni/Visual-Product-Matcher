// NoResultFound.jsx
import React from 'react';

const NoResultFound = ({ initialLoad = false }) => {
  const message = initialLoad
    ? "Upload an image or enter URL to see similar products"
    : "No products found matching your search.";

  return (
    <div className="text-gray-500 py-12 text-center col-span-full">
      <p className="text-lg font-medium">{message}</p>
      {/* Optional: Add an icon or image here */}
    </div>
  );
};

export default NoResultFound;