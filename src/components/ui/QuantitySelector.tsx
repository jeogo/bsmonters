"use client";

import { useState } from "react";

interface QuantitySelectorProps {
  initialQuantity?: number;
  min?: number;
  max?: number;
  onChange?: (quantity: number) => void;
  className?: string;
}

export default function QuantitySelector({ 
  initialQuantity = 1, 
  min = 1, 
  max = 10,
  onChange,
  className = ""
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialQuantity);

  const handleDecrease = () => {
    if (quantity > min) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onChange?.(newQuantity);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      onChange?.(newQuantity);
    }
  };

  const handleInputChange = (value: string) => {
    const numValue = parseInt(value) || min;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    setQuantity(clampedValue);
    onChange?.(clampedValue);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="text-sm font-medium text-gray-800">الكمية:</label>
      
      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={quantity <= min}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="تقليل الكمية"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <input
          type="number"
          value={quantity}
          onChange={(e) => handleInputChange(e.target.value)}
          min={min}
          max={max}
          className="w-16 h-10 text-center text-lg font-semibold border-none outline-none bg-transparent"
        />

        <button
          type="button"
          onClick={handleIncrease}
          disabled={quantity >= max}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="زيادة الكمية"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      <span className="text-sm text-gray-600">
        (الحد الأقصى: {max})
      </span>
    </div>
  );
}
