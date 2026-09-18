import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import { authenticateCustomer } from "../middlewares/auth";

const router = Router();

router.post("/", authenticateCustomer, reviewController.createReview);
router.get("/product/:productId", reviewController.getProductReviews);
router.get("/:productId", reviewController.getProductReviews);
router.put("/:reviewId", authenticateCustomer, reviewController.updateReview);
router.delete("/:reviewId", authenticateCustomer, reviewController.deleteReview);

export default router;
