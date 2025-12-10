const express = require("express");
const { ethers } = require("ethers");
const crypto = require("crypto");

const router = express.Router();


const nonceStore = new Map();

router.get("/nonce", (req, res) => {
  try {
    const nonce = crypto.randomBytes(32).toString("hex");

    const expiration = Date.now() + 5 * 60 * 1000;
    nonceStore.set(nonce, { nonce, expiration });

    setTimeout(() => {
      nonceStore.delete(nonce);
    }, 5 * 60 * 1000);

    res.json({
      success: true,
      nonce: nonce,
    });
  } catch (e) {
    console.error("Error generating nonce:", e);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/verify", (req, res) => {
  try {
    const { address, signature, nonce } = req.body;

    if (!address || !signature || !nonce) {
      return res.status(400).json({ success: false, error: "Address, signature, and nonce are required." });
    }

    const storedNonce = nonceStore.get(nonce);
    if (!storedNonce) {
      return res.status(400).json({ success: false, error: "Invalid or expired nonce." });
    }

    const recoveredAddress = ethers.verifyMessage(nonce, signature);

    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      nonceStore.delete(nonce);

      res.status(200).json({ success: true, message: "Authentication successful." });
    } else {
      res.status(401).json({ success: false, error: "Invalid signature." });
    }
  } catch (e) {
    console.error("Error verifying signature:", e);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
