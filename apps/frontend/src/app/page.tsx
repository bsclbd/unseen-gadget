"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Shield, Headphones, ShoppingCart } from "lucide-react";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeading } from "@/components/section-heading";
import type { MockProduct } from "@/components/product-types";
import { NewArrivalCarousel } from "@/components/new-arrival-carousel";
import { TopSellingCarousel } from "@/components/top-selling-carousel";
import { HandpickedCarousel } from "@/components/handpicked-carousel";
import { ProductGridSkeleton, ProductCarouselSkeleton } from "@/components/product-card-skeleton";
import { HeroBannerCarousel, type BannerItem } from "@/components/hero-banner-carousel";
import { ShopByBrand } from "@/components/shop-by-brand";
import { useTranslation } from "@/hooks/use-translation";
import { CatBtn, type HomeCategory } from "@/components/home/category-icons";
import { BrandStorySection, type BrandStoryData } from "@/components/home/brand-story-section";
import { BenefitsBar } from "@/components/home/benefits-bar";
import { WhyChooseSection, type WhyChooseData } from "@/components/home/why-choose-section";
import { HomeArticlesSection, type HomeArticleItem } from "@/components/home/home-articles-section";
import {
  useBanners,
  useCategories,
  useFeaturedCategories,
  useNewArrivals,
  useTopSelling,
  useProducts,
  useArticles,
  useStories,
  useLandingCms,
} from "@/hooks/use-queries";

const W = "mx-auto w-full max-w-[1440px] px-4";

const mapApiProduct = (p: any): MockProduct => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  category: typeof p.category === "object" ? p.category?.name || "Gadget" : (p.category || "Gadget"),
  brand: typeof p.brand === "object" ? p.brand?.name : (p.brand || "Apple"),
  price: Number(p.price) || 0,
  originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
  discount: p.discount ? Number(p.discount) : undefined,
  image: p.image || p.images?.[0] || "",
  images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
  badge: p.badge || (p.discount ? `${p.discount}% OFF` : undefined),
  colors: Array.isArray(p.colors) ? p.colors : [],
  inStock: p.inStock !== false,
  rating: p.rating != null ? Number(p.rating) : 0,
  reviews: Number(p.reviews) || Number(p.ratingCount) || 0,
  description: p.description,
  features: Array.isArray(p.features) ? p.features : [],
  specifications: p.specifications || {},
  warranty: p.warranty,
  sku: p.sku,
  variants: Array.isArray(p.variants) ? p.variants : [],
});

export default function Home() {
  const { t } = useTranslation();

  // ══ 100% Real API Queries (No mock JSON, No hardcoded defaults) ═══════════════════
  const { data: bannersRes, isLoading: isLoadingBanners } = useBanners();
  const { data: featCatRes, isLoading: isLoadingFeatCat } = useFeaturedCategories();
  const { data: catRes, isLoading: isLoadingCategories } = useCategories();
  const { data: ipadsRes, isLoading: isLoadingIpads } = useProducts({ category: "ipads-tablets", limit: 8 });
  const { data: newArrivalsRes, isLoading: isLoadingNewArrivals } = useNewArrivals(8);
  const { data: budgetRes, isLoading: isLoadingBudget } = useProducts({ category: "tablets", limit: 8 });
  const { data: topSellingRes, isLoading: isLoadingTopSelling } = useTopSelling(8);
  const { data: allProductsRes, isLoading: isLoadingAll } = useProducts({ limit: 15 });
  const { data: articlesRes, isLoading: isLoadingArticles } = useArticles();
  const { data: storiesRes } = useStories();
  const { data: landingRes } = useLandingCms();

  // Section visibility controller from Admin Landing CMS (/blog/landing)
  const activeSections = useMemo<Record<string, boolean>>(() => {
    const raw = (landingRes as any)?.data ?? landingRes;
    const secList = raw?.sections;
    if (Array.isArray(secList) && secList.length > 0) {
      const map: Record<string, boolean> = {};
      for (const s of secList) {
        map[s.id] = s.isActive !== false;
      }
      return map;
    }
    return {};
  }, [landingRes]);

  const isSecOn = (id: string) => activeSections[id] !== false;

  // Real Banners strictly from Admin CMS (/cms/banners)
  const bannerData = useMemo<BannerItem[]>(() => {
    const raw = (bannersRes as any)?.data ?? bannersRes;
    if (Array.isArray(raw)) {
      return raw.map((b: any, index: number) => ({
        id: b.id || `banner-${index + 1}`,
        title: b.title || "",
        subtitle: b.subtitle || "",
        cta: b.cta ?? "",
        href: b.href || "/products",
        image: b.image || "",
        placement: b.placement,
        status: b.status,
      }));
    }
    return [];
  }, [bannersRes]);

  // Real Featured Categories from Admin CMS (/cms/featured-categories)
  const categoryHeader = useMemo(() => {
    const raw = (featCatRes as any)?.data ?? featCatRes;
    return {
      kicker: raw?.kicker || t("home.categoriesKicker"),
      title: raw?.title || t("home.categoriesTitle"),
    };
  }, [featCatRes, t]);

  const categoryData = useMemo<HomeCategory[]>(() => {
    const featRaw = (featCatRes as any)?.data?.items ?? (featCatRes as any)?.items;
    if (Array.isArray(featRaw) && featRaw.length > 0) {
      return featRaw
        .filter((c: any) => c.active !== false)
        .map((c: any) => ({
          id: c.id || c.slug,
          name: c.name,
          href: c.href || `/category/${c.slug || c.id}`,
          image: c.image || "",
          iconType: c.iconType || c.id,
        }));
    }
    const catRaw = (catRes as any)?.data ?? catRes;
    if (Array.isArray(catRaw) && catRaw.length > 0) {
      return catRaw.map((c: any) => ({
        id: c.slug || c.id,
        name: c.name,
        href: `/category/${c.slug}`,
        image: c.image || "",
        iconType: c.slug || c.id,
      }));
    }
    return [];
  }, [featCatRes, catRes]);

  // Real Products Extraction
  const extractProducts = (res: any): MockProduct[] => {
    const raw = (res as any)?.data?.items ?? (res as any)?.data ?? (res as any)?.items ?? res;
    return Array.isArray(raw) ? raw.map(mapApiProduct) : [];
  };

  const iPs = useMemo(() => extractProducts(ipadsRes), [ipadsRes]);
  const nPs = useMemo(() => extractProducts(newArrivalsRes), [newArrivalsRes]);
  const bPs = useMemo(() => extractProducts(budgetRes), [budgetRes]);
  const tPs = useMemo(() => extractProducts(topSellingRes), [topSellingRes]);
  const allPs = useMemo(() => extractProducts(allProductsRes), [allProductsRes]);

  // Real Articles from Database (/api/articles)
  const articleData = useMemo<HomeArticleItem[]>(() => {
    const raw = (articlesRes as any)?.data ?? articlesRes;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((a: any) => ({
        id: a.id,
        slug: a.slug || a.id,
        title: a.title,
        category: a.category || "Gadget News",
        date: a.publishedAt
          ? new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Recent",
        image: a.featuredImage || a.image || "",
        excerpt: a.excerpt || "",
      }));
    }
    return [];
  }, [articlesRes]);

  // Real Why Choose Us from Admin CMS (/cms/landing) - Zero hardcoded defaults
  const whyData = useMemo<WhyChooseData | null>(() => {
    const raw = (landingRes as any)?.data ?? landingRes;
    const why = raw?.whyChooseUs;

    if (Array.isArray(why?.cards) && why.cards.length > 0) {
      return {
        kicker: why.kicker || t("home.whyKicker"),
        title: why.title || t("home.whyTitle"),
        cards: why.cards.map((c: any, i: number) => ({
          icon:
            c.icon === "shield"
              ? Shield
              : c.icon === "headphones"
              ? Headphones
              : i === 1
              ? Shield
              : i === 2
              ? Headphones
              : ShoppingCart,
          title: c.title,
          desc: c.desc,
        })),
      };
    }

    return null;
  }, [landingRes, t]);

  // Real Brand Stories from Admin CMS (/cms/landing & /cms/stories) - Zero hardcoded defaults
  const brandStoryData = useMemo<BrandStoryData>(() => {
    const rawLanding = (landingRes as any)?.data ?? landingRes;
    const rawStories = (storiesRes as any)?.data ?? storiesRes;
    const seo = rawLanding?.seoStory;
    const welcome = rawStories?.["welcome"];
    const apple = rawStories?.["apple-products"];

    const welcomeTitle = seo?.section1?.title || welcome?.title;
    const welcomeP1 = seo?.section1?.paragraph1 || welcome?.excerpt || welcome?.content;
    const welcomeP2 = seo?.section1?.paragraph2 || "";

    const appleTitle = seo?.section2?.title || apple?.title;
    const appleP1 = seo?.section2?.paragraph1 || apple?.excerpt || apple?.content;
    const appleP2 = seo?.section2?.paragraph2 || "";

    return {
      welcome: welcomeTitle ? {
        title: welcomeTitle,
        paragraph1: welcomeP1,
        paragraph2: welcomeP2,
        href: "/story/welcome",
      } : null,
      apple: appleTitle ? {
        title: appleTitle,
        paragraph1: appleP1,
        paragraph2: appleP2,
        href: "/story/apple-products",
      } : null,
    };
  }, [landingRes, storiesRes]);

  return (
    <>
      {/* ══ HERO BANNER ═════════════════════════════════════ */}
      {isSecOn("hero") && (
        <section className="py-2">
          <div className={W}>
            {isLoadingBanners && bannerData.length === 0 ? (
              <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-3">
                <div className="h-[200px] xs:h-[230px] sm:h-[300px] md:h-[360px] lg:h-[440px] w-full rounded-xl sm:rounded-2xl bg-muted/60 animate-pulse lg:col-span-2" />
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:flex lg:flex-col lg:h-[440px]">
                  <div className="h-[115px] xs:h-[135px] sm:h-[160px] md:h-[180px] lg:h-[214px] rounded-xl sm:rounded-2xl bg-muted/60 animate-pulse lg:flex-1" />
                  <div className="h-[115px] xs:h-[135px] sm:h-[160px] md:h-[180px] lg:h-[214px] rounded-xl sm:rounded-2xl bg-muted/60 animate-pulse lg:flex-1" />
                </div>
              </div>
            ) : bannerData.length > 0 ? (
              <HeroBannerCarousel banners={bannerData} />
            ) : null}
          </div>
        </section>
      )}

      {/* ══ BENEFITS BAR ════════════════════════════════════ */}
      {isSecOn("benefits") && <BenefitsBar containerClass={W} />}

      {/* ══ SHOP BY CATEGORY (Real API from Admin Featured Categories) ══ */}
      {isSecOn("categories") && (
        isLoadingFeatCat && isLoadingCategories ? (
          <section className="py-6">
            <div className={W}>
              <div className="mb-5 text-center">
                <div className="mx-auto h-3 w-28 rounded bg-muted/60" />
                <div className="mx-auto mt-2 h-5 w-48 rounded bg-muted/80" />
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="h-[72px] w-[72px] rounded-full bg-muted/60 animate-pulse" />
                    <div className="h-2.5 w-14 rounded bg-muted/50" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : categoryData.length > 0 ? (
          <section className="py-6">
            <div className={W}>
              <div className="mb-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  {categoryHeader.kicker}
                </p>
                <h2 className="mt-1.5 text-[19px] font-bold text-foreground">
                  {categoryHeader.title}
                </h2>
              </div>

              <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
                {categoryData.slice(0, 7).map((c) => <CatBtn key={c.id} c={c} />)}
              </div>
              {categoryData.length > 7 && (
                <>
                  <hr className="my-5 border-border" />
                  <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
                    {categoryData.slice(7, 14).map((c) => <CatBtn key={c.id} c={c} />)}
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null
      )}

      {isSecOn("brands") && <ShopByBrand />}

      {/* ══ iPADS & TABLETS ══════════════════════════════════ */}
      {isSecOn("ipads") && (isLoadingIpads || iPs.length > 0) && (
        <section className="border-t border-border py-5">
          <div className={W}>
            <SectionHeading title={t("home.section.iPads")} href="/category/ipads-tablets" />
            {isLoadingIpads ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <ProductGrid products={iPs} />
            )}
          </div>
        </section>
      )}

      {/* ══ NEW ARRIVAL — promo panel + carousel (two-column) ══ */}
      {isSecOn("new-arrival") && (isLoadingNewArrivals || nPs.length > 0) && (
        <section className="border-t border-border py-5">
          <div className={W}>
            <SectionHeading title={t("home.section.newArrival")} href="/new-arrivals" />
            <div className="grid gap-3 lg:grid-cols-5">
              {nPs[0] ? (
                <Link
                  href={`/product/${nPs[0].slug}`}
                  aria-label={`Featured New Arrival: ${nPs[0].name}`}
                  className="group flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-primary/15 p-5 text-center transition hover:shadow-md border border-border min-w-0"
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-primary">
                    {nPs[0].badge || "New Arrival"}
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-black leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {nPs[0].name}
                  </p>
                  <p className="mt-2 text-sm font-bold text-primary">
                    ৳{nPs[0].price.toLocaleString()}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {t("common.viewDetails")} <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ) : (
                <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-primary/15 p-6 text-center border border-border animate-pulse min-w-0">
                  <div className="h-3 w-16 rounded bg-muted/60" />
                  <div className="mt-2 h-5 w-32 rounded bg-muted/80" />
                  <div className="mt-2 h-4 w-20 rounded bg-muted/60" />
                </div>
              )}

              <div className="lg:col-span-4 min-w-0 max-w-full overflow-hidden">
                {isLoadingNewArrivals ? (
                  <ProductCarouselSkeleton count={4} />
                ) : (
                  <NewArrivalCarousel products={nPs} />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ BUDGET TABLETS ═══════════════════════════════════ */}
      {isSecOn("budget-tablets") && (isLoadingBudget || bPs.length > 0) && (
        <section className="border-t border-border py-5">
          <div className={W}>
            <SectionHeading title={t("home.section.budgetTablets")} href="/category/tablets" />
            {isLoadingBudget ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <ProductGrid products={bPs} />
            )}
          </div>
        </section>
      )}

      {/* ══ TOP SELLING ════════════════════════════════════ */}
      {isSecOn("top-selling") && (isLoadingTopSelling || tPs.length > 0) && (
        <section className="border-t border-border py-5">
          <div className={W}>
            <SectionHeading title={t("home.section.topSelling")} href="/top-selling" />
            {isLoadingTopSelling ? (
              <ProductCarouselSkeleton count={5} />
            ) : (
              <TopSellingCarousel products={tPs} />
            )}
          </div>
        </section>
      )}

      {/* ══ HANDPICKED PRODUCTS FOR YOU ════════════════════ */}
      {isSecOn("handpicked") && (isLoadingAll || allPs.length > 0) && (
        <section className="border-t border-border py-6">
          <div className={W}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-foreground">{t("home.section.handpicked")}</h2>
              <Link
                href="/products"
                className="flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors hover:text-primary-700"
              >
                {t("nav.viewAll")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {isLoadingAll ? (
              <ProductCarouselSkeleton count={5} />
            ) : (
              <HandpickedCarousel products={allPs} />
            )}
          </div>
        </section>
      )}

      {/* ══ WHY CHOOSE US (100% Real API from Admin CMS /cms/landing) ══ */}
      {isSecOn("why-choose") && <WhyChooseSection data={whyData} containerClass={W} />}

      {/* ══ OUR ARTICLES ════════════════════════════════════ */}
      {isSecOn("articles") && (
        <HomeArticlesSection
          articles={articleData}
          isLoading={isLoadingArticles}
          containerClass={W}
        />
      )}

      {/* ══ SEO TEXT / BRAND STORIES (100% Real API from Admin CMS /cms/landing & /cms/stories) ══ */}
      {isSecOn("seo") && (
        <BrandStorySection
          data={brandStoryData}
          containerClass={W}
          readMoreLabel={t("common.readMore")}
        />
      )}
    </>
  );
}
