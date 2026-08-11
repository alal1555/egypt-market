import { en } from "./en";
import { ar } from "./ar";
import type { Locale } from "../types";

const messages = { en, ar } as const;

export function getMessages(locale: Locale) {
  return messages[locale];
}

export { en, ar };
