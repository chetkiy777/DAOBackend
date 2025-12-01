const startBlock = Number(process.env.START_BLOCK) || 0;


const storage = {
  events: [],
  proposals: new Map(),
  lastBlock: startBlock,
  totalProposalExecuted: 0,
  totalProposals: 0
}

module.exports = storage;