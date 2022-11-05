export function cx(...classNames: (string | boolean)[]): string {
	return classNames.filter((name) => name).join(' ');
}
