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
	return {
		name: 'Mayowa Ali',
		handle: handle.startsWith('@') ? handle : `@${handle}`,
		bio: 'Design Engineer',
		followers: 1280,
		following: 412,
		avatarUrl: DEFAULT_AVATAR,
		bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
	};
}
