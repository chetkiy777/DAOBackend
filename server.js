const express = require('express');
const cors = require('cors');
const {ethers} = require("ethers");
require('dotenv').config();
const DAO_ABI = require('./abis/DAO.json');

const proposalsRouter = require("./routes/proposals.js");

// import express from 'express';
// import cors from 'cors';
// import {ethers} from 'ethers';
// import dotenv from 'dotenv';
// import DAO_ABI from './abis/DAO.json';




const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", proposalsRouter);

const port = process.env.PORT || 3000;
const rpcUrl = process.env.RPC_URL;
const daoAddress = process.env.DAO_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const daoContract = new ethers.Contract(daoAddress, DAO_ABI, wallet);

const storage = {
  events: [],
  proposals: new Map()
}

// storage.set(1, { id: 1, title: "Increase Staking Rewards", description: "Proposal to increase staking rewards by 5%." });


// app.get('/', (req, res) => {
//   res.status(200).send(storage.proposals);
// });


async function initialize() {
  try {

    const network = await provider.getNetwork();
    console.log("cuurent network: ", network.chainId);

    const blockNumber = await provider.getBlockNumber();
    console.log("current block number: ", blockNumber);

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (e) {
    console.error('Error during initialization:', e);
  }
}

initialize();