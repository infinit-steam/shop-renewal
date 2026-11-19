"use client";

import { useState, useEffect } from "react";

type Category = {
  id: string; slug: string; name: string;
  depth1: string; depth1Slug: string;
  depth2: string; depth2Slug: string;
  depth3: string;
  visible: boolean; sortOrder: number;
  _count?: { products: number };
};

type EditForm = {
  name: string; slug: string;
  depth1: string; depth1Slug: string;
  depth2: string; depth2Slug: string;
  depth3: string;
  visible: boolean; sortOrder: number;
};

const BLANK: EditForm = {
  name: "", slug: "",
  depth1: "", depth1Slug: "",
  depth2: "", depth2Slug: "",
  depth3: "",
  visible: true, sortOrder: 0,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editId, setEditId]         = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditForm>(BLANK);
  const [showAdd, setShowAdd]       = useState(false);
  const [newForm, setNewForm]       = useState<EditForm>(BLANK);
  const [openD1, setOpenD1]         = useState<Record<string, boolean>>({});
  const [openD2, setOpenD2]         = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const data = await fetch("/api/admin/categories").then((r) => r.json());
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleVisible = async (cat: Category) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !cat.visible }),
    });
    load();
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditForm({
      name: cat.name, slug: cat.slug,
      depth1: cat.depth1, depth1Slug: cat.depth1Slug,
      depth2: cat.depth2, depth2Slug: cat.depth2Slug,
      depth3: cat.depth3,
      visible: cat.visible, sortOrder: cat.sortOrder,
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    const res = await fetch(`/api/admin/categories/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditId(null); load(); }
    else { const d = await res.json(); alert(d.error); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  };

  const addCategory = async () => {
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) { setShowAdd(false); setNewForm(BLANK); load(); }
    else { const d = await res.json(); alert(d.error); }
  };

  // Build tree
  const d1Groups = Array.from(new Set(categories.map((c) => c.depth1))).sort();
  const getD2 = (d1: string) =>
    Array.from(new Set(categories.filter((c) => c.depth1 === d1).map((c) => c.depth2))).sort();
  const getD3 = (d1: string, d2: string) =>
    categories.filter((c) => c.depth1 === d1 && c.depth2 === d2 && c.depth3).sort((a, b) => a.sortOrder - b.sortOrder);
  const d2Only = (d1: string, d2: string) =>
    categories.find((c) => c.depth1 === d1 && c.depth2 === d2 && !c.depth3);

  const FormFields = ({ form, setForm }: { form: EditForm; setForm: (f: EditForm) => void }) => (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {[
        { label: "대분류명 (depth1)", key: "depth1" },
        { label: "대분류 Slug",        key: "depth1Slug" },
        { label: "중분류명 (depth2)",  key: "depth2" },
        { label: "중분류 Slug",        key: "depth2Slug" },
        { label: "소분류명 (depth3)",  key: "depth3" },
        { label: "카테고리 Slug *",    key: "slug" },
        { label: "표시명 (name) *",    key: "name" },
        { label: "정렬 순서",          key: "sortOrder", type: "number" },
      ].map(({ label, key, type }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <input
            type={type ?? "text"}
            value={(form as Record<string, unknown>)[key] as string ?? ""}
            onChange={(e) => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      ))}
      <div className="col-span-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.visible}
            onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
          <span className="text-xs">노출</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">전체 <strong>{categories.length}</strong>개 카테고리</p>
        <button onClick={() => { setShowAdd(true); setNewForm(BLANK); }}
          className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800">
          + 카테고리 추가
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {d1Groups.map((d1) => (
            <div key={d1}>
              {/* depth1 row */}
              <button
                onClick={() => setOpenD1({ ...openD1, [d1]: !openD1[d1] })}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 font-semibold text-sm text-gray-800"
              >
                <span className="text-xs text-gray-400 w-4">{openD1[d1] ? "▼" : "▶"}</span>
                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                {d1}
                <span className="ml-auto text-xs text-gray-400 font-normal">
                  {categories.filter((c) => c.depth1 === d1).length}개
                </span>
              </button>

              {openD1[d1] && getD2(d1).map((d2) => {
                const d2key = `${d1}__${d2}`;
                const leafCat = d2Only(d1, d2);
                const children = getD3(d1, d2);

                return (
                  <div key={d2} className="border-t border-gray-50">
                    {/* depth2 row */}
                    <div className="flex items-center gap-2 pl-8 pr-4 py-2.5 hover:bg-gray-50">
                      <button
                        onClick={() => setOpenD2({ ...openD2, [d2key]: !openD2[d2key] })}
                        className="text-xs text-gray-400 w-4"
                      >
                        {children.length > 0 ? (openD2[d2key] ? "▼" : "▶") : "·"}
                      </button>
                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
                      <span className="text-sm text-gray-700">{d2}</span>
                      {leafCat && (
                        <>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${leafCat.visible ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                            {leafCat.visible ? "노출" : "숨김"}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">({leafCat._count?.products ?? 0}개)</span>
                          <div className="ml-auto flex gap-2 text-xs">
                            <button onClick={() => toggleVisible(leafCat)} className="text-gray-500 hover:text-blue-600">
                              {leafCat.visible ? "숨기기" : "노출"}
                            </button>
                            <button onClick={() => startEdit(leafCat)} className="text-blue-600 hover:underline">수정</button>
                            <button onClick={() => deleteCategory(leafCat.id)} className="text-red-500 hover:underline">삭제</button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* depth3 rows */}
                    {openD2[d2key] && children.map((cat) => (
                      <div key={cat.id}>
                        {editId === cat.id ? (
                          <div className="pl-16 pr-4 py-3 bg-blue-50 border-t border-blue-100">
                            <FormFields form={editForm} setForm={setEditForm} />
                            <div className="mt-3 flex gap-2">
                              <button onClick={saveEdit} className="bg-blue-700 text-white px-3 py-1.5 rounded text-xs">저장</button>
                              <button onClick={() => setEditId(null)} className="border px-3 py-1.5 rounded text-xs">취소</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pl-16 pr-4 py-2 hover:bg-gray-50 border-t border-gray-50">
                            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                            <span className="text-sm text-gray-600">{cat.depth3 || cat.name}</span>
                            <span className="text-xs text-gray-400 ml-1 font-mono">{cat.slug}</span>
                            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${cat.visible ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                              {cat.visible ? "노출" : "숨김"}
                            </span>
                            <span className="text-xs text-gray-400">({cat._count?.products ?? 0}개)</span>
                            <div className="ml-auto flex gap-2 text-xs">
                              <button onClick={() => toggleVisible(cat)} className="text-gray-500 hover:text-blue-600">
                                {cat.visible ? "숨기기" : "노출"}
                              </button>
                              <button onClick={() => startEdit(cat)} className="text-blue-600 hover:underline">수정</button>
                              <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:underline">삭제</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* depth2-level edit panel */}
                    {leafCat && editId === leafCat.id && (
                      <div className="pl-12 pr-4 py-3 bg-blue-50 border-t border-blue-100">
                        <FormFields form={editForm} setForm={setEditForm} />
                        <div className="mt-3 flex gap-2">
                          <button onClick={saveEdit} className="bg-blue-700 text-white px-3 py-1.5 rounded text-xs">저장</button>
                          <button onClick={() => setEditId(null)} className="border px-3 py-1.5 rounded text-xs">취소</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {d1Groups.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">카테고리가 없습니다.</div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-base font-bold">카테고리 추가</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6">
              <FormFields form={newForm} setForm={setNewForm} />
              <p className="mt-3 text-xs text-gray-400">
                * 소분류 없이 중분류만 있는 경우 depth3을 비워두세요.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded text-sm">취소</button>
              <button onClick={addCategory} className="px-4 py-2 bg-blue-700 text-white rounded text-sm">추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
