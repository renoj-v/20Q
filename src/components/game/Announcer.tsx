/** NFR-4: polite live region for new questions, guesses, and state changes. */
export function Announcer({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
