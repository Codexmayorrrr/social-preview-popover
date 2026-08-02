const DEFAULT_AVATAR = 'https://media.licdn.com/dms/image/v2/D4D03AQFELmPgapFo2A/profile-displayphoto-crop_800_800/B4DZzJqvP1JoAI-/0/1772909972143?e=1787184000&v=beta&t=87CEe08Uw0QI06SL9KszajmR5KT35ujas9BGmsOZTt4';

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
