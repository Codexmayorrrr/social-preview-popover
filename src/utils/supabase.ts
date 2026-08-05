import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
	import.meta.env.VITE_SUPABASE_URL ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
	'https://vsuwmquyecfrssrwqhub.supabase.co';

const SUPABASE_ANON_KEY =
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
	'sb_publishable_ZDNdhu0NfHw2wwZCbH9Aww_wrqkOjXH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch public user profile and active links by handle (e.g. "mayowa")
 */
export async function getProfileByHandle(handle: string) {
	try {
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('*')
			.eq('handle', handle.toLowerCase())
			.single();

		if (userError || !user) return null;

		const { data: links, error: linksError } = await supabase
			.from('links')
			.select('*')
			.eq('user_id', user.id)
			.eq('is_active', true)
			.order('position', { ascending: true });

		if (linksError) return { user, links: [] };

		return { user, links };
	} catch (e) {
		console.error('Error fetching Supabase profile:', e);
		return null;
	}
}

/**
 * Fetch user profile by google_id
 */
export async function getProfileByGoogleId(googleId: string) {
	try {
		const { data: user, error } = await supabase
			.from('users')
			.select('*')
			.eq('google_id', googleId)
			.single();
		if (error || !user) return null;
		return user;
	} catch (e) {
		console.error('Error fetching profile by google_id:', e);
		return null;
	}
}

/**
 * Universal Google 1-Click Sign-In
 */
export async function signInWithGoogle() {
	const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5050';
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${currentOrigin}/join`,
		},
	});
	if (error) throw error;
	return data;
}

/**
 * Sign out current user
 */
export async function signOutUser() {
	const { error } = await supabase.auth.signOut();
	if (error) console.error('Error signing out:', error);
}

/**
 * Get active Supabase session
 */
export async function getCurrentUser() {
	const { data } = await supabase.auth.getUser();
	return data.user;
}

/**
 * Sync or Create User Profile and Bulk Save Links in Supabase
 */
export async function syncUserAndLinksToDatabase(
	authUser: any,
	handle: string,
	bioData: { displayName: string; role: string; location: string; workStyle: string; specialties: string },
	items: any[]
) {
	if (!authUser) return null;

	try {
		// 1. Upsert User Record
		const userPayload = {
			google_id: authUser.id,
			email: authUser.email,
			handle: handle.toLowerCase(),
			display_name: bioData.displayName || authUser.user_metadata?.full_name || `@${handle}`,
			bio: `${bioData.role || ''} | ${bioData.location || ''} | ${bioData.specialties || ''}`,
			avatar_url: authUser.user_metadata?.avatar_url || '',
			updated_at: new Date().toISOString(),
		};

		const { data: dbUser, error: userErr } = await supabase
			.from('users')
			.upsert(userPayload, { onConflict: 'google_id' })
			.select()
			.single();

		if (userErr) {
			console.error('Error upserting user:', userErr);
			return null;
		}

		// 2. Bulk Insert/Update Links
		if (dbUser && items.length > 0) {
			const formattedLinks = items.map((item, index) => ({
				user_id: dbUser.id,
				platform_key: item.key,
				url: item.url,
				position: index,
				is_active: true,
			}));

			const { error: linksErr } = await supabase
				.from('links')
				.upsert(formattedLinks, { onConflict: 'id' });

			if (linksErr) console.error('Error upserting links:', linksErr);
		}

		return dbUser;
	} catch (e) {
		console.error('Error in syncUserAndLinksToDatabase:', e);
		return null;
	}
}
