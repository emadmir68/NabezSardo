import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EditorForm } from "@/components/nabz/editor-form";
import { getCategoriesWithCounts } from "@/lib/nabz-data";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [a, cats] = await Promise.all([
    db.article.findUnique({ where: { id } }),
    getCategoriesWithCounts(),
  ]);
  if (!a) notFound();

  return (
    <div>
      <h1 className="nz-display mb-1 text-[1.35rem] font-extrabold text-[color:var(--nz-cream)]">ویرایش خبر</h1>
      <p className="mb-7 text-[0.8rem] text-[color:var(--nz-muted)]">
        {a.views.toLocaleString("fa-IR")} بازدید — وضعیت فعلی: {a.status === "published" ? "منتشرشده" : "پیش‌نویس"}
      </p>
      <EditorForm
        cats={cats.map((c) => ({ id: c.id, name: c.name }))}
        article={{
          id: a.id,
          title: a.title,
          slug: a.slug,
          categoryId: a.categoryId,
          lead: a.lead,
          author: a.author,
          location: a.location,
          image: a.image,
          featured: a.featured,
          status: a.status,
          body: a.body,
        }}
      />
    </div>
  );
}
