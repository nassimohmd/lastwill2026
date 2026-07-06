import type { AppState, Question, Section } from './types';
import { evaluate } from './conditions';

/**
 * The question graph: all questions by id plus the declared section order.
 * Resolution order (docs/01-architecture.md §4.2):
 *   1. selected option's `next`
 *   2. question's `nextRules` (first matching `when` wins)
 *   3. question's default `next`
 *   4. next question in the section's declared order
 *   5. first question of the next section
 * Skip resolves via 2→5 only, never via an option.
 * Questions whose `when` is false are bypassed transparently.
 */
export class Graph {
  readonly questions: Map<string, Question>;
  readonly sections: Section[];

  constructor(questions: Question[], sections: Section[]) {
    this.questions = new Map(questions.map((q) => [q.id, q]));
    this.sections = sections;
    for (const s of sections) {
      for (const id of s.order) {
        if (!this.questions.has(id)) {
          throw new Error(`Section "${s.id}" references unknown question "${id}"`);
        }
      }
    }
  }

  get(id: string): Question {
    const q = this.questions.get(id);
    if (!q) throw new Error(`Unknown question "${id}"`);
    return q;
  }

  sectionOf(q: Question): Section {
    const s = this.sections.find((s) => s.id === q.section);
    if (!s) throw new Error(`Question "${q.id}" has unknown section "${q.section}"`);
    return s;
  }

  firstQuestionId(): string {
    return this.sections[0].order[0];
  }

  /** Next id purely by declared order (steps 4–5), ignoring the graph edges. */
  private nextInOrder(fromId: string): string | null {
    const q = this.get(fromId);
    const section = this.sectionOf(q);
    const idx = section.order.indexOf(fromId);
    if (idx >= 0 && idx < section.order.length - 1) return section.order[idx + 1];
    const sIdx = this.sections.indexOf(section);
    for (let i = sIdx + 1; i < this.sections.length; i++) {
      if (this.sections[i].order.length > 0) return this.sections[i].order[0];
    }
    return null; // end of interview
  }

  /** First question of the section after the given question's section. */
  nextSectionStart(fromId: string): string | null {
    const section = this.sectionOf(this.get(fromId));
    const sIdx = this.sections.indexOf(section);
    for (let i = sIdx + 1; i < this.sections.length; i++) {
      if (this.sections[i].order.length > 0) return this.sections[i].order[0];
    }
    return null;
  }

  /**
   * Resolve the question shown after answering `fromId`.
   * `chosenOptionId` is the picked option for single-type questions.
   * `skip: true` means the user skipped (option edges are ignored; a gate
   * question skips its whole section).
   */
  resolveNext(
    fromId: string,
    state: AppState,
    opts: { chosenOptionId?: string; skip?: boolean } = {},
  ): string | null {
    const q = this.get(fromId);
    let candidate: string | null = null;

    if (opts.skip && q.gate) {
      candidate = this.nextSectionStart(fromId);
    } else {
      if (!opts.skip && opts.chosenOptionId && q.options) {
        const opt = q.options.find((o) => o.id === opts.chosenOptionId);
        if (opt?.next) candidate = opt.next;
      }
      if (!candidate && q.nextRules) {
        for (const rule of q.nextRules) {
          if (evaluate(rule.when, { answers: state.answers })) {
            candidate = rule.goto;
            break;
          }
        }
      }
      if (!candidate && q.next) candidate = q.next;
      if (!candidate) candidate = this.nextInOrder(fromId);
    }

    return this.firstVisible(candidate, state);
  }

  /** Walk forward past questions whose `when` evaluates false. */
  firstVisible(id: string | null, state: AppState): string | null {
    let current = id;
    const seen = new Set<string>();
    while (current) {
      if (seen.has(current)) throw new Error(`Question graph cycle at "${current}"`);
      seen.add(current);
      const q = this.get(current);
      if (!q.when || evaluate(q.when, { answers: state.answers })) return current;
      // bypassed question: follow its own default routing (never option edges)
      let next: string | null = null;
      if (q.nextRules) {
        for (const rule of q.nextRules) {
          if (evaluate(rule.when, { answers: state.answers })) {
            next = rule.goto;
            break;
          }
        }
      }
      current = next ?? q.next ?? this.nextInOrder(current);
    }
    return null;
  }
}
