export function prettifyString(input: string): string {
  if (!input) return "";

  const spaced = input.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

  return spaced
    .split(" ")
    .filter((word) => word.length > 0) // Remove any empty strings from double spaces
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
export function validatorParseErrors(errors: string[]) {
  const newErrors: string[] = [];
  for (let error of errors) {
    error = error.substring(error.indexOf('"') + 1);

    const fieldName = prettifyString(error.substring(0, error.indexOf('"')));

    error = error.substring(error.indexOf("]") + 2);
    error = error.charAt(0).toUpperCase() + error.slice(1).toLocaleLowerCase();

    newErrors.push(`${fieldName} ${error}`);
  }
  return newErrors;
}
