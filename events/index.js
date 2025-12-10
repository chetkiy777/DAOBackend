const storage = require("../storage/storage");

const handleProposalCreated = (events) => {
  for (let event of events) {
    try {
      const [id, creator, description ] = event.args;

      console.log("ProposalCreated event detected");
      console.log("Proposal ID: ", id.toString());
      console.log("Proposal Address: ", creator);
      console.log("Description: ", description);

      const proposal = {
        id: id.toString(),
        creator: creator,
        description: description,
        startBlock: event.blockNumber,
        createdAt: new Date().toISOString(),
        endBlock: null,
        voteCounterFor: "0",
        voteCounterAgainst: "0",
        executed: false,
        executedAt: null,
        transactionHash: event.transactionHash,
        votes: []
      }

      storage.proposals.set(id.toString(), proposal);
      storage.totalProposals++;

    } catch(e) {
      console.error("Error processing ProposalCreated event:", e);
    }
  }

}


const handleVoted = async (events) => {
  for (let event of events) {
    try {
      const [id, voter, support, amount ] = event.args;

      console.log("Voted event detected for proposal: ", id.toString());
      console.log("voter: ", voter);
      console.log("support: ", support);

      const vote = {
        voter,
        support,
        amount: amount.toString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: new Date().toISOString()
      }

      const proposal = storage.proposals.get(String(id));
      if (!proposal) {
        console.error("Proposal not found for VoteCast event:", id.toString());
        continue;
      }

      proposal.votes.push(vote);
      proposal.voteCounterFor = support ? String(BigInt(proposal.voteCounterFor) + amount)  : proposal.voteCounterFor;
      proposal.voteCounterAgainst = support ? proposal.voteCounterAgainst : String(BigInt(proposal.voteCounterAgainst) + amount);

    } catch(e) {
      console.error("Error processing ProposalVoted event:", e);
    }
  }
}


const handleProposalExecuted = async (events) => {
  for (let event of events) {
    try {
      const [id, executor] = event.args;

      console.log("Processing ProposalExecuted for ID: ", id.toString());
      console.log("executor: ", executor);

      const proposal = storage.proposals.get(id.toString());
      if (!proposal) {
        console.error("Proposal not found for ProposalExecuted event:", id.toString());
        continue;
      }

      proposal.executed = true;
      proposal.executedAt = new Date().toISOString();
      storage.totalProposalExecuted++;


    } catch(e) {
      console.error("Error processing ProposalExecuted event:", e);
    }
  }
}

module.exports = {
  handleProposalCreated,
  handleVoted,
  handleProposalExecuted
}