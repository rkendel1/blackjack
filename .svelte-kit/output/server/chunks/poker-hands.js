const RANK_VALUES = {
  "1": 14,
  // Ace is highest
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  jack: 11,
  queen: 12,
  king: 13
};
const HAND_RANK_VALUES = {
  "high-card": 1,
  pair: 2,
  "two-pair": 3,
  "three-of-a-kind": 4,
  straight: 5,
  flush: 6,
  "full-house": 7,
  "four-of-a-kind": 8,
  "straight-flush": 9,
  "royal-flush": 10
};
function getRankValue(rank) {
  return RANK_VALUES[rank];
}
function isFlush(cards) {
  const suit = cards[0].suit;
  return cards.every((card) => card.suit === suit);
}
function isStraight(cards) {
  const values = cards.map((c) => getRankValue(c.rank)).sort((a, b) => a - b);
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] - values[i] !== 1) {
      if (values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14) {
        return true;
      }
      return false;
    }
  }
  return true;
}
function getRankCounts(cards) {
  const counts = /* @__PURE__ */ new Map();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}
function evaluateHand(cards) {
  if (cards.length !== 5) {
    throw new Error("Must evaluate exactly 5 cards");
  }
  const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
  const rankCounts = getRankCounts(sortedCards);
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  const isFlushHand = isFlush(sortedCards);
  const isStraightHand = isStraight(sortedCards);
  if (isFlushHand && isStraightHand) {
    const values2 = sortedCards.map((c) => getRankValue(c.rank));
    if (values2[0] === 14 && values2[1] === 13) {
      return {
        rank: "royal-flush",
        score: HAND_RANK_VALUES["royal-flush"] * 1e6 + values2[0],
        cards: sortedCards,
        description: "Royal Flush"
      };
    }
    return {
      rank: "straight-flush",
      score: HAND_RANK_VALUES["straight-flush"] * 1e6 + values2[0],
      cards: sortedCards,
      description: "Straight Flush"
    };
  }
  if (counts[0] === 4) {
    const quadRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 4)?.[0];
    const kickerRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 1)?.[0];
    return {
      rank: "four-of-a-kind",
      score: HAND_RANK_VALUES["four-of-a-kind"] * 1e6 + getRankValue(quadRank) * 100 + getRankValue(kickerRank),
      cards: sortedCards,
      description: "Four of a Kind"
    };
  }
  if (counts[0] === 3 && counts[1] === 2) {
    const tripRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0];
    const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)?.[0];
    return {
      rank: "full-house",
      score: HAND_RANK_VALUES["full-house"] * 1e6 + getRankValue(tripRank) * 100 + getRankValue(pairRank),
      cards: sortedCards,
      description: "Full House"
    };
  }
  if (isFlushHand) {
    const values2 = sortedCards.map((c) => getRankValue(c.rank));
    return {
      rank: "flush",
      score: HAND_RANK_VALUES.flush * 1e6 + values2[0] * 1e4 + values2[1] * 1e3 + values2[2] * 100 + values2[3] * 10 + values2[4],
      cards: sortedCards,
      description: "Flush"
    };
  }
  if (isStraightHand) {
    const values2 = sortedCards.map((c) => getRankValue(c.rank));
    return {
      rank: "straight",
      score: HAND_RANK_VALUES.straight * 1e6 + values2[0],
      cards: sortedCards,
      description: "Straight"
    };
  }
  if (counts[0] === 3) {
    const tripRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 3)?.[0];
    const kickers = sortedCards.filter((c) => c.rank !== tripRank).map((c) => getRankValue(c.rank));
    return {
      rank: "three-of-a-kind",
      score: HAND_RANK_VALUES["three-of-a-kind"] * 1e6 + getRankValue(tripRank) * 1e4 + kickers[0] * 100 + kickers[1],
      cards: sortedCards,
      description: "Three of a Kind"
    };
  }
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = Array.from(rankCounts.entries()).filter(([_, count]) => count === 2).map(([rank]) => getRankValue(rank)).sort((a, b) => b - a);
    const kicker = sortedCards.filter((c) => getRankValue(c.rank) !== pairs[0] && getRankValue(c.rank) !== pairs[1]).map((c) => getRankValue(c.rank))[0];
    return {
      rank: "two-pair",
      score: HAND_RANK_VALUES["two-pair"] * 1e6 + pairs[0] * 1e4 + pairs[1] * 100 + kicker,
      cards: sortedCards,
      description: "Two Pair"
    };
  }
  if (counts[0] === 2) {
    const pairRank = Array.from(rankCounts.entries()).find(([_, count]) => count === 2)?.[0];
    const kickers = sortedCards.filter((c) => c.rank !== pairRank).map((c) => getRankValue(c.rank)).sort((a, b) => b - a);
    return {
      rank: "pair",
      score: HAND_RANK_VALUES.pair * 1e6 + getRankValue(pairRank) * 1e5 + kickers[0] * 1e3 + kickers[1] * 100 + kickers[2],
      cards: sortedCards,
      description: "Pair"
    };
  }
  const values = sortedCards.map((c) => getRankValue(c.rank));
  return {
    rank: "high-card",
    score: HAND_RANK_VALUES["high-card"] * 1e6 + values[0] * 1e4 + values[1] * 1e3 + values[2] * 100 + values[3] * 10 + values[4],
    cards: sortedCards,
    description: "High Card"
  };
}
function getBestHand(cards) {
  if (cards.length < 5) {
    throw new Error("Need at least 5 cards to evaluate");
  }
  if (cards.length === 5) {
    return evaluateHand(cards);
  }
  const combinations = [];
  function combine(start, combo) {
    if (combo.length === 5) {
      combinations.push([...combo]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  let bestHand = null;
  for (const combo of combinations) {
    const evaluation = evaluateHand(combo);
    if (!bestHand || evaluation.score > bestHand.score) {
      bestHand = evaluation;
    }
  }
  return bestHand;
}
export {
  evaluateHand as e,
  getBestHand as g
};
