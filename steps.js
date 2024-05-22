
function calculateSteps(target, V, start = 0, min = 0, max = 150) {
    const dp = Array(151).fill(Infinity);
    const choices = dp.map(() => []);
    dp[start] = 0;

    const positives = V.filter(x => x > 0);
    const negatives = V.filter(x => x < 0);

    let cycle = [positives, negatives];

    for (let cycle_i = 0, changed = false; changed; cycle_i++) {
        changed = false;
        cycle[cycle_i % cycle.length].forEach(v => {
            for (let j = Math.max(v, min); j < max; j++) {
                let i = j - v;
                if (i >= min && i <= max) {
                    const u = dp[i];
                    if (dp[j] > u + 1) {
                        changed = true;
                        dp[j] = u + 1;
                        choices[j] = choices[i].concat([v]);
                    }
                }
            }
        });
    }

    return choices[target];
}
