import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const text = await req.text();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "유효한 CSV 파일이 아닙니다." }, { status: 400 });
  }

  const header = lines[0].replace(/^﻿/, "").split(","); // remove BOM
  const idIdx          = header.indexOf("id");
  const priceIdx       = header.indexOf("price");
  const priceOrigIdx   = header.indexOf("priceOriginal");
  const priceMemberIdx = header.indexOf("priceMember");
  const priceDiscIdx   = header.indexOf("priceDiscount");
  const outOfStockIdx  = header.indexOf("outOfStock");
  const visibleIdx     = header.indexOf("visible");

  if (idIdx === -1) {
    return NextResponse.json({ error: "id 컬럼이 없습니다." }, { status: 400 });
  }

  let updated = 0;
  const errors: string[] = [];

  // Process in batches to avoid SQLite lock issues
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const id   = cols[idIdx]?.trim();
    if (!id) continue;

    try {
      const updateData: Record<string, unknown> = {};
      if (priceIdx       >= 0 && cols[priceIdx])       updateData.price         = parseInt(cols[priceIdx]);
      if (priceOrigIdx   >= 0 && cols[priceOrigIdx])   updateData.priceOriginal = parseInt(cols[priceOrigIdx]);
      if (priceMemberIdx >= 0 && cols[priceMemberIdx]) updateData.priceMember   = parseInt(cols[priceMemberIdx]);
      if (priceDiscIdx   >= 0 && cols[priceDiscIdx])   updateData.priceDiscount = parseInt(cols[priceDiscIdx]);
      if (outOfStockIdx  >= 0 && cols[outOfStockIdx] !== undefined)
        updateData.outOfStock = cols[outOfStockIdx] === "1" || cols[outOfStockIdx] === "true";
      if (visibleIdx     >= 0 && cols[visibleIdx] !== undefined)
        updateData.visible = cols[visibleIdx] === "1" || cols[visibleIdx] === "true";

      if (Object.keys(updateData).length > 0) {
        await prisma.product.update({ where: { id }, data: updateData });
        updated++;
      }
    } catch {
      errors.push(`Row ${i + 1}: id=${id} 업데이트 실패`);
    }
  }

  return NextResponse.json({ updated, errors: errors.slice(0, 20) });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (c === "," && !inQuote) {
      result.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}
