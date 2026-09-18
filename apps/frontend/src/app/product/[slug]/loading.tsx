export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Skeleton */}
      <div className="border-b border-border/40 bg-muted/20 py-2.5">
        <div className="mx-auto w-full max-w-[1440px] px-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 rounded bg-muted/60 animate-pulse" />
            <span className="text-muted-foreground/40">/</span>
            <div className="h-4 w-16 rounded bg-muted/60 animate-pulse" />
            <span className="text-muted-foreground/40">/</span>
            <div className="h-4 w-32 rounded bg-muted/60 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Product Skeleton */}
      <div className="mx-auto w-full max-w-[1440px] px-4">
        <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-2">
          {/* Left: Image Gallery Skeleton */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 shadow-sm">
            <div className="aspect-square w-full rounded-xl bg-muted/60 animate-pulse flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-muted/80 animate-pulse" />
            </div>
            <div className="mt-4 flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-16 rounded-lg bg-muted/60 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Right: Product Info Skeleton */}
          <div className="flex flex-col space-y-5 rounded-2xl border border-border/60 bg-card p-5 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-20 rounded-full bg-muted/60 animate-pulse" />
              <div className="h-5 w-24 rounded-full bg-muted/60 animate-pulse" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="h-8 w-3/4 rounded-lg bg-muted/80 animate-pulse" />
              <div className="h-5 w-1/2 rounded bg-muted/60 animate-pulse" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="h-4 w-28 rounded bg-muted/60 animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted/40 animate-pulse" />
            </div>

            {/* Price Box */}
            <div className="rounded-xl bg-muted/30 p-4 space-y-2">
              <div className="flex items-baseline gap-3">
                <div className="h-9 w-36 rounded-lg bg-muted/80 animate-pulse" />
                <div className="h-6 w-24 rounded bg-muted/50 animate-pulse" />
              </div>
              <div className="h-4 w-44 rounded bg-muted/40 animate-pulse" />
            </div>

            {/* Colors / Variants */}
            <div className="space-y-2">
              <div className="h-4 w-16 rounded bg-muted/60 animate-pulse" />
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-16 rounded-md bg-muted/60 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 rounded-xl bg-muted/80 animate-pulse" />
                <div className="h-12 rounded-xl bg-muted/80 animate-pulse" />
              </div>
              <div className="h-4 w-52 rounded bg-muted/40 animate-pulse mx-auto" />
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm mb-12">
          <div className="flex gap-4 border-b border-border/60 pb-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-muted/60 animate-pulse" />
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded bg-muted/50 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted/50 animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-muted/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
