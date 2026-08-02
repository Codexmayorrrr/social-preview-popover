export async function getGithubProfile(username: string) {
	try {
		const res = await fetch(`https://api.github.com/users/${username}`);
		if (res.ok) {
			const data = await res.json();
			return {
				name: data.name || data.login,
				login: data.login,
				bio: data.bio || 'Software Engineer',
				location: data.location || 'Remote',
				avatarUrl: data.avatar_url,
			};
		}
	} catch (e) {
		console.error('Error fetching GitHub profile:', e);
	}
	return {
		name: 'Ali Ayooluwabamidele',
		login: username,
		bio: 'Design Engineer & Fullstack Developer',
		location: 'Remote',
		avatarUrl: 'https://github.com/Codexmayorrrr.png',
	};
}

export async function getXProfile(handle: string) {
	return {
		name: 'Ali Ayooluwabamidele',
		handle: handle,
		bio: 'Building smooth liquid UI components & scalable web apps.',
		followers: 1280,
		following: 412,
		avatarUrl: 'https://github.com/Codexmayorrrr.png',
		bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
	};
}
