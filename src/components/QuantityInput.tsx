"use client";

import { useState, useEffect } from "react";

type Props = {
  initialQuantity?: number;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
};

export default function QuantityInput({ initialQuantity = 0, min = 0, max = 999, onChange, disabled = false }: Props) {
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  const handleChange = (newQty: number) => {
    const clamped = Math.max(min, Math.min(max, newQty));
    setQuantity(clamped);
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleChange(quantity - 1)}
        disabled={disabled || quantity <= min}
        className="w-7 h-7 border border-gray-300 rounded text-sm flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="수량 감소"
      >
        -
      </button>
      <input
        type="number"
        value={quantity}
        onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
        min={min}
        max={max}
        disabled={disabled}
        className="w-16 text-center border border-gray-300 rounded text-sm py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="수량"
      />
      <button
        onClick={() => handleChange(quantity + 1)}
        disabled={disabled || quantity >= max}
        className="w-7 h-7 border border-gray-300 rounded text-sm flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="수량 증가"
      >
        +
      </button>
    </div>
  );
}