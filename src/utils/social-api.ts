const DEFAULT_AVATAR = '/avatar.jpg';
const DEFAULT_BANNER = '/banner.jpg';

export function parseUsernameFromUrl(url: string, platformKey: string): string {
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
		const parts = parsed.pathname.split('/').filter(Boolean);
		if (parts.length > 0) {
			const clean = parts[0].replace('@', '');
			if (clean) return clean;
		}
	} catch (e) {
		console.error('Error parsing username from URL:', e);
	}
	return platformKey;
}

export async function getGithubProfile(username: string) {
	if (!username) return null;
	const cleanUser = username.replace('@', '');
	try {
		const res = await fetch(`https://api.github.com/users/${cleanUser}`);
		if (res.ok) {
			const data = await res.json();
			return {
				name: data.name || data.login || cleanUser,
				login: data.login || cleanUser,
				bio: data.bio || 'Developer & Creator',
				location: data.location || 'Remote',
				avatarUrl: data.avatar_url || DEFAULT_AVATAR,
				publicRepos: data.public_repos || 0,
				followers: data.followers || 0,
			};
		}
	} catch (e) {
		console.error('Error fetching GitHub profile:', e);
	}
	return {
		name: cleanUser,
		login: cleanUser,
		bio: 'Developer & Creator',
		location: 'Remote',
		avatarUrl: DEFAULT_AVATAR,
		publicRepos: 12,
		followers: 120,
	};
}

export async function getXProfile(handle: string) {
	if (!handle) return null;
	const cleanHandle = handle.replace(/^@/, '');
	try {
		const res = await fetch(`https://api.vxtwitter.com/${cleanHandle}`, {
			signal: AbortSignal.timeout(3500),
		});
		if (res.ok) {
			const data = await res.json();
			return {
				name: data.name || cleanHandle,
				handle: `@${data.screen_name || cleanHandle}`,
				bio: data.description || 'Creator & Builder',
				followers: data.followers_count ?? 150,
				following: data.following_count ?? 200,
				avatarUrl: data.avatar_url || DEFAULT_AVATAR,
				bannerUrl: data.banner_url || DEFAULT_BANNER,
			};
		}
	} catch (e) {
		console.error('Error fetching X profile from vxtwitter:', e);
	}
	return {
		name: cleanHandle,
		handle: `@${cleanHandle}`,
		bio: 'Creator & Builder',
		followers: 150,
		following: 200,
		avatarUrl: DEFAULT_AVATAR,
		bannerUrl: DEFAULT_BANNER,
	};
}
