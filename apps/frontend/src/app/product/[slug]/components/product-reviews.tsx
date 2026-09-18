"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Star,
  CheckCircle2,
  Package,
  Loader2,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

interface ProductReviewsProps {
  reviewsList: any[];
  reviewsLoading: boolean;
  reviewsCount: number;
  currentRating: string | number;
  productName: string;
  productId: string | number;
  onReviewSubmitted: () => void;
  t: (key: string) => string;
}

export function ProductReviews({
  reviewsList,
  reviewsLoading,
  reviewsCount,
  currentRating,
  productName,
  productId,
  onReviewSubmitted,
  t,
}: ProductReviewsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleOpenReviewModal = () => {
    if (!session?.user) {
      toast.error("Please log in to write a review / রিভিউ দিতে অনুগ্রহ করে প্রথমে লগইন করুন");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }
    setReviewerName(session.user.name || "");
    setReviewerEmail(session.user.email || "");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Please log in to submit a review");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please fill in your review");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await apiRequest("/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: productId,
          rating: Number(reviewRating),
          name: reviewerName.trim() || "Customer",
          email: reviewerEmail.trim() || undefined,
          comment: reviewComment.trim(),
        }),
      });

      if (res.success || res.data) {
        toast.success("Thank you! Your review has been submitted.");
        setReviewModalOpen(false);
        setReviewComment("");
        setReviewerName("");
        setReviewerEmail("");
        setReviewRating(5);
        onReviewSubmitted();
      } else {
        throw new Error(res.error || res.message || "Failed to submit review");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary & CTA */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <div className="text-[36px] font-black leading-none text-foreground">
              {currentRating}
            </div>
            <div className="mt-2">
              <StarRating rating={Number(currentRating)} />
            </div>
            <div className="mt-1 text-[12px] font-medium text-muted-foreground">
              {reviewsCount} {reviewsCount === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className="hidden h-16 w-px bg-border sm:block" />

          <div className="space-y-1.5 min-w-[200px]">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviewsList.filter((r) => Math.round(r.rating) === stars).length;
              const pct = reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-3 font-medium">{stars}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="h-2 w-28 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex sm:flex-col justify-end">
          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-primary/20"
          >
            <Star className="h-4 w-4 fill-white" />
            {t("pdp.writeReviewCta")}
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {reviewsLoading ? (
        <div className="flex min-h-[140px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reviewsList.length > 0 ? (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {reviewsList.map((rev) => (
            <div key={rev.id} className="p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(rev.user?.name || rev.author || rev.reviewerName || "Customer").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {rev.user?.name || rev.author || rev.reviewerName || "Verified Customer"}
                      </span>
                      <span className="flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Recently"}
                    </span>
                  </div>
                </div>

                <StarRating rating={rev.rating || 5} />
              </div>

              {rev.comment && (
                <p className="text-sm leading-relaxed text-muted-foreground pl-12">
                  {rev.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/60" strokeWidth={1.2} />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {t("pdp.noReviews")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Have you used this product? Share your experience with other customers!
          </p>
          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="btn-primary mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold shadow-md shadow-primary/20"
          >
            <Star className="h-3.5 w-3.5 fill-white" />
            {t("pdp.writeReviewCta")}
          </button>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div>
                <h3 className="text-base font-bold text-foreground">Write a Review</h3>
                <p className="text-xs text-muted-foreground truncate max-w-xs">{productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <div className="space-y-1.5 text-center py-3 rounded-xl bg-muted/40 border border-border">
                <label className="text-xs font-semibold text-muted-foreground">
                  Your Overall Rating
                </label>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (hoverRating || reviewRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-500 block">
                  {(hoverRating === 1 || (!hoverRating && reviewRating === 1)) && "1 Star - Poor"}
                  {(hoverRating === 2 || (!hoverRating && reviewRating === 2)) && "2 Stars - Fair"}
                  {(hoverRating === 3 || (!hoverRating && reviewRating === 3)) && "3 Stars - Good"}
                  {(hoverRating === 4 || (!hoverRating && reviewRating === 4)) && "4 Stars - Very Good"}
                  {(hoverRating === 5 || (!hoverRating && reviewRating === 5)) && "5 Stars - Excellent!"}
                </span>
              </div>

              {/* Verified Logged-in Customer Badge */}
              <div className="flex items-center gap-2.5 rounded-xl bg-primary/5 p-3 border border-primary/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(session?.user?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{session?.user?.name || "Verified Customer"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
                <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Logged In
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Your Review / Experience *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike about this product? How is the quality and performance?"
                  className="w-full rounded-xl border border-border bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold shadow-md shadow-primary/20"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
