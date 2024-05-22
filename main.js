var tooltipText = "";

const [tooltip] = document.getElementsByClassName('tooltip');

const stepMap = {
    'draw': -15,
    'hard-hit': -9,
    'medium-hit': -6,
    'light-hit': -3,
    'punch': 2,
    'bend': 7,
    'upset': 13,
    'shrink': 16,
}
nameMap = {
    'draw': 'Draw',
    'hard-hit': 'Hard Hit',
    'medium-hit': 'Medium Hit',
    'light-hit': 'Light Hit',
    'hit': 'Hit',
    'punch': 'Punch',
    'bend': 'Bend',
    'upset': 'Upset',
    'shrink': 'Shrink'
}

const stepNames = Object.keys(stepMap);
const valuesToStep = {};
valuesToStep[0] = 'hit';
stepNames.forEach(name => valuesToStep[stepMap[name]] = name);
function valueToStep(v) {
    return valuesToStep[v];
}

let steps = [];
let expected = [];
let nextSteps = [];

const greenSlider = document.querySelector('.green.slider');
const redSlider = document.querySelector('.red.slider');

const dragging = {
    element: undefined,
    initialY: undefined,
    initialX: undefined,
};

let lastShiftState = false;

const stepsEl = document.querySelectorAll('.real.steps > *');
const performedEls = [...stepsEl].map(e => e.getElementsByClassName('performed')[0]);
const expectedEls = [...stepsEl].map(e => e.getElementsByClassName('expected')[0]);
const indicatorsEl = [...stepsEl].map(e => e.getElementsByClassName('indicators')[0]);
const hintsStepsEl = document.querySelectorAll('.hints.steps > *');
const performHintsEls = [...hintsStepsEl].map(e => e.getElementsByClassName('performed')[0]);
let lastMouseX, lastMouseY;

function getGuiScale() {
    return window.getComputedStyle(document.body).getPropertyValue('--gui-scale');
}

function screenToInvCoords(el, x, y, scale = undefined) {
    const box = el.getBoundingClientRect();
    scale = scale || getGuiScale();
    const invx = box.left / scale + Math.floor((x - box.left) / scale) + 4;
    const invy = box.top / scale + Math.floor((y - box.top) / scale) + 4;
    return [invx, invy];
}

function refreshTooltip(el) {
    const scale = getGuiScale();
    const [x, y] = screenToInvCoords(el, lastMouseX, lastMouseY, scale);
    const tooltipText = el.dataset ? el.dataset.tooltip || "" : "";
    const visibility = tooltipText ? 'visible' : 'hidden';

    const hoverStyle = window.getComputedStyle(el);
    const offsetXS = hoverStyle.getPropertyValue('--tooltip-offset-x') || "0";
    const offsetYS = hoverStyle.getPropertyValue('--tooltip-offset-y') || "0";
    const offsetX = parseInt(offsetXS);
    const offsetY = parseInt(offsetYS);

    const span = tooltip.getElementsByClassName('tooltip-text')[0];
    span.textContent = tooltipText;
    const spanBox = span.getBoundingClientRect();
    const targetHeight = Math.floor(spanBox.height / scale);
    const targetWidth = Math.floor(spanBox.width / scale);
    tooltip.style.setProperty('--tooltip-width', targetWidth);
    tooltip.style.setProperty('--tooltip-height', targetHeight);
    tooltip.style.setProperty('--tooltip-x', x);
    tooltip.style.setProperty('--tooltip-y', y);
    tooltip.style.setProperty('--tooltip-offset-x', offsetX);
    tooltip.style.setProperty('--tooltip-offset-y', offsetY);
    tooltip.style.setProperty('visibility', visibility);
}

document.addEventListener('mousemove', ev => {
    lastMouseX = ev.x;
    lastMouseY = ev.y;

    tooltip.classList = ['tooltip'];

    if (!ev.target) return;

    refreshTooltip(ev.target);
});

const allActions = document.querySelectorAll('.all-actions [data-tooltip]');
allActions.forEach(el => el.addEventListener('click', ev => {
    let greenProgress = getProgress(greenSlider);

    const el = ev.target;
    const classes = [...el.classList];
    classes.forEach(stepName => {
        const step = stepMap[stepName] || 0;
        if (step) {
            greenProgress += step;
            steps.push(stepName);
            if (!nextSteps || nextSteps.length == 0) {
                refreshHints(greenProgress);
            } else {
                const hint = nextSteps.pop();
                if (hint !== stepName) {
                    refreshHints(greenProgress);
                } else {
                    refreshNextHints();
                }
            }
        }
    });

    if (greenProgress < 0 || greenProgress > 150) {
        steps = [];
        greenProgress = 0;
    }

    updateProgress(greenSlider, greenProgress);
    updateSteps();
    refreshExpected();
}));

function updateProgress(slider, progress, showTooltip) {
    slider.style.setProperty('--slider-progress', progress);
    if (showTooltip !== undefined) {
        if (showTooltip) {
            slider.dataset.tooltip = progress;
        } else {
            slider.dataset.tooltip = "";
        }
    }
}

function getProgress(slider) {
    const progress = +window.getComputedStyle(slider).getPropertyValue('--slider-progress');
    return progress;
}

document.querySelectorAll('.slider').forEach(el => {
    el.addEventListener('mousedown', ev => {
        dragging.element = ev.target;
        dragging.initialX = ev.X;
        dragging.initialY = ev.y;
    })
});

document.addEventListener('mousemove', ev => {
    if (!dragging.element) return;
    const el = dragging.element;
    const scale = getGuiScale();
    const [x, y] = screenToInvCoords(el, ev.x, ev.y, scale);

    const classes = [...el.classList];
    if (classes.includes('slider')) {
        const offX = 3;
        const bar = document.querySelector('.bar');
        const barBox = bar.getBoundingClientRect();
        const [barX, barY] = screenToInvCoords(bar, barBox.x, barBox.y, scale);
        const oldProgress = getProgress(el);
        const newProgress = Math.min(150, Math.max(0, x - barX - offX));
        updateProgress(el, newProgress, true);
        refreshTooltip(ev.target);

        if (oldProgress !== newProgress) {
            refreshHints();
        }
    }
});

document.addEventListener('mouseup', ev => {
    if (!dragging.element) return;

    if (!ev.shiftKey) {
        showProgressAll(false);
    }
    dragging.element = undefined;
});

function showProgressAll(show) {
    document.querySelectorAll('.slider').forEach(el => {
        updateProgress(el, getProgress(el), show);
    });
    const el = document.elementFromPoint(lastMouseX, lastMouseY);
    if (el) {
        refreshTooltip(el);
    }
}

document.addEventListener('keydown', ev => {
    if (lastShiftState != ev.shiftKey) {
        showProgressAll(ev.shiftKey);
    }

    lastShiftState = ev.shiftKey;
});

document.addEventListener('keyup', ev => {
    if (lastShiftState !== ev.shiftKey) {
        showProgressAll(ev.shiftKey);
    }

    lastShiftState = ev.shiftKey;
});

stepsEl.forEach((el, i) => {
    function clickStep(el, i) {
        const nameCycle = ['hit', 'draw', 'punch', 'bend', 'upset', 'shrink'];
        if (expected[i] === undefined) {
            expected[i] = {
                name: nameCycle[0],
                last_idx: i
            };
        } else {
            const nameidx = nameCycle.indexOf(expected[i].name);
            expected[i].name = nameCycle[(nameidx + 1) % nameCycle.length];
        }
        refreshHints();
        refreshExpected();
        refreshTooltip(el);
    }
    function clickIndicators(el, i) {
        const exp = expected[i];
        if (exp === undefined) return;
        if (exp.last_idx !== undefined) {
            if (i !== 0) {
                exp.notlast = true;
            } else {
                exp.any = true;
            }
            delete exp.last_idx;
        } else if (exp.notlast !== undefined) {
            exp.any = true;
            delete exp.notlast;
        } else if (exp.any !== undefined) {
            exp.last_idx = i;
            delete exp.any
        }
        refreshHints();
        refreshExpected();
    }

    const expectedEl = el.getElementsByClassName('expected')[0];
    const indicatorsEl = el.getElementsByClassName('indicators')[0];
    expectedEl.addEventListener('click', clickStep.bind(null, expectedEl, i));
    indicatorsEl.addEventListener('click', clickIndicators.bind(null, indicatorsEl, i));
});

function updateSteps() {
    const stepsFromEnd = steps.slice(-3).reverse();
    performedEls.forEach(el => el.replaceChildren([]));
    stepsFromEnd.forEach((s, i) => {
        const performedEl = performedEls[i];
        const newChild = document.createElement('div');
        newChild.classList = 'bg ' + s;
        performedEl.appendChild(newChild);
    });
}

function refreshNextHints() {
    const toDisplay = (nextSteps || []).slice(-3).reverse();
    performHintsEls.forEach(el => el.replaceChildren([]));
    performHintsEls.forEach((el, i) => {
        const nextStep = toDisplay[i];
        if (nextStep) {
            const newChild = document.createElement('div');
            newChild.classList = 'bg ' + nextStep;
            el.appendChild(newChild);
            el.classList = 'performed';
        } else {
            el.classList = 'performed hidden';
        }
    })
}

function expectationForStep(i, counted) {
    let valid = true;
    const exp = expected[i];
    if (!exp) return false;

    let hitWhen;
    let name = nameMap[exp.name];
    let indicators = [false, false, false];
    if (exp.any) {
        hitWhen = 'Any';
        indicators = [true, true, true];
    } else if (exp.notlast) {
        hitWhen = 'Not Last';
        indicators = [false, true, true];
    } else {
        hitWhen = ['Last', 'Second Last', 'Third Last'][exp.last_idx];
        indicators[exp.last_idx] = true;
    }

    function nameMatch(perfomed) {
        return perfomed === exp.name || perfomed.endsWith(exp.name);
    }

    const rsteps = steps.slice(-3).reverse();
    let found = false;
    for (let j = 0; j < 3; j++) {
        const performed = rsteps[j];
        if (!performed) continue;
        if (!counted[j] && nameMatch(performed)) {
            if (exp.any) {
                found = true;
            } else if (exp.notlast && j !== 0) {
                found = true;
            } else if (exp.last_idx === j) {
                found = true;
            }
        }
        if (found) {
            counted[j] = true;
            break;
        }
    }

    if (!found) {
        valid = false;
    }

    const txt = `${name} ${hitWhen}`
    return [valid, indicators, txt];
}

function refreshExpected() {
    expectedEls.forEach(el => el.replaceChildren([]));
    let counted = [false, false, false];
    stepsEl.forEach((stEl, i) => {
        const exp = expected[i];
        const el = expectedEls[i];
        if (exp) {
            const [valid, indicators, txt] = expectationForStep(i, counted);
            el.dataset.tooltip = txt;
            const newChild = document.createElement('div');
            newChild.dataset.tooltip = txt;
            newChild.classList = 'bg ' + exp.name;
            el.appendChild(newChild);
            stEl.classList = valid ? 'green' : 'orange';
            const indicatorsEl = stEl.getElementsByClassName('indicator');
            indicators.forEach((set, i) => {
                indicatorsEl[i].classList = set ? 'indicator active' : 'indicator';
            });
        } else {
            const defaultExpectedTooltips = [
                "Select Last Step",
                "Select Second Last Step",
                "Select Third Last Step"
            ];
            el.dataset.tooltip = defaultExpectedTooltips[i];
            stEl.classList = '';
        }
    });
}

function calculateSteps(V, start = 0, min = 0, max = 150) {
    const dp = Array(max + 1).fill(Infinity);
    const choices = dp.map(() => []);
    dp[start] = 0;

    for (let changed = true; changed;) {
        changed = false;
        V.forEach(v => {
            for (let j = Math.max(v, min); j <= max; j++) {
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

    return choices;
}

function refreshHints(greenProgress = undefined) {
    function findGoodSolution(target, ending, include = []) {
        const steps = choices[target];
        if (!steps || steps.length == 0) return;

        const stepsMustMatch = steps.slice(-ending.length);

        const allMatch = ending.every(v => stepsMustMatch.includes(v));
        if (allMatch) {
            const sliceEnd = -ending.length || undefined;
            return steps.slice(0, sliceEnd).concat(ending, include.reverse());
        } else {
            const newEnding = [...ending];
            const last = newEnding.pop();
            return findGoodSolution(target - last, newEnding, include.concat(last));
        }
    };

    function makePossibleEnds(expected) {
        let end = expected.slice(-3);
        const Wildcard = {};
        end = Array(3 - end.length).fill(Wildcard).concat(end);
        const permutationsNums = [
            [0, 1, 2], [0, 2, 1],
            [1, 0, 2], [1, 2, 0],
            [2, 0, 1], [2, 1, 0]
        ];
        function isValidPermutation(p) {
            let valid = true;
            for (let i = 0; i < p.length; i++) {
                let e = p[i];
                if (e == Wildcard) continue;
                if (e == undefined) continue;
                else if (e.notlast) {
                    if (i == p.length-1) {
                        valid = false;
                        break;
                    }
                } else if (!e.any && e.last_idx !== undefined && 2 - e.last_idx !== i) {
                    valid = false;
                    break;
                }
            }
            return valid;
        }

        const permutations = permutationsNums.map(idxl => idxl.map(i => end[i])).filter(isValidPermutation);
        for (const i in permutations) {
            let p = permutations[i].map(v => {
                if (v == Wildcard) return Wildcard;
                else return stepMap[v.name] || 0;
            });
            let lastidx = -1;
            while (p[lastidx+1] == Wildcard) {
                lastidx++;
            }
            if (lastidx > -1) {
                p = p.slice(lastidx+1)
            }
            permutations[i] = p;
        }

        let ends = permutations;
        let resolveWildcard;
        do {
            resolveWildcard = false;

            let newEnds = [];
            for (const i in ends) {
                let p = ends[i];

                let idx = p.indexOf(Wildcard);
                let anyhitidx = p.indexOf(0);
                if (anyhitidx !== -1) {
                    ['hard-hit', 'medium-hit', 'light-hit'].map(s => {
                        let newp = p.slice();
                        newp[anyhitidx] = stepMap[s];
                        return newp;
                    }).forEach(v =>
                        newEnds.push(v)
                    );
                    resolveWildcard = true;
                } else if (idx == -1) {
                    newEnds.push(p);
                } else {
                    Object.values(stepMap).map(s => {
                        let newp = p.slice();
                        newp[idx] = s;
                        return newp;
                    }).forEach(v =>
                        newEnds.push(v)
                    );
                    resolveWildcard = true;
                }
            }
            ends = newEnds;
        } while (resolveWildcard);

        return ends;
    }

    function calculateResult(mustTake) {
        const result = findGoodSolution(red, mustTake);
        let impossible = false;
        if (!result) {
            impossible = true;
        } else {
            let sum = green;
            for (const s of result) {
                sum += s;
                if (sum < 0 || sum > 150) {
                    impossible = true;
                    break;
                }
            }
        }
        if (!impossible) {
            return result;
        }
    }
    if (greenProgress === undefined) {
        greenProgress = getProgress(greenSlider);
    }
    const green = greenProgress;
    const red = getProgress(redSlider);
    const choices = calculateSteps(Object.values(stepMap), green);
    const bestResult = makePossibleEnds(expected)
        .map(calculateResult)
        .filter(v => v !== undefined)
        .sort((a, b) => a.length - b.length)[0];
    
    if (bestResult) {
        nextSteps = bestResult.map(valueToStep).reverse();
    } else {
        nextSteps = undefined;
    }
    refreshNextHints();
}
