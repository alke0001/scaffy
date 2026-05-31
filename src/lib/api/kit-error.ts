export function isKitErrorBody(value: unknown): value is { message: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'message' in value &&
		typeof (value as { message: unknown }).message === 'string'
	);
}

export async function parseKitErrorMessage(res: Response): Promise<string> {
	const text = await res.text();
	try {
		const body: unknown = JSON.parse(text);
		return isKitErrorBody(body) ? body.message : text || res.statusText;
	} catch {
		return text || res.statusText;
	}
}

export async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
	const res = await fetch(url, init);
	if (!res.ok) {
		throw new Error(await parseKitErrorMessage(res));
	}
	return (await res.json()) as T;
}
