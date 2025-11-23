const express = require("express");

const router = express.Router();


router.get("/", (req, res) => {
  res.status(200).json({ id: 1, title: "Increase Staking Rewards", description: "Proposal to increase staking rewards by 5%." });
});

module.exports = router;