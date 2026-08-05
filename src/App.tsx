import React, { useState, useEffect } from 'react';
import Contacts, { PlatformItem, detectPlatformKey } from './components/Contacts';
import { CONTACT } from './config';
import { getGithubProfile, getXProfile } from './utils/social-api';
import { getGithubContributions, type Contributions } from './utils/github-contributions';
import {
	supabase,
	getProfileByHandle,
	getCurrentUser,
	signInWithGoogle,
	syncUserAndLinksToDatabase,
} from './utils/supabase';

export interface UserBioData {
	displayName: string;
	role: string;
	location: string;
	workStyle: string;
	specialties: string;
}

const initialItems: PlatformItem[] = [
	{ label: 'GitHub', url: CONTACT.github, key: 'github' },
	{ label: 'LinkedIn', url: CONTACT.linkedin, key: 'linkedin' },
	{ label: 'Malt', url: CONTACT.malt, key: 'malt' },
	{ label: 'X', url: CONTACT.x, key: 'x' },
	{ label: 'YouTube', url: 'https://youtube.com', key: 'youtube' },
];

const DEV_KEYS = ['github', 'x', 'linkedin', 'malt', 'medium', 'figma', 'dribbble', 'behance', 'producthunt', 'generic'];
const CREATOR_KEYS = ['youtube', 'spotify', 'x', 'instagram', 'tiktok', 'twitch', 'substack', 'threads', 'medium', 'generic'];

const defaultMayowaBio: UserBioData = {
	displayName: 'Mayowa Ali',
	role: 'Design Engineer',
	location: 'Lagos, Nigeria',
	workStyle: 'remotely',
	specialties: 'UI engineering, micro-interactions, and motion physics',
};

const defaultNewUserBio: UserBioData = {
	displayName: '',
	role: 'Creator & Builder',
	location: 'London, UK',
	workStyle: 'remotely',
	specialties: 'content creation, UI design, and digital products',
};

const ROLE_TEMPLATES = [
	{ label: '💻 Design Engineer', role: 'Design Engineer', specialties: 'UI engineering, micro-interactions, and motion physics' },
	{ label: '🎥 Tech Creator', role: 'Tech Creator & YouTuber', specialties: 'video essays, gadget reviews, and motion design' },
	{ label: '🎨 UI/UX Designer', role: 'UI/UX Designer', specialties: 'design systems, product design, and web interfaces' },
	{ label: '✍️ Substack Writer', role: 'Substack Writer', specialties: 'tech analysis, newsletters, and long-form essays' },
	{ label: '🎙️ Podcast Host', role: 'Podcast Host', specialties: 'interviews, tech news, and audio storytelling' },
];

function getUserHandleFromUrl(): string {
	if (typeof window === 'undefined') return 'mayowa';
	const hostname = window.location.hostname;
	const parts = hostname.split('.');

	// Subdomain detection (e.g. "mayowa.dock.bio" or "mayowa.vercel.app")
	if (parts.length >= 3 && !['www', 'localhost', '127'].includes(parts[0])) {
		return parts[0];
	}

	// Dynamic Single-App Wrapper Handle Detection (e.g. "/@mayowa" or "/mayowa")
	const pathParts = window.location.pathname.split('/').filter(Boolean);
	if (pathParts.length > 0 && !['admin', 'join'].includes(pathParts[0])) {
		return pathParts[0].replace('@', '');
	}

	return 'mayowa';
}

export default function App() {
	const [userHandle] = useState<string>(() => getUserHandleFromUrl());
	const [claimInput, setClaimInput] = useState<string>('');
	const [authUser, setAuthUser] = useState<any>(null);

	const [isLandingPage] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('join') === 'true' || window.location.pathname === '/join';
		}
		return false;
	});

	const [isAdminMode] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('admin') === 'true' || window.location.pathname.startsWith('/admin');
		}
		return false;
	});

	// Bio Data State per User Handle
	const [bioData, setBioData] = useState<UserBioData>(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem(`dock_bio_data_${userHandle}`);
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse bio data:', e);
				}
			}
		}
		return userHandle === 'mayowa' ? defaultMayowaBio : { ...defaultNewUserBio, displayName: `@${userHandle}` };
	});

	// Auto-open bio modal on newly claimed handles
	const [isBioModalOpen, setIsBioModalOpen] = useState<boolean>(() => {
		if (typeof window !== 'undefined' && isAdminMode && userHandle !== 'mayowa') {
			const setupDone = localStorage.getItem(`dock_bio_setup_done_${userHandle}`);
			return !setupDone;
		}
		return false;
	});

	// All links owned by this specific user
	const [allUserItems, setAllUserItems] = useState<PlatformItem[]>(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem(`dock_bio_items_${userHandle}`);
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse saved dock items:', e);
				}
			}
		}
		return userHandle === 'mayowa' ? initialItems : [];
	});

	// Currently displayed active items (after preset filter)
	const [activeItems, setActiveItems] = useState<PlatformItem[]>(allUserItems);
	const [activePreset, setActivePreset] = useState<'all' | 'dev' | 'creator'>('all');
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [inputUrl, setInputUrl] = useState('');
	const [detectedKey, setDetectedKey] = useState<PlatformItem['key']>('generic');

	const [contributions, setContributions] = useState<Contributions>({
		total: 120,
		start: new Date().toISOString().slice(0, 10),
		levels: '0'.repeat(364),
		counts: Array(364).fill(0),
	});

	const [githubProfile, setGithubProfile] = useState<any>(null);
	const [xProfile, setXProfile] = useState<any>(null);

	// Fetch live Supabase profile data silently in the background
	useEffect(() => {
		async function fetchFromSupabase() {
			const dbProfile = await getProfileByHandle(userHandle);
			if (dbProfile && dbProfile.links && dbProfile.links.length > 0) {
				const fetchedItems: PlatformItem[] = dbProfile.links.map((l: any) => ({
					label: l.platform_key.toUpperCase(),
					url: l.url,
					key: l.platform_key,
				}));
				setAllUserItems(fetchedItems);
			}
		}
		fetchFromSupabase();
	}, [userHandle]);

	// Supabase Auth Listener & Post-Auth Handle Reservation
	useEffect(() => {
		getCurrentUser().then((user) => setAuthUser(user));

		const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
			const currentUser = session?.user || null;
			setAuthUser(currentUser);

			if (currentUser) {
				const pendingHandle = localStorage.getItem('pending_claim_handle');
				const targetHandle = pendingHandle || userHandle;

				await syncUserAndLinksToDatabase(currentUser, targetHandle, bioData, allUserItems);

				if (pendingHandle) {
					localStorage.removeItem('pending_claim_handle');
					window.location.href = `/@${pendingHandle}?admin=true`;
				}
			}
		});

		return () => {
			authListener.subscription.unsubscribe();
		};
	}, [userHandle, bioData, allUserItems]);

	// Persist bioData & activeItems per user handle (Local & Silent DB Sync)
	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`dock_bio_data_${userHandle}`, JSON.stringify(bioData));
			localStorage.setItem(`dock_bio_items_${userHandle}`, JSON.stringify(allUserItems));
		}
		if (activePreset === 'dev') {
			setActiveItems(allUserItems.filter((i) => DEV_KEYS.includes(i.key)));
		} else if (activePreset === 'creator') {
			setActiveItems(allUserItems.filter((i) => CREATOR_KEYS.includes(i.key)));
		} else {
			setActiveItems(allUserItems);
		}

		if (authUser) {
			syncUserAndLinksToDatabase(authUser, userHandle, bioData, allUserItems);
		}
	}, [allUserItems, bioData, userHandle, activePreset, authUser]);

	useEffect(() => {
		async function loadData() {
			try {
				const [contribs, gh, x] = await Promise.all([
					getGithubContributions(CONTACT.githubUsername),
					getGithubProfile(CONTACT.githubUsername),
					getXProfile(CONTACT.twitterHandle),
				]);
				setContributions(contribs);
				setGithubProfile(gh);
				setXProfile(x);
			} catch (e) {
				console.error('Error fetching profiles:', e);
			}
		}
		loadData();
	}, []);

	// Auto-detect platform key as user types in Add Social modal
	useEffect(() => {
		if (!inputUrl.trim()) {
			setDetectedKey('generic');
			return;
		}
		const key = detectPlatformKey(inputUrl);
		setDetectedKey(key);
	}, [inputUrl]);

	function applyPreset(preset: 'all' | 'dev' | 'creator') {
		setActivePreset(preset);
		if (preset === 'dev') {
			setActiveItems(allUserItems.filter((i) => DEV_KEYS.includes(i.key)));
		} else if (preset === 'creator') {
			setActiveItems(allUserItems.filter((i) => CREATOR_KEYS.includes(i.key)));
		} else {
			setActiveItems(allUserItems);
		}
	}

	async function handleClaimHandle(e: React.FormEvent) {
		e.preventDefault();
		const cleaned = claimInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
		if (!cleaned) return;

		if (typeof window !== 'undefined') {
			const initialBio: UserBioData = {
				displayName: `@${cleaned}`,
				role: 'Creator & Builder',
				location: 'London, UK',
				workStyle: 'remotely',
				specialties: 'content creation, UI design, and digital products',
			};
			localStorage.setItem(`dock_bio_items_${cleaned}`, JSON.stringify([]));
			localStorage.setItem(`dock_bio_data_${cleaned}`, JSON.stringify(initialBio));
			localStorage.setItem('pending_claim_handle', cleaned);

			// Connect 1-Click Google OAuth directly to Claim button!
			try {
				await signInWithGoogle();
			} catch (err) {
				console.error('Google Sign In failed/cancelled:', err);
				// Fallback redirect
				window.location.href = `/@${cleaned}?admin=true`;
			}
		}
	}

	function handleAddLink(e: React.FormEvent) {
		e.preventDefault();
		if (!inputUrl.trim()) return;

		const fullUrl = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;
		const key = detectPlatformKey(fullUrl);

		const newItem: PlatformItem = {
			label: key.toUpperCase(),
			url: fullUrl,
			key,
		};

		const existingIndex = allUserItems.findIndex((i) => i.key === key);
		if (existingIndex !== -1 && key !== 'generic') {
			const updated = [...allUserItems];
			updated[existingIndex] = newItem;
			setAllUserItems(updated);
		} else {
			setAllUserItems([...allUserItems, newItem]);
		}

		setInputUrl('');
		setIsAddModalOpen(false);
	}

	function handleRemoveItem(key: PlatformItem['key']) {
		setAllUserItems(allUserItems.filter((i) => i.key !== key));
	}

	function applyRoleTemplate(template: typeof ROLE_TEMPLATES[0]) {
		setBioData({
			...bioData,
			role: template.role,
			specialties: template.specialties,
		});
	}

	function handleSaveBio() {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`dock_bio_setup_done_${userHandle}`, 'true');
		}
		setIsBioModalOpen(false);
	}

	// Uncluttered Onboarding View (/join or ?join=true)
	if (isLandingPage) {
		return (
			<main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-6 sm:p-12 font-sans antialiased relative">
				<header className="w-full max-w-xl flex items-center justify-between z-20">
					<span className="text-xs font-serif italic text-stone-500 tracking-wider">dock.bio</span>
				</header>

				<section className="my-auto py-16 flex flex-col gap-8 max-w-xl text-center items-center w-full z-10">
					<h1 className="font-serif text-4xl sm:text-5xl tracking-tight italic text-stone-100">
						Claim Your Bio Handle
					</h1>

					<p className="text-stone-400 text-sm sm:text-base max-w-md leading-relaxed">
						Create your interactive Apple Liquid Glass bio dock in under 30 seconds.
					</p>

					<form onSubmit={handleClaimHandle} className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
						<div className="relative flex-1 w-full">
							<span className="absolute left-3.5 top-3 text-xs text-stone-500 font-mono">
								dock.bio/@
							</span>
							<input
								type="text"
								placeholder="yourname"
								value={claimInput}
								onChange={(e) => setClaimInput(e.target.value)}
								className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-white/40 transition-colors pl-24"
								autoFocus
							/>
						</div>

						<button
							type="submit"
							className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 hover:bg-white text-stone-900 font-semibold text-xs transition-colors shrink-0 shadow-lg"
						>
							Claim →
						</button>
					</form>
				</section>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-6 sm:p-12 font-sans antialiased relative">
			{/* Pure Minimalist Header - Crisp One-Word CTAs */}
			<header className="w-full max-w-xl flex items-center justify-between z-20 gap-2 flex-wrap">
				<span className="text-xs font-serif italic text-stone-500 tracking-wider">
					dock.bio/@{userHandle}
				</span>

				{isAdminMode && (
					/* Admin Mode Controls */
					<div className="flex items-center gap-2">
						{/* Preset sort filter bar */}
						{allUserItems.length > 0 && (
							<div className="flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-full border border-white/10 text-xs">
								<button
									onClick={() => applyPreset('all')}
									className={`px-3 py-1 rounded-full transition-colors ${
										activePreset === 'all' ? 'bg-white/15 text-white font-medium' : 'text-stone-400 hover:text-white'
									}`}
								>
									All
								</button>
								<button
									onClick={() => applyPreset('dev')}
									className={`px-3 py-1 rounded-full transition-colors ${
										activePreset === 'dev' ? 'bg-white/15 text-white font-medium' : 'text-stone-400 hover:text-white'
									}`}
								>
									Dev
								</button>
								<button
									onClick={() => applyPreset('creator')}
									className={`px-3 py-1 rounded-full transition-colors ${
										activePreset === 'creator' ? 'bg-white/15 text-white font-medium' : 'text-stone-400 hover:text-white'
									}`}
								>
									Creator
								</button>
							</div>
						)}

						<button
							onClick={() => setIsBioModalOpen(true)}
							className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs font-medium text-white border border-white/15 flex items-center gap-1 shadow-md"
						>
							<span>✏️</span> Bio
						</button>

						<button
							onClick={() => setIsAddModalOpen(true)}
							className="px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-900 hover:bg-white transition-all text-xs font-medium flex items-center gap-1 shadow-md"
						>
							<span>+</span> Add
						</button>
					</div>
				)}
			</header>

			{/* Clean Minimal Hero Layout with Bold Keyword Formatting */}
			<section className="my-auto py-16 flex flex-col gap-6 max-w-xl text-left w-full z-10">
				<div className="flex items-center justify-between">
					<h1 className="font-serif text-3xl sm:text-4xl tracking-tight italic text-stone-100 capitalize">
						{bioData.displayName || `@${userHandle}`}
					</h1>
				</div>

				<div className="text-stone-400 leading-relaxed text-sm sm:text-base flex flex-col gap-4">
					<p>
						I am a <strong className="text-stone-100 font-medium">{bioData.role || 'Creator'}</strong> based in{' '}
						<strong className="text-stone-100 font-medium">{bioData.location || 'Remote'}</strong>, working{' '}
						<strong className="text-stone-100 font-medium">{bioData.workStyle || 'remotely'}</strong>.
					</p>
					<p>
						Specializing at the intersection of{' '}
						<strong className="text-stone-100 font-medium">{bioData.specialties || 'digital products and content creation'}</strong>.
					</p>
				</div>

				{/* Empty State Banner for Brand New Users */}
				{allUserItems.length === 0 && isAdminMode && (
					<div className="mt-4 p-4 rounded-2xl bg-stone-900/60 border border-white/10 text-stone-400 text-xs flex flex-col gap-2">
						<span className="text-stone-200 font-medium">Your Liquid Dock is empty</span>
						<p>Click <strong className="text-white">+ Add</strong> in the top header to add your first social media link and build your dock.</p>
					</div>
				)}
			</section>

			{/* Floating Contacts Dock - ONLY RENDERED WHEN USER HAS ADDED LINKS */}
			{activeItems.length > 0 && (
				<footer className="sticky bottom-8 z-40 pb-4">
					<Contacts
						items={activeItems}
						contributions={contributions}
						contributionsLabel={`${contributions.total} contributions in 2026`}
						githubProfile={githubProfile || {}}
						xProfile={xProfile || {}}
						youtubeProfile={{
							name: 'Mayowa Ali',
							subscribers: '12.4K Subscribers',
							bannerUrl: '/banner.jpg',
							videoTitle: 'Building Liquid Glass Motion in React 19',
							videoThumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
							videoUrl: 'https://youtube.com',
						}}
					/>
				</footer>
			)}

			{/* Interactive Sentence Builder Bio Modal */}
			{isAdminMode && isBioModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
					<div className="bg-stone-900/90 border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 relative">
						<div className="flex items-center justify-between">
							<h3 className="font-serif italic text-base text-stone-100">Setup Your Bio Intro</h3>
							<button
								onClick={handleSaveBio}
								className="text-stone-500 hover:text-stone-200 text-sm p-1"
							>
								✕
							</button>
						</div>

						{/* Option 2: Quick Template Role Chips */}
						<div className="flex flex-col gap-2">
							<span className="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Quick Role Templates</span>
							<div className="flex flex-wrap gap-1.5">
								{ROLE_TEMPLATES.map((t, idx) => (
									<button
										key={idx}
										onClick={() => applyRoleTemplate(t)}
										className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-stone-300 transition-colors"
									>
										{t.label}
									</button>
								))}
							</div>
						</div>

						{/* Option 1: 2-Field Micro Inputs */}
						<div className="flex flex-col gap-3 pt-2 border-t border-white/10">
							<span className="text-[11px] text-stone-500 font-medium uppercase tracking-wider">Customize Bio Details</span>

							<div className="flex flex-col gap-1">
								<label className="text-[11px] text-stone-400">Display Name</label>
								<input
									type="text"
									value={bioData.displayName}
									onChange={(e) => setBioData({ ...bioData, displayName: e.target.value })}
									className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-100 focus:outline-none focus:border-white/30"
								/>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div className="flex flex-col gap-1">
									<label className="text-[11px] text-stone-400">Role / Title</label>
									<input
										type="text"
										value={bioData.role}
										onChange={(e) => setBioData({ ...bioData, role: e.target.value })}
										className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-100 focus:outline-none focus:border-white/30"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-[11px] text-stone-400">Location</label>
									<input
										type="text"
										value={bioData.location}
										onChange={(e) => setBioData({ ...bioData, location: e.target.value })}
										className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-100 focus:outline-none focus:border-white/30"
									/>
								</div>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[11px] text-stone-400">Specialties / Focus Areas</label>
								<input
									type="text"
									value={bioData.specialties}
									onChange={(e) => setBioData({ ...bioData, specialties: e.target.value })}
									className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-100 focus:outline-none focus:border-white/30"
								/>
							</div>
						</div>

						{/* Live Interactive Sentence Preview */}
						<div className="bg-white/5 p-3.5 rounded-xl border border-white/10 flex flex-col gap-1 text-xs">
							<span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Live Preview</span>
							<p className="text-stone-300 leading-relaxed">
								I am a <strong className="text-white">{bioData.role || 'Role'}</strong> based in{' '}
								<strong className="text-white">{bioData.location || 'Location'}</strong>, working{' '}
								<strong className="text-white">{bioData.workStyle || 'remotely'}</strong>.
							</p>
						</div>

						<button
							onClick={handleSaveBio}
							className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-900 font-medium text-xs hover:bg-white transition-colors mt-1"
						>
							Save →
						</button>
					</div>
				</div>
			)}

			{/* Admin Mode: Add Social Link Modal */}
			{isAdminMode && isAddModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
					<div className="bg-stone-900/90 border border-white/15 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 relative">
						<div className="flex items-center justify-between">
							<h3 className="font-serif italic text-base text-stone-100">Add Social Link</h3>
							<button
								onClick={() => setIsAddModalOpen(false)}
								className="text-stone-500 hover:text-stone-200 text-sm p-1"
							>
								✕
							</button>
						</div>

						<form onSubmit={handleAddLink} className="flex flex-col gap-3">
							<div className="relative">
								<input
									type="text"
									placeholder="Paste ANY link (e.g. tiktok, twitch, substack, figma, etc.)"
									value={inputUrl}
									onChange={(e) => setInputUrl(e.target.value)}
									className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-white/30 transition-colors pr-24"
									autoFocus
								/>
								<span className="absolute right-3 top-2.5 text-[10px] text-stone-300 font-semibold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded border border-white/10">
									{detectedKey}
								</span>
							</div>

							<div className="flex items-center gap-2 pt-1">
								<button
									type="submit"
									className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-900 font-medium text-xs hover:bg-white transition-colors"
								>
									Add
								</button>
								<button
									type="button"
									onClick={() => setIsAddModalOpen(false)}
									className="px-4 py-2.5 rounded-xl bg-white/5 text-stone-400 hover:text-stone-200 text-xs transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>

						{/* Active Dock Platforms List with Remove Buttons */}
						{allUserItems.length > 0 && (
							<div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2">
								<span className="text-[11px] text-stone-500 font-medium">Active Dock Platforms:</span>
								<div className="flex flex-wrap gap-1.5">
									{allUserItems.map((item) => (
										<span
											key={item.key}
											className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-stone-300 flex items-center gap-1.5 capitalize"
										>
											{item.key}
											<button
												onClick={() => handleRemoveItem(item.key)}
												className="text-stone-500 hover:text-red-400 font-bold text-xs pl-1"
											>
												×
											</button>
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</main>
	);
}
