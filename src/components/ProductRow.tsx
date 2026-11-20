"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FlatProduct } from "@/data/mockData";
import { addRecent } from "@/lib/recentProducts";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductImage from "@/components/ProductImage";
import QuantityInput from "@/components/QuantityInput";

type Props = {
  product: FlatProduct;
  onQuantityChange?: (productId: string, quantity: number) => void;
  isSelected?: boolean;
  onSelectChange?: (productId: string, selected: boolean) => void;
};

export default function ProductRow({
  product,
  onQuantityChange,
  isSelected = false,
  onSelectChange,
}: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(0);

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    if (onQuantityChange) onQuantityChange(product.id, newQty);
    if (newQty > 0 && onSelectChange && !isSelected) onSelectChange(product.id, true);
    if (newQty === 0 && onSelectChange && isSelected) onSelectChange(product.id, false);
  };

  const handleAddToCart = async () => {
    if (!user) { router.push("/login"); return; }
    addRecent({ id: product.id, productName: product.productName, thumbnail: product.thumbnail });
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

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelectChange) onSelectChange(product.id, checked);
    if (checked && quantity === 0) handleQuantityChange(1);
    if (!checked && quantity > 0) handleQuantityChange(0);
  };

  const hasDiscount = product.priceOriginal > 0 && product.priceOriginal > product.priceMember;
  const outOfStock = product.outOfStock;

  return (
    <div className="flex border-b border-gray-200 hover:bg-slate-50 transition-colors">
      {/* Checkbox */}
      <div className="flex-shrink-0 w-[50px] flex items-center justify-center border-r border-gray-100">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          disabled={outOfStock}
          className="w-4 h-4 text-blue-700 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-40"
          aria-label={`${product.productName} 선택`}
        />
      </div>

      {/* Thumbnail */}
      <Link href={`/product/${product.id}`} className="flex-shrink-0 w-[72px] h-[72px] md:w-[90px] md:h-[90px] border-r border-gray-100 relative overflow-hidden bg-gray-50 block">
        <ProductImage
          src={product.thumbnail}
          alt={product.productName}
          fill
          className="object-contain p-1"
          sizes="90px"
        />
      </Link>

      {/* ── Mobile layout ─────────────────────────────────── */}
      <div className="md:hidden flex-1 px-3 py-2 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-xs text-slate-500 truncate">{product.modelName}</p>
          <Link href={`/product/${product.id}`} className="block text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mt-0.5 hover:text-indigo-700">
            {product.productName}
            {product.isReturnRestricted && (
              <span className="text-red-500 text-[10px] font-normal ml-1">*반품불가*</span>
            )}
            {outOfStock && (
              <span className="text-red-500 text-[10px] font-normal ml-1">*품절*</span>
            )}
          </Link>
        </div>
        <div className="flex items-center justify-between mt-2">
          {user ? (
            <span className="text-sm font-bold text-indigo-700">
              {product.priceMember.toLocaleString()}원
            </span>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-xs text-indigo-600 hover:underline"
            >
              로그인 후 확인
            </button>
          )}
          <QuantityInput
            initialQuantity={quantity}
            onChange={handleQuantityChange}
            disabled={outOfStock || !user}
            max={999}
          />
        </div>
      </div>

      {/* ── Desktop layout ────────────────────────────────── */}
      <div className="hidden md:flex flex-1 items-stretch min-w-0">
        {/* 기종명 */}
        <div className="flex-shrink-0 w-[180px] flex items-center px-3 border-r border-gray-100">
          <p className="text-xs text-gray-600 leading-snug">{product.modelName}</p>
        </div>

        {/* 상품명 */}
        <div className="flex-1 flex items-center px-3 border-r border-gray-100 min-w-0">
          <Link href={`/product/${product.id}`} className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-indigo-700">
            {product.productName}
            {product.isReturnRestricted && (
              <span className="ml-1 text-red-500 text-xs font-normal whitespace-nowrap">
                *단순변심 반품불가상품*
              </span>
            )}
            {outOfStock && (
              <span className="ml-1 text-red-500 text-xs font-normal whitespace-nowrap">
                *품절*
              </span>
            )}
          </Link>
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
              <span
                className="text-blue-600 hover:underline cursor-pointer"
                onClick={() => router.push("/login")}
              >
                로그인 후 확인
              </span>
            </span>
          )}
        </div>

        {/* 수량/장바구니 */}
        <div className="flex-shrink-0 w-[180px] flex items-center justify-center px-2">
          {user ? (
            <QuantityInput
              initialQuantity={quantity}
              onChange={handleQuantityChange}
              disabled={outOfStock}
              max={999}
            />
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-xs text-blue-600 hover:underline"
            >
              로그인 후 수량 설정
            </button>
          )}
        </div>
      </div>
    </div>
  );
}