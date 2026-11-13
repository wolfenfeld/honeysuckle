// Math exercise generators, shared by the math room and friend challenges.
// MathGen.make()          -> generators using Math.random (free play)
// MathGen.make(MathGen.seeded(seed)) -> the same exercises for the same seed (challenges)
(function () {
  function seeded(a) { // mulberry32
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function make(rand) {
    rand = rand || Math.random;
    const rnd = (a, b) => a + Math.floor(rand() * (b - a + 1));
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let parPool = [], wPool = [];
    return {
      add() { const a = rnd(1200, 6999), b = rnd(1100, 9800 - a); return { ex: `${a} + ${b}`, ans: a + b }; },
      sub() {
        let a, b;
        if (rand() < 0.35) { a = rnd(3, 9) * 1000 + pick([0, 0, rnd(1, 9), rnd(10, 99)]); }
        else a = rnd(3000, 9899);
        b = rnd(1000, a - 200);
        return { ex: `${a} − ${b}`, ans: a - b };
      },
      mul() {
        const t = rnd(0, 3);
        if (t === 0) { const a = rnd(12, 99), b = rnd(3, 9); return { ex: `${a} × ${b}`, ans: a * b }; }
        if (t === 1) { const a = rnd(102, 399), b = rnd(2, 6); return { ex: `${a} × ${b}`, ans: a * b }; }
        if (t === 2) { const a = rnd(2, 9) * 10, b = rnd(2, 9) * 10; return { ex: `${a} × ${b}`, ans: a * b }; }
        const a = rnd(12, 99), b = pick([10, 100]); return { ex: `${a} × ${b}`, ans: a * b };
      },
      div() {
        const t = rnd(0, 2);
        if (t === 0) { const d = rnd(2, 9), q = rnd(11, 40); return { ex: `${q * d} ÷ ${d}`, ans: q }; }
        if (t === 1) { const d = rnd(3, 9), q = rnd(21, 99); return { ex: `${q * d} ÷ ${d}`, ans: q }; }
        const d = rnd(2, 9) * 10, q = rnd(2, 9) * 10; return { ex: `${q * d} ÷ ${d}`, ans: q };
      },
      par() {
        const T = [
          () => { const a = rnd(10, 40), b = rnd(5, 30), c = rnd(2, 6); return [`(${a} + ${b}) × ${c}`, (a + b) * c]; },
          () => { const a = rnd(10, 40), b = rnd(5, 30), c = rnd(2, 6); return [`${a} + ${b} × ${c}`, a + b * c]; },
          () => { const c = rnd(2, 5), b = rnd(5, 20), a = b * c + rnd(5, 40); return [`${a} − ${b} × ${c}`, a - b * c]; },
          () => { const b = rnd(10, 40), a = b + rnd(5, 40), c = rnd(2, 6); return [`(${a} − ${b}) × ${c}`, (a - b) * c]; },
          () => { const a = rnd(2, 9), b = rnd(3, 9), c = rnd(2, 9), d = rnd(3, 9); return [`${a} × ${b} + ${c} × ${d}`, a * b + c * d]; },
          () => { const a = rnd(3, 9), b = rnd(2, 9), d = rnd(2, 8), c = d + rnd(2, 6); return [`(${a} + ${b}) × (${c} − ${d})`, (a + b) * (c - d)]; },
          () => { const a = rnd(2, 6), c = rnd(5, 20), b = c + rnd(5, 25), d = rnd(5, 30); return [`${a} × (${b} − ${c}) + ${d}`, a * (b - c) + d]; },
          () => { const b = rnd(2, 9), q = rnd(3, 12), c = rnd(5, 40); return [`${q * b} ÷ ${b} + ${c}`, q + c]; },
          () => { const b = rnd(2, 6), c = rnd(2, 6), q = rnd(3, 10); return [`${q * b * c} ÷ (${b} × ${c})`, q]; },
        ];
        if (!parPool.length) parPool = shuffle(T);
        const [ex, ans] = parPool.pop()(); return { ex, ans };
      },
      word() {
        const T = [
          () => { const a = rnd(4, 9), b = rnd(12, 35); return [`ביער הגשם יש ${a} עצים גבוהים, ועל כל עץ יושבים ${b} תוכים. כמה תוכים יש על כל העצים?`, a * b]; },
          () => { const a = rnd(30, 60), b = rnd(5, a - 10), c = rnd(5, 20); return [`באוטובוס לטיול היו ${a} ילדים. בתחנה הראשונה ירדו ${b} ילדים ועלו ${c}. כמה ילדים יש עכשיו באוטובוס?`, a - b + c]; },
          () => { const n = rnd(2, 5), p = rnd(4, 9), s = n * p < 50 ? 50 : 100; return [`בחנות קנו ${n} מחברות, כל מחברת עולה ${p} ₪. שילמו בשטר של ${s} ₪. כמה עודף קיבלו?`, s - n * p]; },
          () => { const k = rnd(3, 9), q = rnd(6, 15); return [`${k * q} בננות חולקו שווה בשווה בין ${k} קופים. כמה בננות קיבל כל קוף?`, q]; },
          () => { const a = rnd(120, 480), b = rnd(20, 90); return [`ביום ראשון נסעה משפחה ${a} ק״מ, וביום שני נסעה ${b} ק״מ יותר מביום ראשון. כמה ק״מ נסעו בשני הימים יחד?`, a + a + b]; },
          () => { const r = rnd(6, 12), c = rnd(10, 25), x = rnd(5, 30); return [`בחורשה יש ${r} שורות של עצים, ובכל שורה ${c} עצים. ${x} עצים נכרתו. כמה עצים נשארו?`, r * c - x]; },
          () => { const w = rnd(3, 8); return [`צפרדע קופצת ${w * 3} פעמים בכל דקה. כמה פעמים תקפוץ ב-${w} דקות?`, w * 3 * w]; },
          () => { const t = rnd(1500, 4500), s = rnd(300, 1200); return [`בספריית בית הספר היו ${t} ספרים. השנה קנו עוד ${s} ספרים. כמה ספרים יש עכשיו בספרייה?`, t + s]; },
        ];
        if (!wPool.length) wPool = shuffle(T);
        const [ex, ans] = wPool.pop()(); return { ex, ans };
      },
    };
  }
  window.MathGen = { make, seeded };
})();
