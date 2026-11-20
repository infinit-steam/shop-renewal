import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCategoryBySlug } from "@/data/mockData";
import CategoryClient from "./CategoryClient";
import { parsePage, parseSort } from "@/lib/productSort";

export const instant = false;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

async function resolveCategoryName(slug: string): Promise<string | null> {
  const decoded = decodeURIComponent(slug);

  // 1) Try local JSON tree first (fast, no DB round-trip)
  const local = getCategoryBySlug(decoded);
  if (local) return local.name;

  // 2) Fallback: DB lookup
  const cat = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: decoded },
        { depth1Slug: decoded },
        { depth2Slug: decoded },
      ],
    },
  });
  if (cat) return cat.depth3 || cat.depth2 || cat.depth1;

  return null;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const decoded = decodeURIComponent(slug);

  const name = await resolveCategoryName(decoded);
  if (!name) notFound();

  return (
    <CategoryClient
      slug={decoded}
      categoryName={name}
      sort={parseSort(sp.sort)}
      page={parsePage(sp.page)}
    />
  );
}
