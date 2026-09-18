"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatBDT, savingsAmount } from "@/components/price";
import { StarRating } from "@/components/star-rating";
import { colorHex } from "@/components/color-swatches";
import { ProductGallery } from "@/components/product-gallery";
import { useTranslation } from "@/hooks/use-translation";
import { apiRequest } from "@/lib/api";
import { ProductTabs } from "./components/product-tabs";
import { ProductBuyBox } from "./components/product-buy-box";
import { ProductBreadcrumb } from "./components/product-breadcrumb";
import { ProductRelatedSection } from "./components/product-related-section";

export interface ProductDetailsData {
  id: string | number;
  name: string;
  slug: string;
  category: string;
  brand?: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  images?: string[];
  badge?: string | null;
  colors?: string[];
  inStock?: boolean;
  stock?: number;
  rating?: number;
  reviews?: number;
  description?: string;
  features?: string[] | string;
  specifications?: Record<string, any> | string;
  deliveryInfo?: {
    insideDhaka?: string;
    outsideDhaka?: string;
    shippingCost?: string;
  };
  shippingType?: "FREE" | "PAID" | string;
  shippingCost?: number;
  warranty?: string[] | string;
  variants?: any[];
  related?: any[];
  reviewSummary?: any;
}

export default function ProductDetails({ product }: { product: ProductDetailsData }) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.colors?.[0] ?? null
  );
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("description");
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Review states
  const [reviewsList, setReviewsList] = useState<any[]>(() => {
    if (Array.isArray(product.reviewSummary?.items)) {
      return product.reviewSummary.items;
    }
    return [];
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [supportPhone, setSupportPhone] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    apiRequest("/cms/navbar")
      .then((res: any) => {
        if (!cancelled && res?.data?.topbar?.phone) {
          setSupportPhone(res.data.topbar.phone);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!product.id) return;
    setReviewsLoading(true);
    try {
      const res = await apiRequest(`/reviews/${product.id}`);
      if (res.success && Array.isArray(res.data?.items)) {
        setReviewsList(res.data.items);
      } else if (res.success && Array.isArray(res.data)) {
        setReviewsList(res.data);
      }
    } catch {
      // Keep existing reviews
    } finally {
      setReviewsLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    if (!product.reviewSummary?.items || product.reviewSummary.items.length === 0) {
      fetchReviews();
    }
  }, [fetchReviews, product.reviewSummary]);

  useEffect(() => {
    if (!session?.user || !product.id) return;
    let cancelled = false;
    apiRequest("/wishlist")
      .then((res: any) => {
        if (!cancelled && res.success && Array.isArray(res.data)) {
          const isItemWishlisted = res.data.some((w: any) => w.productId === product.id);
          setWishlisted(isItemWishlisted);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session, product.id]);

  const reviewsCount = reviewsList.length > 0 ? reviewsList.length : (product.reviews ?? 0);
  const currentRating =
    reviewsList.length > 0
      ? Number((reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewsList.length).toFixed(1))
      : (product.rating ?? 0);

  const savings = savingsAmount(product);

  const handleToggleWishlist = async () => {
    if (!session?.user) {
      toast.error(
        language === "bn"
          ? "উইশলিস্টে যুক্ত করতে অনুগ্রহ করে প্রথমে লগইন করুন।"
          : "Please log in to add items to your wishlist."
      );
      router.push(`/login?callbackUrl=${encodeURIComponent(`/product/${product.slug || product.id}`)}`);
      return;
    }

    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await apiRequest(`/wishlist/${product.id}`, { method: "DELETE" });
        setWishlisted(false);
        toast.success(t("product.wishlist.removed"));
      } else {
        await apiRequest("/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: product.id }),
        });
        setWishlisted(true);
        toast.success(t("product.wishlist.added"));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const selectedVariant =
    selectedVariantIndex !== null && product.variants?.[selectedVariantIndex]
      ? product.variants[selectedVariantIndex]
      : (product.variants && product.variants.length > 0 ? product.variants[0] : null);

  const effectiveVariantIndex =
    selectedVariantIndex !== null
      ? selectedVariantIndex
      : (product.variants && product.variants.length > 0 ? 0 : null);

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock =
    selectedVariant?.stock !== undefined ? selectedVariant.stock : (product.stock ?? 0);
  const currentSku =
    selectedVariant?.sku || product.sku || `UG-${product.id.toString().padStart(4, "0")}`;
  const outOfStock = product.inStock === false || currentStock <= 0;

  const displayImages = useMemo(() => {
    const activeIndex = effectiveVariantIndex;
    if (activeIndex !== null && product.variants?.[activeIndex]) {
      const variant = product.variants[activeIndex];
      if (variant.images && variant.images.length > 0) {
        return [variant.images[0], ...(product.images ?? [])];
      }
    }
    return product.images ?? [];
  }, [effectiveVariantIndex, product.variants, product.images]);

  const featuresList: string[] = Array.isArray(product.features)
    ? product.features
    : typeof product.features === "string"
    ? [product.features]
    : [];

  const specsObject: Record<string, string> = useMemo(() => {
    if (typeof product.specifications === "string") {
      try {
        return JSON.parse(product.specifications);
      } catch {
        return { Details: product.specifications };
      }
    }
    return (product.specifications as Record<string, string>) || {};
  }, [product.specifications]);

  const warrantyPoints: string[] = Array.isArray(product.warranty)
    ? product.warranty
    : typeof product.warranty === "string"
    ? [product.warranty]
    : [];

  const tabs = [
    { id: "description", label: t("pdp.tabDescription") },
    { id: "specifications", label: t("pdp.tabSpecs"), count: Object.keys(specsObject).length },
    { id: "warranty", label: t("pdp.tabWarranty") },
    { id: "reviews", label: t("pdp.tabReviews"), count: reviewsCount },
  ];

  const handleAddToCart = async () => {
    if (outOfStock) return;
    setAddingToCart(true);
    try {
      await apiRequest("/cart/current/items", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity,
          color: selectedColor || undefined,
        }),
      });
      window.dispatchEvent(new CustomEvent("cart-updated"));
      toast.success(
        language === "bn"
          ? `"${product.name}" কার্টে যুক্ত হয়েছে!`
          : `Added "${product.name}" to cart!`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (outOfStock) return;
    setAddingToCart(true);
    try {
      await apiRequest("/cart/current/items", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id,
          quantity,
          color: selectedColor || undefined,
        }),
      });
      window.dispatchEvent(new CustomEvent("cart-updated"));
      router.push("/checkout");
    } catch (error: any) {
      toast.error(error.message || "Failed to proceed to checkout");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ProductBreadcrumb product={product} />

      {/* ══ MAIN PRODUCT SECTION ════════════════════════════════ */}
      <div className="container-gadget">
        <div className="grid grid-cols-1 gap-4 py-5 lg:grid-cols-2">
          {/* ── Left: Image Gallery ─────────────────────────── */}
          <div className="card-surface lg:sticky lg:top-[104px] lg:self-start p-4 sm:p-5">
            <ProductGallery
              images={displayImages}
              alt={product.name}
              discount={product.discount}
              wishlisted={wishlisted}
              onToggleWishlist={handleToggleWishlist}
            />
          </div>

          {/* ── Right: Product Info ─────────────────────────── */}
          <div className="card-surface p-4 sm:p-5">
            <h1 className="text-[22px] font-bold leading-tight text-foreground">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
              <span>
                {t("common.brand")}: <strong className="text-foreground">{product.brand ?? product.category}</strong>
              </span>
              <span>SKU: {currentSku}</span>
            </div>

            {/* Rating + reviews */}
            <div className="mt-3 flex items-center gap-3">
              {reviewsCount > 0 ? (
                <>
                  <StarRating rating={Number(currentRating)} showValue />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("reviews");
                      const elem = document.getElementById("pdp-tabs-container");
                      if (elem) elem.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-[12.5px] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {reviewsCount} {t("pdp.reviews")}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("reviews");
                  const elem = document.getElementById("pdp-tabs-container");
                  if (elem) elem.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-[12.5px] font-semibold text-primary transition-colors hover:underline"
              >
                {reviewsCount > 0 ? t("pdp.writeReview") : (t("pdp.writeFirstReview") || t("pdp.writeReview"))}
              </button>
            </div>

            {/* Price */}
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[24px] font-bold text-foreground">
                  {formatBDT(currentPrice)}
                </span>
                {product.originalPrice != null && product.originalPrice > currentPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatBDT(product.originalPrice)}
                  </span>
                )}
                {product.discount != null && product.discount > 0 && (
                  <span className="rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-white">
                    -{product.discount}% {t("pdp.discountOff")}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p className="mt-1.5 text-[12.5px] font-medium text-success">
                  {t("common.youSave")}: {formatBDT(savings)}
                </p>
              )}
            </div>

            {/* Stock status */}
            <div className="mt-4 flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">{t("common.availability")}:</span>
              {outOfStock ? (
                <span className="font-semibold text-error">{t("pdp.outOfStock")}</span>
              ) : (
                <span className="font-semibold text-success">
                  {t("pdp.inStock")} {currentStock ? `(${currentStock} in stock)` : ""}
                </span>
              )}
            </div>

            {/* Buy Box: Variants, Colors, Quantity, Cart & Buy Now Buttons, Service Info */}
            <ProductBuyBox
              product={product}
              selectedVariant={selectedVariant}
              effectiveVariantIndex={effectiveVariantIndex}
              setSelectedVariantIndex={setSelectedVariantIndex}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              quantity={quantity}
              setQuantity={setQuantity}
              outOfStock={outOfStock}
              addingToCart={addingToCart}
              wishlisted={wishlisted}
              wishlistLoading={wishlistLoading}
              supportPhone={supportPhone}
              colorHex={colorHex}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onToggleWishlist={handleToggleWishlist}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* ══ TABS ═══════════════════════════════════════════════ */}
      <ProductTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        product={product}
        featuresList={featuresList}
        specsObject={specsObject}
        warrantyPoints={warrantyPoints}
        reviewsList={reviewsList}
        reviewsLoading={reviewsLoading}
        reviewsCount={reviewsCount}
        currentRating={currentRating}
        onReviewSubmitted={fetchReviews}
        t={t}
      />

      {/* ══ RELATED PRODUCTS ═══════════════════════════════════ */}
      <ProductRelatedSection
        productId={product.id}
        productSlug={product.slug}
        category={product.category}
        initialRelated={product.related}
      />
    </div>
  );
}
