const express = require('express');
const cors = require('cors');
const {ethers} = require("ethers");
require('dotenv').config();
const DAO_ABI = require('./abis/DAO.json');
const storage = require("./storage/storage.js");

const proposalsRouter = require("./routes/proposals.js");
const authRouter = require("./routes/auth.js");

let timer;

const {handleProposalCreated, handleProposalExecuted, handleVoted} = require('./events/index.js');




const app = express();

app.use(express.json());
app.use(cors());


app.use("/api", proposalsRouter);
app.use("/api/auth", authRouter);



const port = process.env.PORT || 3000;
const rpcUrl = process.env.RPC_URL;
const daoAddress = process.env.DAO_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;


const startBlock = Number(process.env.START_BLOCK) || 0;
const batchSize = Number(process.env.BATCH_SIZE) || 10000;
const poolingInterval = Number(process.env.POLLING_INTERVAL) || 1000;


const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const daoContract = new ethers.Contract(daoAddress, DAO_ABI, wallet);


async function poolForEvents() {
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = storage.lastBlock + 1;

    if (fromBlock > currentBlock) {
      return;
    }

    const [proposalCreatedEvents, votedEvents, proposalExecutedEvents ] = await Promise.all([
      daoContract.queryFilter("ProposalCreated", fromBlock, currentBlock),
      daoContract.queryFilter("Voted", fromBlock, currentBlock),
      daoContract.queryFilter("ProposalExecuted", fromBlock, currentBlock)
    ])

    if (proposalCreatedEvents.length > 0) {
      await handleProposalCreated(proposalCreatedEvents);
    }

    if (votedEvents.length > 0 ) {
      await handleVoted(votedEvents);
    }

    if (proposalExecutedEvents.length > 0) {
      await handleProposalExecuted(proposalExecutedEvents);
    }

    storage.lastBlock = currentBlock;

  } catch (e) {
    console.error('Error proposal event:', e.message);
  }
}


async function startPooling() {
  console.log("Starting event polling...");

  timer = setInterval(poolForEvents, poolingInterval);
}


async function loadHistoricalEvents() {
  try {

    const currentBlock = await provider.getBlockNumber();
    let fromBlock = startBlock;
    const toBlock = currentBlock;

    const blockToScan = toBlock - fromBlock + 1;
    const batches = Math.ceil(blockToScan / batchSize);

    let allProposalCreatedEvents = [];
    let allVotedEvents = [];
    let allProposalExecutedEvents = [];

    for (let i = 0; i < batches; i++) {
      const batchFrom = fromBlock + (i * batchSize);
      let batchTo = Math.min(batchFrom + batchSize -1, toBlock);


      const [proposalCreatedEvents, votedEvents, proposalExecutedEvents ] = await Promise.all([
        daoContract.queryFilter("ProposalCreated", batchFrom, batchTo),
        daoContract.queryFilter("Voted", batchFrom, batchTo),
        daoContract.queryFilter("ProposalExecuted", batchFrom, batchTo)
      ]);

      allProposalCreatedEvents.push(...proposalCreatedEvents);
      allVotedEvents.push(...votedEvents);
      allProposalExecutedEvents.push(...proposalExecutedEvents);
    }

    if (allProposalCreatedEvents.length > 0) {
      await handleProposalCreated(allProposalCreatedEvents);
    }

    if (allVotedEvents.length > 0 ) {
      await handleVoted(allVotedEvents);
    }

    if (allProposalExecutedEvents.length > 0) {
      await handleProposalExecuted(allProposalExecutedEvents);
    }

    storage.lastBlock = toBlock;
    console.log("Historical events loaded up to block:", toBlock);

  } catch(e) {
    console.error("Error loading historical events:", e.message);
  }
}





async function initialize() {
  try {

    const network = await provider.getNetwork();
    console.log("current network: ", network.chainId);

    const blockNumber = await provider.getBlockNumber();
    console.log("current block number: ", blockNumber);

    await loadHistoricalEvents();
    await startPooling();

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (e) {
    console.error('Error during initialization:', e);
  }
}

initialize();