// Shared by the browser and API. IDs are stable even when titles change.
export const chapters = [
  { id: 'think-differently', path: '/chapters/01-think-differently.html', title: 'Think Differently!', recap: 'Welcome! You do not need to know any programming. Follow the examples, try things and keep going. We will return to every important idea.', beginner: 'A program describes something for a computer. In Prolog, we will describe relationships and ask questions about them.', imperative: 'Your programming experience is useful, but do not translate every loop or assignment. Give yourself time to build a new mental model.', prolog: 'Start with fresh eyes. Familiar syntax does not always mean that the relational way of thinking has become familiar.' },
  { id: 'facts-and-rules', path: '/chapters/02-facts-and-rules.html', title: 'Facts & Rules', recap: 'Previously: Prolog asks us to describe relationships and ask questions. You do not need to control every step yourself.', beginner: 'A fact states a relationship. A rule explains when another relationship holds. Read the small examples aloud.', imperative: 'Read a rule as an implication, rather than an instruction that assigns a value or updates a variable.', prolog: 'Practise reading each clause as a statement about a relation before considering its execution.' },
  { id: 'questions-and-variables', path: '/chapters/03-questions-and-variables.html', title: 'Questions & Variables', recap: 'Facts describe relationships. Rules describe implications. A comma between goals means that both must hold.', beginner: 'A query is a question. A variable lets us ask about something we do not know yet.', imperative: 'A Prolog variable is not a mutable storage box. Within one solution, its occurrences must be consistent with the same term.', prolog: 'Try a query with several answers. Distinguish requesting another solution from changing a variable inside the current solution.' },
  { id: 'natural-numbers', path: '/chapters/04-natural-numbers.html', title: 'Natural Numbers', recap: 'Facts and rules describe relations. Queries ask whether a relation holds or which terms make it hold. Variables can connect goals.', beginner: 'Copy the first program and run the suggested query. Then change one small thing. Understanding will grow through these experiments.', imperative: 'Here s(N) is a symbolic term, not an instruction to increment N. Look for a base case and a rule relating a number to a smaller structure.', prolog: 'Compare checking natural(s(s(0))) with generating natural(X). Watch how the same definition supports different questions.' },
  { id: 'sudoku', path: '/chapters/05-sudoku-the-logic-way.html', title: 'Sudoku, the Logic Way!', recap: 'A recursive definition can describe infinitely many finite terms. A base case and a recursive case work together. The same relation may check or generate answers.', beginner: 'This is a guided preview of constraints. Follow the examples; you are not expected to write this solver from scratch.', imperative: 'Constraints describe permitted values and relationships. Search then explores assignments consistent with them. Notice the separation between description and search.', prolog: 'Compare ordinary term unification with constraints over integer domains. This chapter introduces the distinction through experiments.' }
];
export const experiences = ['beginner', 'imperative', 'prolog'];
export function prefix(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  for (const chapter of chapters) {
    if (!value.includes(chapter.id)) break;
    result.push(chapter.id);
  }
  return result;
}
export function canAccess(completed, id) {
  const index = chapters.findIndex(c => c.id === id);
  return index >= 0 && index <= prefix(completed).length;
}
export function complete(completed, id) {
  if (!canAccess(completed, id)) throw new Error('Finish the previous chapter first.');
  return prefix([...prefix(completed), id]);
}
export function mergeProgress(a, b) {
  return prefix([...prefix(a), ...prefix(b)]);
}
