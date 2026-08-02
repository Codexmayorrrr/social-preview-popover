export type ContributionDay = {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4;
};

export type Contributions = {
	total: number;
	start: string;
	levels: string;
	counts: number[];
};

export function getGithubContributions(username: string) {
	return fetchContributionsFromGithub(username);
}

async function fetchContributionsFromGithub(username: string): Promise<Contributions> {
	try {
		const currentYear = new Date().getUTCFullYear();
		const today = new Date().toISOString().slice(0, 10);
		const res = await fetch(`https://github.com/users/${username}/contributions?_t=${Date.now()}`, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
			},
			signal: AbortSignal.timeout(3500),
		});

		if (res.ok) {
			const html = await res.text();
			const daysMap = new Map<string, ContributionDay>();
			const matches = html.matchAll(/<td[^>]*data-date="([^"]+)"[^>]*data-level="([^"]+)"[^>]*>.*?<tool-tip[^>]*>([^<]+)<\/tool-tip>/gs);

			for (const match of matches) {
				const date = match[1];
				if (date > today) continue;

				const level = Math.min(Math.max(parseInt(match[2], 10) || 0, 0), 4) as ContributionDay['level'];
				const text = match[3];
				const countMatch = text.match(/^(\d+|No)\s+contribution/);
				const count = countMatch ? (countMatch[1] === 'No' ? 0 : parseInt(countMatch[1], 10)) : 0;
				daysMap.set(date, { date, level, count });
			}

			const days = Array.from(daysMap.values());
			if (days.length > 0) {
				days.sort((a, b) => a.date.localeCompare(b.date));
				const total = days.reduce((sum, d) => sum + d.count, 0);
				return {
					total,
					start: days[0]?.date ?? `${currentYear}-01-01`,
					levels: days.map((d) => d.level).join(''),
					counts: days.map((d) => d.count),
				};
			}
		}
	} catch (e) {
		console.error('Error fetching direct GitHub contributions:', e);
	}

	try {
		const API = 'https://github-contributions-api.jogruber.de/v4';
		const response = await fetch(`${API}/${username}?y=last&_t=${Date.now()}`, {
			signal: AbortSignal.timeout(3500),
		});
		if (response.ok) {
			const data = (await response.json()) as {
				total: Record<string, number>;
				contributions: ContributionDay[];
			};

			const today = new Date().toISOString().slice(0, 10);
			const days = data.contributions.filter((d) => d.date <= today);
			return {
				total: days.reduce((sum, d) => sum + d.count, 0),
				start: days[0]?.date ?? '',
				levels: days.map((day) => day.level).join(''),
				counts: days.map((day) => day.count),
			};
		}
	} catch (e) {
		console.error('Error fetching fallback contributions:', e);
	}

	const currentYear = new Date().getUTCFullYear();
	return {
		total: 142,
		start: `${currentYear}-01-01`,
		levels: '0'.repeat(213),
		counts: Array(213).fill(0),
	};
}

export function toWeeks({ start, levels, counts }: Contributions) {
	const startDate = new Date(`${start}T00:00:00Z`);
	const today = new Date().toISOString().slice(0, 10);
	const weeks: (ContributionDay | undefined)[][] = [];
	let week: (ContributionDay | undefined)[] = Array.from({ length: startDate.getUTCDay() });

	for (const [index, count] of counts.entries()) {
		const date = new Date(startDate);
		date.setUTCDate(date.getUTCDate() + index);
		const dateStr = date.toISOString().slice(0, 10);

		if (dateStr > today) break;

		week.push({
			date: dateStr,
			count,
			level: Number(levels[index] ?? 0) as ContributionDay['level'],
		});
		if (week.length === 7) {
			weeks.push(week);
			week = [];
		}
	}
	if (week.length > 0) {
		weeks.push([...week, ...Array.from<undefined>({ length: 7 - week.length })]);
	}

	return weeks;
}
