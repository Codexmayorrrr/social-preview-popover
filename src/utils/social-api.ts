const DEFAULT_AVATAR = '/avatar.jpg';

export async function getGithubProfile(username: string) {
	try {
		const res = await fetch(`https://api.github.com/users/${username}`);
		if (res.ok) {
			const data = await res.json();
			return {
				name: data.name || 'Mayowa Ali',
				login: data.login || username,
				bio: data.bio || 'Design Engineer',
				location: data.location || 'Remote',
				avatarUrl: DEFAULT_AVATAR,
			};
		}
	} catch (e) {
		console.error('Error fetching GitHub profile:', e);
	}
	return {
		name: 'Mayowa Ali',
		login: username,
		bio: 'Design Engineer',
		location: 'Remote',
		avatarUrl: DEFAULT_AVATAR,
	};
}

export async function getXProfile(handle: string) {
	const cleanHandle = handle.replace(/^@/, '');
	try {
		const res = await fetch(`https://api.vxtwitter.com/${cleanHandle}`, {
			signal: AbortSignal.timeout(3500),
		});
		if (res.ok) {
			const data = await res.json();
			return {
				name: data.name || 'Ali',
				handle: `@${data.screen_name || cleanHandle}`,
				bio: data.description || 'design engineer• writer • pre-liquid • building @jaradeckhq',
				followers: data.followers_count ?? 115,
				following: data.following_count ?? 353,
				avatarUrl: DEFAULT_AVATAR,
				bannerUrl: data.banner_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
			};
		}
	} catch (e) {
		console.error('Error fetching X profile from vxtwitter:', e);
	}
	return {
		name: 'Ali',
		handle: `@${cleanHandle}`,
		bio: 'design engineer• writer • pre-liquid • building @jaradeckhq',
		followers: 115,
		following: 353,
		avatarUrl: DEFAULT_AVATAR,
		bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
	};
}
