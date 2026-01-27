export function countVotes(votes) {
  const tally = {};

  Object.values(votes).forEach(target => {
    tally[target] = (tally[target] || 0) + 1;
  });

  let max = 0;
  let eliminated = null;
  let tie = false;

  for (const [id, count] of Object.entries(tally)) {
    if (count > max) {
      max = count;
      eliminated = id;
      tie = false;
    } else if (count === max) {
      tie = true;
    }
  }

  return tie ? null : eliminated;
}
