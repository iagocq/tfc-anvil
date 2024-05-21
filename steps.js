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

let steps = [];
let greenProgress = 0;

const allActions = document.querySelectorAll('.all-actions [data-tooltip]');
allActions.forEach(el => el.addEventListener('click', ev => {
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

    updateProgress();
    updateSteps();
}));

const greenSlider = document.querySelector('.green.slider');

function updateProgress() {
    greenSlider.style.setProperty('--slider-progress', greenProgress);
}

const stepsEl = document.querySelectorAll('.steps > *');
const performedEls = [...stepsEl].map(e => e.getElementsByClassName('performed')[0]);

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
