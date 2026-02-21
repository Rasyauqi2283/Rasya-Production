import { notFound } from "next/navigation";
import { getServicePreviewMeta, isCustomPreviewSlug } from "@/lib/layananPreviewConfig";
import PreviewPageTemplate from "@/components/PreviewPageTemplate";
import PreviewPlaceholderContent from "@/components/PreviewPlaceholderContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LayananPreviewSlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (isCustomPreviewSlug(slug)) {
    notFound();
  }

  const meta = getServicePreviewMeta(slug);
  if (!meta) {
    notFound();
  }

  return (
    <PreviewPageTemplate
      title={meta.title}
      description={meta.description}
      tag={meta.tag}
      backHref="/layanan-preview"
      backLabel="← Kembali ke layanan preview"
    >
      <PreviewPlaceholderContent previewType={meta.previewType} title={meta.title} />
    </PreviewPageTemplate>
  );
}
