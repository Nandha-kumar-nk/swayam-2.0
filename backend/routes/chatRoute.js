const express = require("express");
const router = express.Router();
const getGeminiResponse = require("../utils/gemini");

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await getGeminiResponse(message);

    res.json({ success: true, response: reply });

  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
