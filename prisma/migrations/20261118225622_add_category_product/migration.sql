-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "depth1" TEXT NOT NULL,
    "depth1Slug" TEXT NOT NULL,
    "depth2" TEXT NOT NULL,
    "depth2Slug" TEXT NOT NULL,
    "depth3" TEXT NOT NULL DEFAULT '',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categorySlug" TEXT NOT NULL,
    "productIdx" TEXT NOT NULL DEFAULT '',
    "modelName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "priceText" TEXT NOT NULL DEFAULT '회원가',
    "price" INTEGER NOT NULL DEFAULT 0,
    "priceOriginal" INTEGER NOT NULL DEFAULT 0,
    "priceMember" INTEGER NOT NULL DEFAULT 0,
    "priceDiscount" INTEGER NOT NULL DEFAULT 0,
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "isReturnRestricted" BOOLEAN NOT NULL DEFAULT false,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "outOfStock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "Category" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
