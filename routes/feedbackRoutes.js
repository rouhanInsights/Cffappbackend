const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const { submitFeedback,getSubmittedFeedbacks } = require("../controllers/feedbackController");

const router = express.Router();

router.post("/", verifyToken, submitFeedback);
router.get("/submitted", verifyToken, getSubmittedFeedbacks);
module.exports = router;
