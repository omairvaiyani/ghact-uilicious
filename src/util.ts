export const getAsBoolean = (input?: string) =>
  ["true", "TRUE", "1", 1, true].includes(input);
