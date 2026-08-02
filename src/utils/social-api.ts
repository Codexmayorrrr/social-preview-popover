export async function getGithubProfile(username: string) {
	try {
		const res = await fetch(`https://api.github.com/users/${username}`);
		if (res.ok) {
			const data = await res.json();
			return {
				name: data.name || data.login || 'Ayooluwabamidele',
				login: data.login || username,
				bio: data.bio || 'Design Engineer',
				location: data.location || 'Remote',
				avatarUrl: data.avatar_url || 'https://avatars.githubusercontent.com/u/128181481?v=4',
			};
		}
	} catch (e) {
		console.error('Error fetching GitHub profile:', e);
	}
	return {
		name: 'Ayooluwabamidele',
		login: username,
		bio: 'Design Engineer',
		location: 'Remote',
		avatarUrl: 'https://avatars.githubusercontent.com/u/128181481?v=4',
	};
}

export async function getXProfile(handle: string) {
	return {
		name: 'Ayooluwabamidele',
		handle: handle.startsWith('@') ? handle : `@${handle}`,
		bio: 'Design Engineer',
		followers: 1280,
		following: 412,
		avatarUrl: 'https://avatars.githubusercontent.com/u/128181481?v=4',
		bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
	};
}
