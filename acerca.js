const menuItems = Array.from(document.querySelectorAll('.menu-item'));
const panels = Array.from(document.querySelectorAll('.about-panel'));

function activatePanel(panelName) {
  menuItems.forEach((item) => {
    const active = item.dataset.panel === panelName;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  panels.forEach((panel) => {
    const active = panel.dataset.panel === panelName;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });
}

menuItems.forEach((item) => {
  item.addEventListener('click', () => activatePanel(item.dataset.panel));
});
