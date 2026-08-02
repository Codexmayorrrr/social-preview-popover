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
	const currentYear = new Date().getUTCFullYear();
	try {
		const [resGraph, resEvents] = await Promise.allSettled([
			fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last&_t=${Date.now()}`, {
				signal: AbortSignal.timeout(4500),
			}),
			fetch(`https://api.github.com/users/${username}/events?_t=${Date.now()}`, {
				headers: {
					'User-Agent': 'Mozilla/5.0',
					'Accept': 'application/vnd.github.v3+json',
				},
				signal: AbortSignal.timeout(4500),
			}),
		]);

		let baseDays: ContributionDay[] = [];
		if (resGraph.status === 'fulfilled' && resGraph.value.ok) {
			const data = (await resGraph.value.json()) as { contributions: ContributionDay[] };
			baseDays = data.contributions || [];
		}

		if (baseDays.length === 0) {
			const today = new Date();
			const startDate = new Date(today);
			startDate.setUTCDate(startDate.getUTCDate() - 364);
			baseDays = Array.from({ length: 365 }, (_, i) => {
				const d = new Date(startDate);
				d.setUTCDate(d.getUTCDate() + i);
				return { date: d.toISOString().slice(0, 10), count: 0, level: 0 };
			});
		}

		const daysMap = new Map<string, ContributionDay>();
		for (const d of baseDays) {
			daysMap.set(d.date, { date: d.date, count: d.count || 0, level: (d.level || 0) as ContributionDay['level'] });
		}

		if (resEvents.status === 'fulfilled' && resEvents.value.ok) {
			const events = (await resEvents.value.json()) as any[];
			if (Array.isArray(events)) {
				for (const event of events) {
					if (!event.created_at) continue;
					const date = event.created_at.slice(0, 10);
					let dayItem = daysMap.get(date);
					if (!dayItem) {
						dayItem = { date, count: 0, level: 0 };
						daysMap.set(date, dayItem);
					}

					const addCount = event.type === 'PushEvent' ? Math.max(event.payload?.commits?.length || 1, 1) : 1;
					dayItem.count += addCount;
					dayItem.level = Math.min(Math.max(Math.ceil(dayItem.count / 3), 1), 4) as ContributionDay['level'];
				}
			}
		}

		const today = new Date().toISOString().slice(0, 10);
		const days = Array.from(daysMap.values()).filter((d) => d.date <= today);
		days.sort((a, b) => a.date.localeCompare(b.date));

		const total = days.reduce((sum, d) => sum + d.count, 0);

		return {
			total,
			start: days[0]?.date ?? `${currentYear}-01-01`,
			levels: days.map((d) => d.level).join(''),
			counts: days.map((d) => d.count),
		};
	} catch (e) {
		console.error('Error fetching GitHub contributions and events:', e);
	}

	const today = new Date();
	const past = new Date(today);
	past.setUTCDate(past.getUTCDate() - 364);

	return {
		total: 120,
		start: past.toISOString().slice(0, 10),
		levels: '0'.repeat(364),
		counts: Array(364).fill(0),
	};
}

export function toWeeks(contributions: Contributions) {
	const today = new Date();
	let start = contributions?.start;
	let levels = contributions?.levels;
	let counts = contributions?.counts;

	if (!counts || counts.length === 0 || !start || isNaN(Date.parse(start))) {
		const past = new Date(today);
		past.setUTCDate(past.getUTCDate() - 364);
		start = past.toISOString().slice(0, 10);
		counts = Array(364).fill(0);
		levels = '0'.repeat(364);
	}

	const startDate = new Date(`${start}T00:00:00Z`);
	const todayStr = today.toISOString().slice(0, 10);
	const weeks: (ContributionDay | undefined)[][] = [];
	const startDay = isNaN(startDate.getUTCDay()) ? 0 : startDate.getUTCDay();
	let week: (ContributionDay | undefined)[] = Array.from({ length: startDay });

	for (const [index, count] of counts.entries()) {
		const date = new Date(startDate);
		date.setUTCDate(date.getUTCDate() + index);
		const dateStr = date.toISOString().slice(0, 10);

		if (dateStr > todayStr) break;

		week.push({
			date: dateStr,
			count,
			level: Number(levels?.[index] ?? 0) as ContributionDay['level'],
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
