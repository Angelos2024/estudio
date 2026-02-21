/* Auto-generated split from busquedax.js (es) */
  function getSpanishRefs(normalized, index) {
    if (!normalized) return [];
    const tokensMap = index.tokens || {};
    const direct = tokensMap[normalized] || [];
    const refs = direct.slice();
    const seen = new Set(refs);

    // Rendimiento: buckets por prefijo (2 letras) construidos una sola vez.
    if (!index.__tokenBucketsBuilt) {
      const buckets = new Map();
      Object.keys(tokensMap).forEach((tok) => {
        const t = String(tok || '');
        if (!t) return;
        const key = t.slice(0, 2);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(t);
      });
      index.__tokenBuckets = buckets;
      index.__tokenBucketsBuilt = true;
    }

    const buckets = index.__tokenBuckets || new Map();
    const prefixKey = normalized.slice(0, 2);
    const candidates = buckets.get(prefixKey) || [];

    // Coincidencia parcial: token que contiene el término (mar => marcos, marítimo, etc.)
    for (let i = 0; i < candidates.length; i += 1) {
      const token = candidates[i];
      if (!token || token === normalized) continue;
      if (!token.includes(normalized)) continue;
      const matches = tokensMap[token] || [];
      for (let j = 0; j < matches.length; j += 1) {
        const ref = matches[j];
        if (seen.has(ref)) continue;
        seen.add(ref);
        refs.push(ref);
      }
    }

    return refs;
  }
