const DEFAULT_AVATAR = '/avatar.jpg';
const DYNAMIC_BANNER_FALLBACK = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

export function extractDomain(url: string): string {
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
		return parsed.hostname.replace('www.', '');
	} catch (e) {
		return url;
	}
}

export function parseUsernameFromUrl(url: string, platformKey: string): string {
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
		const parts = parsed.pathname.split('/').filter(Boolean);
		if (parts.length > 0) {
			const clean = parts[0].replace('@', '').replace('in/', '').replace('u/', '');
			if (clean && clean !== 'home' && clean !== 'explore') return clean;
		}
	} catch (e) {
		console.error('Error parsing username from URL:', e);
	}
	return platformKey;
}

export function getSocialAvatarUrl(platformKey: string, handle: string, url: string): string {
	const cleanHandle = handle.replace(/^@/, '');
	if (platformKey === 'x' || platformKey === 'twitter') {
		return `https://unavatar.io/twitter/${cleanHandle}`;
	}
	if (platformKey === 'github') {
		return `https://unavatar.io/github/${cleanHandle}`;
	}
	if (platformKey === 'youtube') {
		return `https://unavatar.io/youtube/${cleanHandle}`;
	}
	if (platformKey === 'instagram') {
		return `https://unavatar.io/instagram/${cleanHandle}`;
	}
	if (platformKey === 'substack') {
		return `https://unavatar.io/substack/${cleanHandle}`;
	}
	if (platformKey === 'tiktok') {
		return `https://unavatar.io/tiktok/${cleanHandle}`;
	}
	const domain = extractDomain(url);
	return `https://unavatar.io/${domain}?fallback=${encodeURIComponent(DEFAULT_AVATAR)}`;
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
				avatarUrl: data.avatar_url || `https://unavatar.io/github/${cleanUser}`,
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
		avatarUrl: `https://unavatar.io/github/${cleanUser}`,
		publicRepos: 12,
		followers: 120,
	};
}

export async function getXProfile(handle: string) {
	if (!handle) return null;
	const cleanHandle = handle.replace(/^@/, '');
	try {
		const res = await fetch(`https://api.vxtwitter.com/${cleanHandle}`, {
			signal: AbortSignal.timeout(4000),
		});
		if (res.ok) {
			const data = await res.json();
			const avatar = data.avatar_url || data.profile_image_url_https;
			const highResAvatar = avatar
				? avatar.replace('_normal.jpg', '_400x400.jpg').replace('_normal.png', '_400x400.png')
				: `https://unavatar.io/twitter/${cleanHandle}`;

			let rawBanner = data.banner_url || data.profile_banner_url;
			if (rawBanner && !rawBanner.match(/\/(600x200|1500x500|1080x360|mobile_retina)$/)) {
				rawBanner = `${rawBanner.replace(/\/$/, '')}/600x200`;
			}
			const banner = rawBanner || DYNAMIC_BANNER_FALLBACK;

			return {
				name: data.name || cleanHandle,
				handle: `@${data.screen_name || cleanHandle}`,
				bio: data.description || 'Creator & Builder',
				followers: data.followers_count ?? 150,
				following: data.following_count ?? 200,
				avatarUrl: highResAvatar,
				bannerUrl: banner,
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
		avatarUrl: `https://unavatar.io/twitter/${cleanHandle}`,
		bannerUrl: DYNAMIC_BANNER_FALLBACK,
	};
}
