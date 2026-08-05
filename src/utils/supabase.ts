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
			.maybeSingle();

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
 * Check if a handle is available or taken by another user
 */
export async function checkHandleAvailability(
	handle: string,
	currentGoogleId?: string
): Promise<{ available: boolean; ownerId?: string }> {
	if (!handle || !handle.trim()) return { available: true };
	const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
	if (!cleanHandle) return { available: true };

	try {
		const { data: user, error } = await supabase
			.from('users')
			.select('id, google_id, handle')
			.eq('handle', cleanHandle)
			.maybeSingle();

		if (error || !user) {
			return { available: true };
		}

		if (currentGoogleId && user.google_id === currentGoogleId) {
			return { available: true, ownerId: user.google_id };
		}

		return { available: false, ownerId: user.google_id };
	} catch (e) {
		console.error('Error checking handle availability:', e);
		return { available: true };
	}
}

/**
 * Fetch user profile by Auth User (matching google_id or email)
 */
export async function getProfileByAuthUser(authUser: any) {
	if (!authUser) return null;

	try {
		const { data: user, error } = await supabase
			.from('users')
			.select('*')
			.or(`google_id.eq.${authUser.id},email.eq.${authUser.email}`)
			.maybeSingle();

		if (error || !user) return null;
		return user;
	} catch (e) {
		console.error('Error fetching profile by auth user:', e);
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
 * ENFORCES STRICT 1 EMAIL = 1 HANDLE RULE
 */
export async function syncUserAndLinksToDatabase(
	authUser: any,
	requestedHandle: string,
	bioData: { displayName: string; role: string; location: string; workStyle: string; specialties: string },
	items: any[]
) {
	if (!authUser) return null;

	try {
		// 1. Check if user already exists (by google_id or email)
		const existingProfile = await getProfileByAuthUser(authUser);

		// STRICT 1 EMAIL = 1 HANDLE RULE:
		// If user already owns a handle in DB, preserve their primary registered handle!
		const finalHandle = (existingProfile && existingProfile.handle)
			? existingProfile.handle.toLowerCase()
			: requestedHandle.toLowerCase().replace(/[^a-z0-9_-]/g, '');

		if (!finalHandle) return null;

		const userPayload = {
			google_id: authUser.id,
			email: authUser.email,
			handle: finalHandle,
			display_name: bioData.displayName || `@${finalHandle}`,
			role: bioData.role || 'Creator & Builder',
			location: bioData.location || 'Remote',
			work_style: bioData.workStyle || 'remotely',
			specialties: bioData.specialties || '',
			updated_at: new Date().toISOString(),
		};

		const { data: userRecord, error: userError } = await supabase
			.from('users')
			.upsert(userPayload, { onConflict: 'google_id' })
			.select()
			.single();

		if (userError) {
			console.error('Error upserting user:', userError);
			return null;
		}

		// 2. Sync Link Records
		if (items && items.length > 0) {
			const linkPayloads = items.map((item, index) => ({
				user_id: userRecord.id,
				platform_key: item.key,
				url: item.url,
				position: index,
				is_active: true,
			}));

			await supabase.from('links').delete().eq('user_id', userRecord.id);
			await supabase.from('links').insert(linkPayloads);
		}

		return userRecord;
	} catch (e) {
		console.error('Error syncing data to Supabase:', e);
		return null;
	}
}
