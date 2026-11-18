import { EditorForm } from "@/components/nabz/editor-form";
import { getCategoriesWithCounts } from "@/lib/nabz-data";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const cats = await getCategoriesWithCounts();
  return (
    <div>
      <h1 className="nz-display mb-1 text-[1.35rem] font-extrabold text-[color:var(--nz-cream)]">خبر جدید</h1>
      <p className="mb-7 text-[0.8rem] text-[color:var(--nz-muted)]">
        متن را ساده بنویسید؛ هر خط یک پاراگراف می‌شود. «## عنوان بخش» برای زیرتیتر و «{"<"} جمله{" >"}» برای نقل‌قول.
      </p>
      <EditorForm cats={cats.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
