import { notFound } from "next/navigation";
import ProductDetails from "./ProductDetails";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/products/${slug}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      notFound();
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      notFound();
    }

    const { product, related, reviews } = json.data;
    if (!product) {
      notFound();
    }

    const combinedProduct = {
      ...product,
      related: related ?? [],
      reviews: reviews?.total ?? product.reviews ?? 0,
      reviewSummary: reviews ?? null,
    };

    return <ProductDetails product={combinedProduct} />;
  } catch {
    notFound();
  }
}
