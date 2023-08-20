const sqlFuns = require('./sqlActions');

module.exports = {
    calculateExpectedScores,
    calculateActualScores,
    getNewRatings
}

async function calculateExpectedScores(players) {
    const d = 400;
    let probabilities = [];
    for (let i = 0; i < players.length; i++) {
        let sum = 0;
        for (opponent of players) {
            if (players[i] === opponent) continue;

            sum += 1.0/(1+Math.pow(10, (await sqlFuns.getRating(opponent) - await sqlFuns.getRating(players[i]))/d));
        }
        probabilities[i] = sum / (players.length * (players.length - 1) / 2);
    }

    return probabilities;
}

function calculateActualScores(N, ties) {
    const a = 1.5;
    let scores = [];

    for (let i = 0; i < N; i++) {

        let sum = 0;
        for (let j = 1; j <= N; j++) {
            sum += Math.pow(a, N - j) - 1;
        }

        scores[i] = (Math.pow(a, N - (i + 1)) - 1) / (sum);
    }

    if (ties[0]) {
        if (ties[1] && N > 2) {
            if (ties[2] && N > 3) {
                let avg = (scores[0] + scores[1] + scores[2] + scores[3])/4
                for (let i = 0; i < scores.length; i++) {
                    scores[i] = avg
                }
            }
            else {
                let avg = (scores[0] + scores[1] + scores[2])/3
                scores[0] = avg
                scores[1] = avg
                scores[2] = avg
            }
        }
        else {
            let avg = (scores[0] + scores[1])/2
            scores[0] = avg
            scores[1] = avg
        }
    }
    else if (ties[1] && N > 2) {
        if (ties[2] && N > 3) {
            let avg = (scores[1] + scores[2] + scores[3])/3
            scores[1] = avg
            scores[2] = avg
            scores[3] = avg
        }
        else {
            let avg = (scores[1] + scores[2])/2
            scores[1] = avg
            scores[2] = avg
        }
    }
    else if (ties[2] && N > 3) {
        let avg = (scores[2] + scores[3])/2
        scores[2] = avg
        scores[3] = avg
    }

    return scores;
}

async function getNewRatings(players, ties) {
    let expectedScores = await calculateExpectedScores(players);
    let actualScores = calculateActualScores(players.length, ties);

    let oldRatings = await sqlFuns.getRatings(players);
    let newRatings = [];

    for (let i = 0; i < players.length; i++) {
        newRatings[i] = Math.round(oldRatings[i] + 32*(players.length - 1)*(actualScores[i] - expectedScores[i]));
    }

    return newRatings;
}