"""
선진P&C 원본 사이트 크롤러
============================
설정 → 실행:  python scripts/crawl_mall_data.py

출력:
  src/data/categories.json   ← 전체 카테고리 (대분류 / 소분류)
  src/data/products.json     ← 전체 상품 (정가 / 회원가 / 할인액 포함)
  public/images/products/    ← 썸네일 이미지 (중복 스킵)
"""

import os, re, sys, json, time, hashlib, urllib.parse
from pathlib import Path

# ── 필수 패키지 자동 설치 ─────────────────────────────────────────────────────
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "beautifulsoup4", "lxml"])
    import requests
    from bs4 import BeautifulSoup

# ════════════════════════════════════════════════════════════════════════════════
# ── 설 정 (여기만 수정하세요) ────────────────────────────────────────────────
# ════════════════════════════════════════════════════════════════════════════════

BASE_URL = "http://phonesesang.co.kr"   # ← 원본 사이트 주소 (끝에 / 없이)

# 크롬 DevTools → Network 탭 → 아무 요청 클릭 → Headers → Cookie: 값 복사
COOKIE = "visit=1; PHPSESSID=9c575135cc296dc434178c6f5fb7a559; 123mpopup21=123mpopup21; 123mpopup20=123mpopup20"

# ── 선택 설정 ─────────────────────────────────────────────────────────────────
REQUEST_DELAY  = 0.8   # 요청 간격 (초)
MAX_PAGES      = 999   # 카테고리당 최대 페이지 (999 = 전체)
IMAGE_DOWNLOAD = True  # False 로 바꾸면 이미지 다운로드 건너뜀

# ════════════════════════════════════════════════════════════════════════════════

ROOT_DIR   = Path(__file__).parent.parent
DATA_DIR   = ROOT_DIR / "src" / "data"
IMAGES_DIR = ROOT_DIR / "public" / "images" / "products"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Cookie": COOKIE,
    "Referer": BASE_URL,
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "ko-KR,ko;q=0.9",
})


# ── 유틸 ──────────────────────────────────────────────────────────────────────

def get(url: str, retries: int = 3) -> BeautifulSoup | None:
    for attempt in range(retries):
        try:
            resp = session.get(url, timeout=15)
            resp.raise_for_status()
            # 한국 사이트는 대부분 EUC-KR 또는 UTF-8
            resp.encoding = resp.apparent_encoding or "utf-8"
            time.sleep(REQUEST_DELAY)
            return BeautifulSoup(resp.text, "lxml")
        except Exception as e:
            print(f"  [재시도 {attempt+1}/{retries}] {url} → {e}")
            time.sleep(REQUEST_DELAY * 2)
    print(f"  [실패] {url}")
    return None


def abs_url(href: str) -> str:
    if not href or href.startswith("javascript"):
        return ""
    if href.startswith("http"):
        return href
    return urllib.parse.urljoin(BASE_URL, href)


def clean_text(tag) -> str:
    if tag is None:
        return ""
    return re.sub(r"\s+", " ", tag.get_text(separator=" ", strip=True))


def extract_cate(href: str) -> tuple[str, str]:
    """'/main/sub/?cate1=3&cate2=1' → ('3', '1')"""
    c1 = re.search(r"cate1=(\d*)", href or "")
    c2 = re.search(r"cate2=(\d+)", href or "")
    return (c1.group(1) if c1 else ""), (c2.group(1) if c2 else "")


def make_slug(cate1: str, cate2: str) -> str:
    if cate2:
        return f"c{cate1}-s{cate2}"
    return f"c{cate1}"


def clean_price(text: str) -> int:
    nums = re.sub(r"[^\d]", "", text)
    return int(nums) if nums else 0


def download_image(img_src: str) -> str:
    """이미지를 public/images/products/ 에 저장하고 로컬 경로 반환."""
    if not img_src or not IMAGE_DOWNLOAD:
        return ""
    full_url = abs_url(img_src)
    if not full_url:
        return ""
    ext = os.path.splitext(full_url.split("?")[0])[-1] or ".jpg"
    fname = hashlib.md5(full_url.encode()).hexdigest()[:16] + ext
    local = IMAGES_DIR / fname
    if local.exists():
        return f"/images/products/{fname}"
    try:
        resp = session.get(full_url, timeout=15, stream=True)
        resp.raise_for_status()
        with open(local, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)
        time.sleep(REQUEST_DELAY * 0.3)
        return f"/images/products/{fname}"
    except Exception as e:
        print(f"    [이미지 실패] {full_url} → {e}")
        return img_src  # 실패 시 원본 URL 유지


# ── 카테고리 크롤링 ────────────────────────────────────────────────────────────
# HTML 구조:
#   div#main_sub_menu_line > ul > li.main_menu.product_menu > ul
#     첫 번째 li: "전체보기" (안에 모든 카테고리 중첩) → 스킵
#     나머지 li:  각 대분류 탭
#       > a href="/main/sub/?cate1=3"  (대분류)
#       > div.submenu_container > ul > li > a  (소분류, cate2=N)

def crawl_categories(soup: BeautifulSoup) -> list[dict]:
    print("\n[1/3] 카테고리 메뉴 수집 중...")
    flat: list[dict] = []
    cat_id = 0

    product_menu_li = soup.select_one("li.product_menu")
    if not product_menu_li:
        print("  경고: li.product_menu 를 찾지 못했습니다.")
        return flat

    # 직계 ul > li 목록 (첫 번째 "전체보기" li 제외)
    top_lis = product_menu_li.select(":scope > ul > li")[1:]

    for li in top_lis:
        d1_a = li.select_one(":scope > a")
        if not d1_a:
            continue
        d1_name = clean_text(d1_a)
        d1_href = d1_a.get("href", "")
        c1, _ = extract_cate(d1_href)
        if not c1 or not d1_name:
            continue
        d1_slug = make_slug(c1, "")

        submenu = li.select_one(".submenu_container")
        sub_links = submenu.select("ul > li > a") if submenu else []

        if not sub_links:
            # 소분류 없음 → 대분류 자체가 리프
            cat_id += 1
            flat.append({
                "id": f"cat_{cat_id:03d}",
                "slug": d1_slug,
                "depth1": d1_name, "depth1Slug": d1_slug,
                "depth2": "", "depth2Slug": d1_slug,
                "depth3": "",
                "originalUrl": abs_url(d1_href),
            })
            print(f"  [{d1_name}]")
        else:
            for sub_a in sub_links:
                d2_name = clean_text(sub_a)
                d2_href = sub_a.get("href", "")
                _, c2 = extract_cate(d2_href)
                if not d2_name:
                    continue
                d2_slug = make_slug(c1, c2) if c2 else d1_slug
                cat_id += 1
                flat.append({
                    "id": f"cat_{cat_id:03d}",
                    "slug": d2_slug,
                    "depth1": d1_name, "depth1Slug": d1_slug,
                    "depth2": d2_name, "depth2Slug": d2_slug,
                    "depth3": "",
                    "originalUrl": abs_url(d2_href),
                })
            print(f"  [{d1_name}] → {len(sub_links)}개 소분류")

    print(f"  → 총 {len(flat)}개 카테고리 완료")
    return flat


# ── 상품 크롤링 ────────────────────────────────────────────────────────────────
# HTML 구조 (ul.sub_list > li):
#   ul.sub_list > li > ul > li[0]: <a href="?idx=N"> <img src="...">
#   ul.sub_list > li > ul > li[1]: 기종명
#   ul.sub_list > li > ul > li[2]: <a>상품명</a>
#   ul.sub_list > li > ul > li[3]: .mr_price(정가) / .mr_price2(회원가) / .mr_price3(할인액)
#   ul.sub_list > li > ul > li[5]: 장바구니 버튼 (onclick 에 idx 포함)

def parse_products_on_page(soup: BeautifulSoup, cat_slug: str, prod_id: int) -> list[dict]:
    items = soup.select("ul.sub_list > li")
    result = []

    for item in items:
        cols = item.select(":scope > ul > li")
        if len(cols) < 4:
            continue

        # ── li[0]: 썸네일 + idx ───────────────────────────────────────────────
        link_a = cols[0].select_one("a[href]")
        img_tag = cols[0].select_one("img")
        idx = ""
        if link_a:
            m = re.search(r"idx=(\d+)", link_a.get("href", ""))
            if m:
                idx = m.group(1)
        img_src = img_tag.get("src", "") if img_tag else ""
        thumbnail_local = download_image(img_src)

        # ── li[1]: 기종명 ────────────────────────────────────────────────────
        model_name = clean_text(cols[1])

        # ── li[2]: 상품명 ────────────────────────────────────────────────────
        name_a = cols[2].select_one("a")
        product_name = clean_text(name_a) if name_a else clean_text(cols[2])

        # ── li[3]: 가격 ──────────────────────────────────────────────────────
        price_orig_tag = cols[3].select_one(".mr_price")
        price_mem_tag  = cols[3].select_one(".mr_price2")
        price_disc_tag = cols[3].select_one(".mr_price3")

        price_original = clean_price(clean_text(price_orig_tag)) if price_orig_tag else 0
        price_member   = clean_price(clean_text(price_mem_tag))  if price_mem_tag  else 0
        price_discount = clean_price(clean_text(price_disc_tag)) if price_disc_tag else 0

        # 회원가 없으면 정가를 사용
        if price_member == 0:
            price_member = price_original

        # ── 반품불가 여부 ─────────────────────────────────────────────────────
        full_text = item.get_text(" ")
        is_return_restricted = "단순변심 반품불가" in full_text

        if not product_name and not idx:
            continue

        prod_id += 1
        result.append({
            "id":                  f"prod_{prod_id:04d}",
            "categorySlug":        cat_slug,
            "productIdx":          idx,
            "modelName":           model_name,
            "productName":         product_name,
            "priceText":           "회원가",
            "price":               price_member,       # 정렬 기준: 회원가
            "priceOriginal":       price_original,     # 정가 (취소선 표시용)
            "priceMember":         price_member,       # 회원 할인가
            "priceDiscount":       price_discount,     # 할인 금액
            "thumbnail":           thumbnail_local or img_src,
            "isReturnRestricted":  is_return_restricted,
            "soldCount":           0,
            "createdAt":           "",
        })

    return result, prod_id


def crawl_products(categories: list[dict]) -> list[dict]:
    print("\n[2/3] 상품 수집 중...")
    all_products: list[dict] = []
    prod_id = 0
    seen_urls: set[str] = set()

    for cat in categories:
        cat_url = cat["originalUrl"]
        if not cat_url:
            continue
        label = cat["depth1"] + (" > " + cat["depth2"] if cat["depth2"] else "")
        print(f"\n  카테고리: {label}")

        page = 1
        while page <= MAX_PAGES:
            sep = "&" if "?" in cat_url else "?"
            page_url = f"{cat_url}{sep}page={page}" if page > 1 else cat_url
            if page_url in seen_urls:
                break
            seen_urls.add(page_url)

            soup = get(page_url)
            if not soup:
                break

            new_items, prod_id = parse_products_on_page(soup, cat["slug"], prod_id)
            all_products.extend(new_items)
            print(f"    p{page}: {len(new_items)}개 수집")

            if len(new_items) == 0:
                break  # 빈 페이지 → 종료

            # ── 페이지네이션: 다음 페이지 링크 탐색 ─────────────────────────
            # 일반적인 한국 쇼핑몰 패턴: 숫자 페이지 링크 또는 '다음' 버튼
            next_found = False
            for a in soup.select("div.paging a, div.pagination a, td.paging a"):
                href = a.get("href", "")
                m = re.search(r"page=(\d+)", href)
                if m and int(m.group(1)) == page + 1:
                    next_found = True
                    break
            # 대안: onclick 에 page 파라미터가 있는 경우
            if not next_found:
                for a in soup.find_all("a", string=re.compile(r"^\s*다음\s*$|▶")):
                    if a.get("href") and "javascript" not in a.get("href", ""):
                        next_found = True
                        break
                    if re.search(r"page=", a.get("onclick", "")):
                        next_found = True
                        break

            if not next_found:
                break
            page += 1

    print(f"\n  → 총 {len(all_products)}개 상품 수집 완료")
    return all_products


# ── JSON 저장 ─────────────────────────────────────────────────────────────────

def save_json(data: list, path: Path, label: str):
    print(f"\n[3/3] {label}")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  → {path}  ({len(data)}건 저장)")


# ── 메인 ──────────────────────────────────────────────────────────────────────

def main():
    if "원본사이트주소" in BASE_URL or "여기에_복사한_쿠키값" in COOKIE:
        print("=" * 60)
        print("오류: 스크립트 상단의 BASE_URL 과 COOKIE 를 먼저 수정하세요.")
        print("=" * 60)
        sys.exit(1)

    print(f"접속 중: {BASE_URL}/main/")
    soup = get(f"{BASE_URL}/main/")
    if not soup:
        sys.exit("홈페이지 접근 실패. BASE_URL 과 COOKIE 를 확인하세요.")

    categories = crawl_categories(soup)
    if not categories:
        print("카테고리를 찾지 못했습니다.")
        sys.exit(1)

    save_json(categories, DATA_DIR / "categories.json", "categories.json 저장")

    products = crawl_products(categories)
    save_json(products, DATA_DIR / "products.json", "products.json 저장")

    print("\n완료! 브라우저에서 http://localhost:3001 을 새로고침하세요.")


if __name__ == "__main__":
    main()
