import "@testing-library/jest-dom/vitest";
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./mocks/server.ts";

const popoverState = new WeakMap<HTMLElement, boolean>();

// Keep a reference to the original `matches` so we can call it without recursion
const originalMatches = HTMLElement.prototype.matches;

HTMLElement.prototype.showPopover = function () {
  popoverState.set(this, true);
};

HTMLElement.prototype.hidePopover = function () {
  popoverState.set(this, false);
};

// Override matches – use `as any` to avoid the type predicate signature conflict
(HTMLElement.prototype as any).matches = function (
  this: HTMLElement,
  selector: string,
): boolean {
  if (selector === ":popover-open") {
    return popoverState.get(this) === true;
  }
  return originalMatches.call(this, selector);
};

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
