const express = require("express");
const storage = require("../storage/storage.js");
const router = express.Router();


router.get("/proposals", (req, res) => {
  try {
    const proposals = Array.from(storage.proposals.values()).map((p) => {
      const {votes, ...proposal} = p;
      return proposal;
    });

    res.json({
      success: true,
      data: proposals,
      count: storage.proposals.size
    });

  } catch (e) {
    console.error("Error fetching proposal:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }


});


router.get("/proposal/:id", (req, res) => {
  try {

    const proposal = storage.proposals.get(String(req.params.id));
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    res.json({
      success: true,
      data: proposal
    });

  } catch (e) {
    console.error("Error fetching proposal:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

module.exports = router;