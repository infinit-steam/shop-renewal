"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type FlatProduct } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

type Props = { product: FlatProduct };

export default function ProductRow({ product }: Props) {
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
    <div className="flex items-stretch border-b border-gray-200 hover:bg-blue-50 transition-colors">

      {/* 썸네일 */}
      <div className="flex-shrink-0 w-[90px] h-[90px] border-r border-gray-100 relative overflow-hidden bg-gray-100">
        <Image
          src={product.thumbnail}
          alt={product.productName}
          fill
          className="object-contain p-1"
          sizes="90px"
          unoptimized
        />
      </div>

      {/* 기종명 */}
      <div className="flex-shrink-0 w-[180px] flex items-center px-3 border-r border-gray-100">
        <p className="text-xs text-gray-600 leading-snug">{product.modelName}</p>
      </div>

      {/* 상품명 */}
      <div className="flex-1 flex items-center px-3 border-r border-gray-100 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {product.productName}
          {product.isReturnRestricted && (
            <span className="ml-1 text-red-500 text-xs font-normal whitespace-nowrap">
              *단순변심 반품불가상품*
            </span>
          )}
        </p>
      </div>

      {/* 가격 */}
      <div className="flex-shrink-0 w-[150px] flex flex-col items-center justify-center border-r border-gray-100 px-2 gap-0.5">
        {user ? (
          <>
            <span className="text-[11px] text-gray-400">{product.priceText}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {product.priceOriginal.toLocaleString()}원
              </span>
            )}
            <span className="text-base font-bold text-blue-700">
              {product.priceMember.toLocaleString()}원
            </span>
            {hasDiscount && product.priceDiscount > 0 && (
              <span className="text-[11px] text-red-500">
                ({product.priceDiscount.toLocaleString()}원 할인)
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400 text-center leading-snug">
            회원전용<br />
            <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => router.push("/login")}>
              로그인 후 확인
            </span>
          </span>
        )}
      </div>

      {/* 장바구니 */}
      <div className="flex-shrink-0 w-[120px] flex items-center justify-center px-2">
        <button
          onClick={handleAddToCart}
          className={`text-xs font-semibold px-3 py-2 rounded border transition-colors whitespace-nowrap
            ${added
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-blue-700 border-blue-700 hover:bg-blue-700 hover:text-white"
            }`}
        >
          {added ? "담겼습니다 ✓" : "장바구니 담기 +"}
        </button>
      </div>
    </div>
  );
}
