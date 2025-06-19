import React, { useState } from "react";

interface StarRatingProps {
  label?: string;
  initialRating?: number;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  label = "Rating",
  initialRating = 0,
  onChange,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleClick = (value: number) => {
    setRating(value);
    if (onChange) onChange(value);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const value = index + 1;
      const isActive = hovered !== null ? value <= hovered : value <= rating;

      return (
        <svg
          key={value}
          onClick={() => handleClick(value)}
          onMouseEnter={() => setHovered(value)}
          onMouseLeave={() => setHovered(null)}
          className={`w-5 h-5 cursor-pointer transition-colors ${
            isActive ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 22 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 
              1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 
              1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 
              2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 
              2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 
              .387-1.575Z"/>
        </svg>
      );
    });
  };

  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-1">{renderStars()}</div>
    </div>
  );
};

export default StarRating;
