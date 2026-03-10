(() => {
  'use strict';

  const FILES = [
    '01genesis.json','02Éxodo.json','03Levítico.json','04Números.json','05Deuteronomio.json','06Josué.json','07Jueces.json','08Rut.json','09Samuel1.json','10Samuel2.json','11Reyes1.json','12Reyes2.json','13Crónicas1.json','14Crónicas2.json','15Esdras.json','16Nehemías.json','17Ester.json','18Job.json','19Salmos.json','20Proverbios.json','21Eclesiastes.json','22Cantares.json','23Isaías.json','24Jeremías.json','25Lamentaciones.json','26Ezequiel.json','27Daniel.json','28Oseas.json','29Joel.json','30Amós.json','31Abdías.json','32Jonás.json','33Miqueas.json','34Nahúm.json','35Habacuc.json','36Sofonías.json','37Hageo.json','38zacarias.json','39malaquias.json'
  ];

  const state = {
    loaded: false,
    loadingPromise: null,
    byHebrew: new Map(),
    byGreek: new Map()
  };

  function normalizeHebrew(value) {
    return String(value || '')
      .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
      .replace(/[\s\u05BE]/g, '')
      .trim();
  }

  function normalizeGreek(value) {
    return String(value || '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function splitGreekCandidates(value) {
    const raw = String(value || '').trim();
    if (!raw) return [];
    const candidates = raw.split(/[\s/|;,]+/g).map((part) => part.trim()).filter(Boolean);
    return candidates.length ? candidates : [raw];
  }

  function firstDefined(...values) {
    for (const value of values) {
      const text = String(value || '').trim();
      if (text) return text;
    }
    return '-';
  }

  async function loadAllTrilingual() {
    if (state.loaded) return;
    if (state.loadingPromise) return state.loadingPromise;

    state.loadingPromise = (async () => {
      const datasets = await Promise.all(FILES.map(async (name) => {
        const path = `./dic/trilingue/${encodeURIComponent(name)}`;
        try {
          const response = await fetch(path, { cache: 'force-cache' });
          if (!response.ok) return [];
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (_) {
          return [];
        }
      }));

      const rows = datasets.flat();
      rows.forEach((entry) => {
        const hebrew = firstDefined(entry?.texto_hebreo, entry?.hebreo);
        const greek = firstDefined(entry?.equivalencia_griega, entry?.gr, entry?.greek);
        const spanish = firstDefined(entry?.equivalencia_espanol, entry?.equivalencia_español, entry?.equivalencia, entry?.es);

        const hKey = normalizeHebrew(hebrew);
        if (hKey && !state.byHebrew.has(hKey)) {
          state.byHebrew.set(hKey, { hebrew, greek, spanish });
        }

        splitGreekCandidates(greek).forEach((token) => {
          const gKey = normalizeGreek(token);
          if (gKey && !state.byGreek.has(gKey)) {
            state.byGreek.set(gKey, { hebrew, greek, spanish });
          }
        });
      });

      state.loaded = true;
    })();

    return state.loadingPromise;
  }

  function getCaretPosition(x, y) {
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) return { node: pos.offsetNode, offset: pos.offset };
    }
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (range) return { node: range.startContainer, offset: range.startOffset };
    }
    return null;
  }

  function extractWordFromClick(event, isHebrew) {
    const pos = getCaretPosition(event.clientX, event.clientY);
    if (!pos?.node) return '';

    let node = pos.node;
    let offset = pos.offset;

    if (node.nodeType === Node.ELEMENT_NODE) {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
      const textNode = walker.nextNode();
      if (!textNode) return '';
      node = textNode;
      offset = Math.min(offset, (node.nodeValue || '').length);
    }

    if (node.nodeType !== Node.TEXT_NODE) return '';

    const text = String(node.nodeValue || '');
    if (!text) return '';

    const regex = isHebrew
      ? /[\u0590-\u05FF\u05BE]/
      : /[\u0370-\u03FF\u1F00-\u1FFF\u0300-\u036F]/;

    const idx = Math.max(0, Math.min(offset, Math.max(0, text.length - 1)));
    if (!regex.test(text[idx] || '') && !regex.test(text[idx - 1] || '')) return '';

    let start = idx;
    let end = idx;
    while (start > 0 && regex.test(text[start - 1])) start -= 1;
    while (end < text.length && regex.test(text[end])) end += 1;

    return text.slice(start, end).trim();
  }

  function renderQuickBox(values) {
    const heb = document.getElementById('triHeb');
    const gr = document.getElementById('triGr');
    const es = document.getElementById('triEs');
    if (!heb || !gr || !es) return;

    heb.textContent = values.hebrew || '-';
    gr.textContent = values.greek || '-';
    es.textContent = values.spanish || '-';
  }

  async function onOriginalClick(event) {
    if (event.button !== 0) return;

    const panel = document.getElementById('passageTextOrig');
    if (!panel || !panel.contains(event.target)) return;
    if (document.body.classList.contains('interlinear-mode')) return;
    if (event.target?.closest?.('.note-mark')) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    const isHebrew = panel.classList.contains('hebrew');
    const isGreek = panel.classList.contains('greek');
    if (!isHebrew && !isGreek) return;

    const clickedWord = extractWordFromClick(event, isHebrew);
    if (!clickedWord) return;

    await loadAllTrilingual();

    if (isHebrew) {
      const found = state.byHebrew.get(normalizeHebrew(clickedWord));
      renderQuickBox({
        hebrew: clickedWord,
        greek: found?.greek || '-',
        spanish: found?.spanish || '-'
      });
      return;
    }

    const found = state.byGreek.get(normalizeGreek(clickedWord));
    renderQuickBox({
      hebrew: found?.hebrew || '-',
      greek: clickedWord,
      spanish: found?.spanish || '-'
    });
  }

  document.addEventListener('click', onOriginalClick);
})();
