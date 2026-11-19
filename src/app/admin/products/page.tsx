"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

type Product = {
  id: string; categorySlug: string; productIdx: string;
  modelName: string; productName: string;
  price: number; priceOriginal: number; priceMember: number; priceDiscount: number;
  thumbnail: string; visible: boolean; outOfStock: boolean;
};
type Category = { id: string; slug: string; name: string; depth1: string; depth2: string };

const LIMIT = 50;

export default function AdminProducts() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [loading, setLoading]         = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [editData, setEditData]       = useState<Partial<Product>>({});
  const [showAdd, setShowAdd]         = useState(false);
  const [newProd, setNewProd]         = useState<Partial<Product>>({ visible: true, outOfStock: false });
  const [importMsg, setImportMsg]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p), limit: String(LIMIT),
      search, category, stock: stockFilter,
    });
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.products);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search, category, stockFilter]);

  useEffect(() => { fetch("/api/admin/categories").then((r) => r.json()).then(setCategories); }, []);
  useEffect(() => { fetchProducts(1); setPage(1); }, [search, category, stockFilter]); // eslint-disable-line
  useEffect(() => { fetchProducts(page); }, [page]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchProducts(1); setPage(1); };

  const saveEdit = async (id: string) => {
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setEditId(null);
    fetchProducts(page);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    fetchProducts(page);
  };

  const addProduct = async () => {
    const res = await fetch("/api/admin/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProd),
    });
    if (res.ok) { setShowAdd(false); setNewProd({ visible: true, outOfStock: false }); fetchProducts(1); setPage(1); }
    else { const d = await res.json(); alert(d.error); }
  };

  const exportCSV = () => {
    const params = new URLSearchParams({ search, category });
    window.location.href = `/api/admin/products/export?${params}`;
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await fetch("/api/admin/products/import", {
      method: "POST", headers: { "Content-Type": "text/plain" }, body: text,
    });
    const d = await res.json();
    setImportMsg(`✓ ${d.updated}개 업데이트 완료${d.errors?.length ? ` (오류 ${d.errors.length}건)` : ""}`);
    fetchProducts(page);
    if (fileRef.current) fileRef.current.value = "";
  };

  const d1Groups = Array.from(new Set(categories.map((c) => c.depth1)));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">검색 (기종명 / 상품명 / 모델코드)</label>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="검색어 입력..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">카테고리</label>
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">전체</option>
              {d1Groups.map((g) => (
                <optgroup key={g} label={g}>
                  {categories.filter((c) => c.depth1 === g).map((c) => (
                    <option key={c.id} value={c.slug}>{c.depth2 || c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">재고</label>
            <select
              value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">전체</option>
              <option value="in">재고 있음</option>
              <option value="out">품절</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800">
            검색
          </button>
          <button type="button" onClick={() => setShowAdd(true)}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
            + 상품 등록
          </button>
          <button type="button" onClick={exportCSV}
            className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">
            CSV 다운로드
          </button>
          <label className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50 cursor-pointer">
            CSV 업로드
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          </label>
        </form>
        {importMsg && <p className="mt-2 text-xs text-green-700">{importMsg}</p>}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>전체 <strong className="text-blue-700">{total.toLocaleString()}</strong>개 중 {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)}번</span>
        <div className="flex gap-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50">
            ◀ 이전
          </button>
          <span className="px-3 py-1.5 text-xs text-gray-600">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50">
            다음 ▶
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 sticky top-0">
                <tr>
                  {["이미지","기종명","상품명","카테고리","회원가","정가","품절","노출","편집"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="relative w-10 h-10 bg-gray-100 rounded overflow-hidden">
                        {p.thumbnail && (
                          <Image src={p.thumbnail} alt="" fill className="object-contain p-0.5" unoptimized />
                        )}
                      </div>
                    </td>

                    {editId === p.id ? (
                      <>
                        <td className="px-3 py-2">
                          <input value={editData.modelName ?? p.modelName}
                            onChange={(e) => setEditData({ ...editData, modelName: e.target.value })}
                            className="border rounded px-2 py-1 text-xs w-32" />
                        </td>
                        <td className="px-3 py-2">
                          <input value={editData.productName ?? p.productName}
                            onChange={(e) => setEditData({ ...editData, productName: e.target.value })}
                            className="border rounded px-2 py-1 text-xs w-40" />
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{p.categorySlug}</td>
                        <td className="px-3 py-2">
                          <input type="number" value={editData.priceMember ?? p.priceMember}
                            onChange={(e) => setEditData({ ...editData, priceMember: +e.target.value, price: +e.target.value })}
                            className="border rounded px-2 py-1 text-xs w-24" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={editData.priceOriginal ?? p.priceOriginal}
                            onChange={(e) => setEditData({ ...editData, priceOriginal: +e.target.value })}
                            className="border rounded px-2 py-1 text-xs w-24" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={editData.outOfStock ?? p.outOfStock}
                            onChange={(e) => setEditData({ ...editData, outOfStock: e.target.checked })} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={editData.visible ?? p.visible}
                            onChange={(e) => setEditData({ ...editData, visible: e.target.checked })} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button onClick={() => saveEdit(p.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded mr-1">저장</button>
                          <button onClick={() => setEditId(null)} className="text-xs border px-2 py-1 rounded">취소</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-xs text-gray-700 max-w-[120px] truncate">{p.modelName}</td>
                        <td className="px-3 py-2 text-xs font-medium text-gray-900 max-w-[180px]">
                          <span className="line-clamp-2">{p.productName}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{p.categorySlug}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-blue-700">{p.priceMember.toLocaleString()}원</td>
                        <td className="px-3 py-2 text-xs text-gray-400 line-through">{p.priceOriginal > 0 ? `${p.priceOriginal.toLocaleString()}원` : "-"}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${p.outOfStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {p.outOfStock ? "품절" : "정상"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${p.visible ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                            {p.visible ? "노출" : "숨김"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => { setEditId(p.id); setEditData({}); }}
                            className="text-xs text-blue-600 hover:underline mr-2">수정</button>
                          <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 flex-wrap">
          {Array.from({ length: Math.min(totalPages, 20) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 text-xs rounded border ${page === p ? "bg-blue-700 text-white border-blue-700" : "border-gray-300 hover:bg-gray-50"}`}>
              {p}
            </button>
          ))}
          {totalPages > 20 && <span className="text-xs text-gray-500 self-center">... ({totalPages}페이지)</span>}
        </div>
      )}

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-bold">신규 상품 등록</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "카테고리 *", key: "categorySlug", type: "select" },
                { label: "기종명 *", key: "modelName" },
                { label: "상품명 *", key: "productName" },
                { label: "상품 IDX", key: "productIdx" },
                { label: "회원가 *", key: "priceMember", type: "number" },
                { label: "정가", key: "priceOriginal", type: "number" },
                { label: "할인액", key: "priceDiscount", type: "number" },
                { label: "썸네일 URL", key: "thumbnail" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  {type === "select" ? (
                    <select
                      value={(newProd as Record<string, unknown>)[key] as string ?? ""}
                      onChange={(e) => setNewProd({ ...newProd, [key]: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">선택하세요</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>{c.depth1} &gt; {c.depth2 || c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={type ?? "text"}
                      value={(newProd as Record<string, unknown>)[key] as string ?? ""}
                      onChange={(e) => setNewProd({ ...newProd, [key]: type === "number" ? +e.target.value : e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!newProd.outOfStock}
                    onChange={(e) => setNewProd({ ...newProd, outOfStock: e.target.checked })} />
                  품절
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={newProd.visible !== false}
                    onChange={(e) => setNewProd({ ...newProd, visible: e.target.checked })} />
                  노출
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded text-sm">취소</button>
              <button onClick={addProduct} className="px-4 py-2 bg-blue-700 text-white rounded text-sm hover:bg-blue-800">등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
