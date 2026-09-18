import type { Request, Response } from "express";
import { prisma } from "@unseen-gadget/database";
import { ApiResponseUtil } from "../utils/api-response";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/errors";
import { asyncHandler } from "../utils/async-handler";

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, comment } = req.body;

  if (!productId || !rating) {
    throw new BadRequestError("Product ID and rating are required");
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError("You must be logged in to submit a review");
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      productId: product.id,
      userId,
    },
  });

  let review;
  if (existingReview) {
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating: numRating,
        comment: comment || undefined,
        status: "APPROVED",
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        productId: product.id,
        userId,
        rating: numRating,
        comment: comment || undefined,
        status: "APPROVED",
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // Recalculate average rating & reviews count
  const allProductReviews = await prisma.review.findMany({
    where: { productId: product.id, status: "APPROVED" },
    select: { rating: true },
  });

  const avgRating =
    allProductReviews.length > 0
      ? Math.round(
          (allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length) * 10
        ) / 10
      : numRating;

  await prisma.product.update({
    where: { id: product.id },
    data: {
      rating: avgRating,
      ratingCount: allProductReviews.length,
    },
  });

  ApiResponseUtil.success(res, review, "Review submitted successfully");
});

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });

  if (!product) {
    return ApiResponseUtil.success(res, []);
  }

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "APPROVED" },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  ApiResponseUtil.success(res, reviews);
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  if (review.userId !== req.user?.id) {
    throw new BadRequestError("You can only edit your own reviews");
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: rating !== undefined ? rating : review.rating,
      comment: comment !== undefined ? comment : review.comment,
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  ApiResponseUtil.success(res, updatedReview);
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new NotFoundError("Review not found");
  }

  if (review.userId !== req.user?.id) {
    throw new BadRequestError("You can only delete your own reviews");
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  ApiResponseUtil.success(res, { deleted: true });
});

export const ReviewController = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};

export default ReviewController;
