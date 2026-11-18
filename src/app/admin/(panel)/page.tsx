import { getPublished, getCategoriesWithCounts, getSettings, getStats } from "@/lib/nabz-data";
import { db } from "@/lib/db";
import { DashboardTabs } from "@/components/nabz/dashboard-tabs";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [articles, cats, settings, stats, citizens, contacts] = await Promise.all([
    getPublished(),
    getCategoriesWithCounts(),
    getSettings(),
    getStats(),
    db.citizenReport.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <DashboardTabs
      articles={articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        categoryId: a.categoryId,
        categoryName: a.category.name,
        status: a.status,
        featured: a.featured,
        views: a.views,
        image: a.image,
        updatedAt: a.updatedAt.toISOString(),
      }))}
      cats={cats.map((c) => ({ id: c.id, name: c.name }))}
      stats={stats}
      settings={{
        breakingText: settings.breakingText || "",
        adEnabled: settings.adEnabled || "",
        adTitle: settings.adTitle || "",
        adText: settings.adText || "",
        adLink: settings.adLink || "",
      }}
      citizens={citizens.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        location: c.location,
        headline: c.headline,
        details: c.details,
        mediaUrl: c.mediaUrl,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))}
      contacts={contacts.map((c) => ({
        id: c.id,
        name: c.name,
        contact: c.contact,
        subject: c.subject,
        message: c.message,
        read: c.read,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
