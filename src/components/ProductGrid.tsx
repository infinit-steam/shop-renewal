"use client";

import ProductImage from "@/components/ProductImage";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type FlatProduct } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

type Props = { product: FlatProduct };

export default function ProductGrid({ product }: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!user) { router.push("/login"); return; }
    await addItem({
      productId: product.id,
      productName: product.productName,
      modelName: product.modelName,
      price: product.priceMember,
      thumbnail: product.thumbnail,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const hasDiscount = product.priceOriginal > 0 && product.priceOriginal > product.priceMember;

  return (
    <div className="border border-gray-200 rounded bg-white hover:shadow-md transition-shadow flex flex-col">
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden rounded-t">
        <ProductImage
          src={product.thumbnail}
          alt={product.productName}
          fill
          className="object-contain p-2"
          sizes="200px"
        />
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-0.5 truncate">{product.modelName}</p>
        <p className="text-sm font-semibold text-gray-900 leading-snug flex-1 line-clamp-3">
          {product.productName}
          {product.isReturnRestricted && (
            <span className="text-red-500 text-xs font-normal"> *반품불가*</span>
          )}
        </p>
        <div className="mt-2">
          {user ? (
            <>
              <span className="text-[11px] text-gray-400 block">{product.priceText}</span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {product.priceOriginal.toLocaleString()}원
                </span>
              )}
              <div className="flex items-center justify-between mt-0.5">
                <div>
                  <span className="text-sm font-bold text-blue-700">
                    {product.priceMember.toLocaleString()}원
                  </span>
                  {hasDiscount && product.priceDiscount > 0 && (
                    <span className="text-[10px] text-red-500 ml-1">
                      -{product.priceDiscount.toLocaleString()}원
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`text-xs px-2.5 py-1.5 rounded border transition-colors flex-shrink-0
                    ${added
                      ? "bg-green-600 text-white border-green-600"
                      : "text-blue-700 border-blue-700 hover:bg-blue-700 hover:text-white"
                    }`}
                >
                  {added ? "담김 ✓" : "담기 +"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-1 flex items-center justify-between">
              <button
                onClick={() => router.push("/login")}
                className="text-xs text-blue-600 hover:underline"
              >
                로그인 후 가격 확인
              </button>
              <button
                onClick={handleAddToCart}
                className="text-xs px-2.5 py-1.5 rounded border text-blue-700 border-blue-700 hover:bg-blue-700 hover:text-white transition-colors flex-shrink-0"
              >
                담기 +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
