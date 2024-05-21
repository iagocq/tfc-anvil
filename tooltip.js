var tooltipText = "";

const [tooltip] = document.getElementsByClassName('tooltip');

document.addEventListener('mousemove', ev => {
    tooltip.classList = ['tooltip'];

    const el = ev.target;
    const box = el.getBoundingClientRect();
    const style = window.getComputedStyle(tooltip);
    const scale = style.getPropertyValue('--gui-scale');
    const x = box.left / scale + Math.floor((ev.x - box.left) / scale) + 4;
    const y = box.top / scale + Math.floor((ev.y - box.top) / scale) + 4;
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
});
