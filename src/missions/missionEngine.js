// Mission engine: merender panel soal dari config, memvalidasi jawaban, mengelola step.
import { el, app, remove, sleep } from '../ui/dom.js';
import { MISSIONS, FEEDBACK } from '../config/gameConfig.js';
import { store } from '../game/state.js';
import { check } from '../game/validation.js';
import { toast, flash } from '../ui/screens.js';
import { sfx } from '../audio/audio.js';

const fill = (text, digits) => String(text).replace(/\{([ABCD])\}/g, (_, k) => (digits[k] ?? '?'));

/**
 * Menjalankan satu mission. Resolve ketika digit diperoleh.
 * @param {number} index  0..3
 * @param {object} hooks  { onStepCorrect(mission, step), onWrong(mission, step), onHintRequest(mission) }
 */
export function runMission(index, hooks = {}) {
  const mission = MISSIONS[index];
  return new Promise((resolve) => {
    let panel = null;

    const renderStep = () => {
      const s = store.get();
      const step = mission.steps[s.stepIndex];
      remove(panel);
      const inputs = step.inputs.map((inp) => {
        const field = el('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': `${inp.label} ${inp.suffix || ''}`, style: `width:${Math.max(64, (inp.width || 3) * 18 + 30)}px`, maxlength: inp.digits || 8, 'data-name': inp.name });
        field.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
        return { inp, field, node: el('div.inp', el('label', {}, inp.label), field, inp.suffix ? el('span', {}, inp.suffix) : null) };
      });
      const submitBtn = el('button.btn', { onclick: submit }, step.isDigit ? 'LOCK DIGIT' : 'SUBMIT CODE');
      const stepsBar = el('div.steps', ...mission.steps.map((_, i) => el('i', { class: i < s.stepIndex ? 'done' : i === s.stepIndex ? 'cur' : '' })));

      panel = el('div.mission', { role: 'region', 'aria-label': `Mission ${index + 1}` },
        el('div.head', el('div.eyebrow', {}, `MISSION ${index + 1} · ${mission.subtitle}`), el('h2.title', {}, mission.title)),
        stepsBar,
        s.stepIndex === 0 ? el('div', ...mission.intro.map((t) => el('p.narr', {}, fill(t, s.digits)))) : null,
        mission.chips ? el('div.chips', ...mission.chips.map((c) => el('span.kchip', {}, `${c.label} = ${fill(c.value, s.digits)}`))) : null,
        mission.scaffold && s.stepIndex === 0 ? renderScaffold(mission.scaffold, s.digits) : null,
        ...step.context.map((t) => el('p.narr', {}, fill(t, s.digits))),
        ...step.data.map((d) => el('div.data', d.label ? el('div.lab', {}, d.label) : null, d.text ? el('div.txt', {}, fill(d.text, s.digits)) : null, el('div.val', {}, fill(d.value, s.digits)))),
        step.formula ? el('div.formula', el('span.lab', {}, step.formula.label), ...step.formula.lines.map((l) => el('div', {}, l))) : null,
        el('p.q', {}, fill(step.question, s.digits)),
        el('div.inputs', ...inputs.map((x) => x.node), submitBtn),
      );
      app().append(panel);
      setTimeout(() => inputs[0].field.focus(), 60);

      async function submit() {
        const st = store.get();
        if (submitBtn.disabled) return;
        const empty = inputs.some((x) => x.field.value.trim() === '');
        if (empty) { inputs.forEach((x) => { if (!x.field.value.trim()) { x.field.classList.add('bad'); setTimeout(() => x.field.classList.remove('bad'), 400); } }); return; }
        const results = inputs.map((x) => check(`${mission.id}.${step.id}.${x.inp.name}`, x.field.value));
        const allOk = results.every(Boolean);
        st.attemptCount += 1;
        if (!allOk) {
          st.wrongAnswers[index] += 1; st.wrongStreak += 1; store.emit();
          inputs.forEach((x, i) => { x.field.classList.toggle('bad', !results[i]); setTimeout(() => x.field.classList.remove('bad'), 500); });
          const fb = FEEDBACK.wrong[Math.min(FEEDBACK.wrong.length - 1, st.wrongStreak - 1)];
          sfx.wrong(); toast({ title: fb.title, text: fb.text, kind: 'bad', ms: 2200 });
          hooks.onWrong && hooks.onWrong(mission, step);
          return;
        }
        st.wrongStreak = 0;
        inputs.forEach((x) => x.field.classList.add('ok'));
        submitBtn.disabled = true;
        sfx.correct();
        flash(step.isDigit ? 'rgba(247,201,72,.55)' : 'rgba(31,184,166,.5)');
        toast({ title: step.success.title || FEEDBACK.correct.title, text: step.success.text, kind: 'ok', ms: step.isDigit ? 1200 : 1900 });
        hooks.onStepCorrect && hooks.onStepCorrect(mission, step);
        await sleep(step.isDigit ? 500 : 1100);
        if (step.isDigit) {
          st.digits[mission.digit] = inputs[0].field.value.trim();
          store.emit();
          remove(panel); panel = null;
          resolve({ mission, digit: st.digits[mission.digit] });
        } else {
          st.stepIndex += 1; store.emit(); store.save();
          renderStep();
        }
      }
    };

    renderStep();
    // Expose untuk GM skip
    runMission.current = { mission, index, skip: () => { const st = store.get(); st.digits[mission.digit] = null; remove(panel); panel = null; resolve({ mission, digit: null, skipped: true }); } };
  });
}

function renderScaffold(sc, digits) {
  if (sc.type !== 'machine') return null;
  const nodes = [];
  sc.nodes.forEach((n, i) => {
    nodes.push(el('div.node', { class: n.kind }, el('b', {}, n.label), el('span', {}, fill(n.sub, digits))));
    if (i < sc.nodes.length - 1) nodes.push(el('div.arr', {}, '→'));
  });
  return el('div', el('div.eyebrow', {}, sc.title), el('div.machine', ...nodes), el('p.note', {}, sc.note));
}

export { fill };
