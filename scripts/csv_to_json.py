"""
CSV → products.json 변환기
===========================
1. scripts/raw_products.csv 를 아래 컬럼 순서로 준비하세요:
   categorySlug, modelName, productName, price, thumbnail, isReturnRestricted

2. 실행:
   python scripts/csv_to_json.py

3. 결과:
   src/data/products.json 이 덮어씌워집니다.

CSV 예시 (헤더 포함):
  categorySlug,modelName,productName,price,thumbnail,isReturnRestricted
  case-soft-jelly,갤럭시 S25 [SM-S931],하이온 젤리 케이스,2800,/images/products/img_0040.jpg,false
"""

import csv, json, sys
from pathlib import Path

ROOT_DIR    = Path(__file__).parent.parent
CSV_PATH    = Path(__file__).parent / "raw_products.csv"
OUTPUT_PATH = ROOT_DIR / "src" / "data" / "products.json"

# CSV 컬럼명 → products.json 필드 매핑 (왼쪽=CSV헤더, 오른쪽=JSON키)
COLUMN_MAP = {
    "categorySlug":        "categorySlug",
    "modelName":           "modelName",
    "productName":         "productName",
    "price":               "price",
    "thumbnail":           "thumbnail",
    "isReturnRestricted":  "isReturnRestricted",
    # 선택 컬럼
    "soldCount":           "soldCount",
    "createdAt":           "createdAt",
    # 엑셀에서 내보낼 때 한글 헤더를 쓰는 경우 아래에 추가
    "카테고리슬러그":        "categorySlug",
    "기종명":               "modelName",
    "상품명":               "productName",
    "가격":                "price",
    "썸네일":               "thumbnail",
    "반품불가":             "isReturnRestricted",
}

BOOL_TRUE  = {"true", "1", "yes", "예", "반품불가"}
BOOL_FALSE = {"false", "0", "no", "아니오", ""}


def to_bool(v: str) -> bool:
    return v.strip().lower() in BOOL_TRUE


def to_int(v: str) -> int:
    nums = "".join(c for c in v if c.isdigit())
    return int(nums) if nums else 0


def convert():
    if not CSV_PATH.exists():
        print(f"오류: {CSV_PATH} 파일이 없습니다.")
        print("scripts/raw_products.csv 를 먼저 준비하세요.")
        sys.exit(1)

    products = []
    skipped  = 0

    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)

        # 실제 CSV 헤더를 JSON 키로 변환
        field_map = {}
        for col in (reader.fieldnames or []):
            mapped = COLUMN_MAP.get(col.strip())
            if mapped:
                field_map[col.strip()] = mapped

        for i, row in enumerate(reader, start=2):
            mapped: dict = {}
            for col, val in row.items():
                col = col.strip()
                key = COLUMN_MAP.get(col)
                if key:
                    mapped[key] = val.strip()

            # 필수 필드 검증
            if not mapped.get("categorySlug") or not mapped.get("productName"):
                print(f"  행 {i}: categorySlug 또는 productName 누락 → 건너뜀")
                skipped += 1
                continue

            products.append({
                "id":                 f"prod_{i-1:04d}",
                "categorySlug":       mapped.get("categorySlug", ""),
                "modelName":          mapped.get("modelName", ""),
                "productName":        mapped.get("productName", ""),
                "priceText":          "회원가",
                "price":              to_int(mapped.get("price", "0")),
                "thumbnail":          mapped.get("thumbnail", ""),
                "isReturnRestricted": to_bool(mapped.get("isReturnRestricted", "")),
                "soldCount":          to_int(mapped.get("soldCount", "0")),
                "createdAt":          mapped.get("createdAt", ""),
            })

    OUTPUT_PATH.write_text(
        json.dumps(products, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"변환 완료: {len(products)}개 상품 → {OUTPUT_PATH}")
    if skipped:
        print(f"건너뜀: {skipped}행 (필수 필드 누락)")
    print("브라우저에서 http://localhost:3001 을 새로고침하세요.")


if __name__ == "__main__":
    convert()
