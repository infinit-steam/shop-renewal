"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { addRecent } from "@/lib/recentProducts";

type Detail = {
  id: string;
  categorySlug: string;
  productIdx: string;
  modelName: string;
  productName: string;
  thumbnail: string;
  isReturnRestricted: boolean;
  outOfStock: boolean;
  prices: { original: number; member: number; discount: number; label: string } | null;
};

export default function ProductDetailClient({ product }: { product: Detail }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItems } = useCart();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    addRecent({ id: product.id, productName: product.productName, thumbnail: product.thumbnail });
  }, [product.id, product.productName, product.thumbnail]);

  const prices = product.prices;
  const canBuy = !product.outOfStock && !busy;
  const total = prices ? prices.member * qty : 0;
  const hasDiscount = !!prices && prices.original > prices.member;

  const setQtySafe = (n: number) => setQty(Math.max(1, Math.min(999, Number.isFinite(n) ? n : 1)));

  const add = async (): Promise<boolean> => {
    if (!user || !prices) {
      router.push("/login");
      return false;
    }
    setBusy(true);
    try {
      await addItems([
        {
          productId: product.id,
          quantity: qty,
          productName: product.productName,
          modelName: product.modelName,
          price: prices.member,
          thumbnail: product.thumbnail,
        },
      ]);
      return true;
    } finally {
      setBusy(false);
    }
  };

  const onCart = async () => {
    if (await add()) {
      setNotice("장바구니에 담았습니다.");
      setTimeout(() => setNotice(null), 3000);
    }
  };
  const onBuy = async () => {
    if (await add()) router.push("/cart");
  };

  const row = "flex gap-3 py-3 border-b border-slate-200 text-sm";
  const th = "w-20 md:w-28 flex-shrink-0 text-slate-500";

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
      <div className="grid md:grid-cols-[300px_1fr] gap-5 md:gap-8">
        {/* Image */}
        <div>
          <div className="relative w-full max-w-[420px] mx-auto aspect-square bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <ProductImage src={product.thumbnail} alt={product.productName} fill className="object-contain" sizes="(min-width:768px) 300px, 90vw" />
            {product.outOfStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-lg font-bold text-red-600">품절</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold text-slate-900 leading-snug pb-3 border-b border-slate-300">
            {product.productName}
            {product.isReturnRestricted && <span className="ml-1.5 text-xs font-normal text-red-500">*반품불가*</span>}
          </h1>

          <div className={row}>
            <span className={th}>모델</span>
            <span className="text-slate-700 min-w-0 break-words">{product.modelName}</span>
          </div>
          {product.productIdx && !product.productIdx.startsWith("manual-") && (
            <div className={row}>
              <span className={th}>상품코드</span>
              <span className="text-slate-700">{product.productIdx}</span>
            </div>
          )}

          <div className={`${row} items-center`}>
            <span className={`${th} font-bold text-rose-600 text-base`}>회원가</span>
            {prices ? (
              <span className="flex flex-wrap items-baseline gap-x-2">
                {hasDiscount && <span className="text-xs text-slate-400 line-through">{prices.original.toLocaleString()}원</span>}
                <strong className="text-xl text-rose-600">{prices.member.toLocaleString()}원</strong>
                {hasDiscount && prices.discount > 0 && <span className="text-xs text-rose-500">({prices.discount.toLocaleString()}원 할인)</span>}
              </span>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:underline">
                회원전용 · 로그인 후 확인
              </Link>
            )}
          </div>

          <div className={row}>
            <span className={th}>배송방법</span>
            <span className="text-slate-700">택배</span>
          </div>

          <div className={`${row} items-center`}>
            <span className={th}>수량</span>
            <div className="flex items-center">
              <button
                type="button"
                aria-label="수량 감소"
                onClick={() => setQtySafe(qty - 1)}
                disabled={qty <= 1}
                className="w-9 h-9 border border-slate-300 rounded-l text-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={qty}
                onChange={(e) => setQtySafe(parseInt(e.target.value, 10))}
                className="w-16 h-9 border-y border-slate-300 text-center text-sm focus:outline-none"
                aria-label="수량"
              />
              <button
                type="button"
                aria-label="수량 증가"
                onClick={() => setQtySafe(qty + 1)}
                className="w-9 h-9 border border-slate-300 rounded-r text-lg text-slate-600 hover:bg-slate-50"
              >
                +
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-red-500 leading-relaxed">
            재고수량은 실시간 차감되어 오차가 발생할 수 있는점 양해바랍니다.
          </p>

          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">총 상품금액<span className="font-normal text-slate-500">(수량)</span></span>
            <span className="text-lg md:text-xl font-bold text-rose-600">
              {prices ? `${total.toLocaleString()}원` : "회원전용"} <span className="text-sm">({qty}개)</span>
            </span>
          </div>

          {notice && (
            <p role="status" className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center justify-between">
              {notice}
              <Link href="/cart" className="font-semibold underline">장바구니 보기</Link>
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onBuy}
              disabled={!canBuy}
              className="py-3 rounded-lg bg-slate-900 text-white font-bold text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {product.outOfStock ? "품절" : "바로구매하기"}
            </button>
            <button
              type="button"
              onClick={onCart}
              disabled={!canBuy}
              className="py-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-bold text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              장바구니
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
