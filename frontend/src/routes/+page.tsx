import { Link } from "wouter";

export function Root() {
  return (
    <div>
      <p>This is the root</p>
      <Link href="/home">Go to home</Link>
    </div>
  );
}
