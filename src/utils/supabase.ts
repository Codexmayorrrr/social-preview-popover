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
 * Universal Google 1-Click Sign-In
 */
export async function signInWithGoogle() {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${window.location.origin}/auth/callback`,
		},
	});
	if (error) throw error;
	return data;
}

/**
 * Bulk save or migrate local draft links to Supabase
 */
export async function syncDraftLinksToSupabase(userId: string, items: any[]) {
	try {
		const formatted = items.map((item, index) => ({
			user_id: userId,
			platform_key: item.key,
			url: item.url,
			position: index,
			is_active: true,
		}));

		const { data, error } = await supabase
			.from('links')
			.upsert(formatted, { onConflict: 'id' });

		if (error) throw error;
		return data;
	} catch (e) {
		console.error('Error syncing links to Supabase:', e);
		return null;
	}
}
