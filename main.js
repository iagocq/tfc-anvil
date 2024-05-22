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
const stepNames = Object.keys(stepMap);
const valuesToStep = {};
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

const stepsEl = document.querySelectorAll('.steps > *');
const performedEls = [...stepsEl].map(e => e.getElementsByClassName('performed')[0]);

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
        }
    });

    if (greenProgress < 0 || greenProgress > 150) {
        steps = [];
        greenProgress = 0;
    }

    updateProgress(greenSlider, greenProgress);
    updateSteps();
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
            refreshSteps();
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

function refreshSteps() {
    const green = getProgress(greenSlider);
    const red = getProgress(redSlider);
    const choices = calculateSteps(Object.values(stepMap), green);

    function findGoodSolution(target, ending, include = []) {
        const steps = choices[target];
        if (!steps || steps.length == 0) return;

        const stepsMustMatch = steps.slice(-ending.length);

        const allMatch = ending.every(v => stepsMustMatch.includes(v));
        if (allMatch) {
            const stepsSlice = ending.length == 0 ? steps : steps.slice(0, -ending.length);
            return stepsSlice.concat(ending, include.reverse());
        } else {
            const newEnding = [...ending];
            const last = newEnding.pop();
            return findGoodSolution(target - last, newEnding, include.concat(last));
        }
    };

    const mustTake = [-15, 16];

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

    if (impossible) {
        nextSteps = undefined;
    } else {
        nextSteps = result.map(valueToStep);
    }
    refreshNextSteps();
}

function refreshNextSteps() {
    console.log(nextSteps);
}