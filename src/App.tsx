import React, { useState, useEffect } from 'react';
import Contacts, { PlatformItem, detectPlatformKey } from './components/Contacts';
import { CONTACT } from './config';
import { getGithubProfile, getXProfile } from './utils/social-api';
import { getGithubContributions, type Contributions } from './utils/github-contributions';

const initialItems: PlatformItem[] = [
	{ label: 'GitHub', url: CONTACT.github, key: 'github' },
	{ label: 'LinkedIn', url: CONTACT.linkedin, key: 'linkedin' },
	{ label: 'Malt', url: CONTACT.malt, key: 'malt' },
	{ label: 'X', url: CONTACT.x, key: 'x' },
	{ label: 'YouTube', url: 'https://youtube.com', key: 'youtube' },
];

export default function App() {
	const [isAdminMode] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('admin') === 'true' || window.location.pathname.startsWith('/admin');
		}
		return false;
	});

	const [activeItems, setActiveItems] = useState<PlatformItem[]>(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('dock_bio_items');
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse saved dock items:', e);
				}
			}
		}
		return initialItems;
	});

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

	// Persist active items to localStorage whenever updated
	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('dock_bio_items', JSON.stringify(activeItems));
		}
	}, [activeItems]);

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
			setActiveItems(initialItems.filter((i) => ['github', 'x', 'linkedin'].includes(i.key)));
		} else if (preset === 'creator') {
			setActiveItems(initialItems.filter((i) => ['youtube', 'x', 'linkedin', 'malt'].includes(i.key)));
		} else {
			setActiveItems(initialItems);
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

		const existingIndex = activeItems.findIndex((i) => i.key === key);
		if (existingIndex !== -1 && key !== 'generic') {
			const updated = [...activeItems];
			updated[existingIndex] = newItem;
			setActiveItems(updated);
		} else {
			setActiveItems([...activeItems, newItem]);
		}

		setInputUrl('');
		setIsAddModalOpen(false);
	}

	function handleRemoveItem(key: PlatformItem['key']) {
		if (activeItems.length > 1) {
			setActiveItems(activeItems.filter((i) => i.key !== key));
		}
	}

	return (
		<main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-6 sm:p-12 font-sans antialiased relative">
			{/* Minimal Header */}
			<header className="w-full max-w-xl flex items-center justify-between z-20 gap-2 flex-wrap">
				<span className="text-xs font-serif italic text-stone-500 tracking-wider">mayowa ali</span>

				{isAdminMode && (
					/* Admin Mode Controls (Dedicated to Admin Page) */
					<div className="flex items-center gap-2">
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

						<button
							onClick={() => setIsAddModalOpen(true)}
							className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs font-medium text-white border border-white/15 flex items-center gap-1 shadow-md"
						>
							<span>+</span> Add Social
						</button>
					</div>
				)}
			</header>

			{/* Clean Minimal Hero Layout */}
			<section className="my-auto py-16 flex flex-col gap-6 max-w-xl text-left w-full z-10">
				<h1 className="font-serif text-3xl sm:text-4xl tracking-tight italic text-stone-100">
					Mayowa Ali
				</h1>

				<div className="text-stone-400 leading-relaxed text-sm sm:text-base flex flex-col gap-4">
					<p>
						I am a <strong className="text-stone-100 font-medium">Design Engineer</strong> based in{' '}
						<strong className="text-stone-100 font-medium">Lagos, Nigeria</strong>, working{' '}
						<strong className="text-stone-100 font-medium">remotely</strong>.
					</p>
					<p>
						Specializing at the intersection of <strong className="text-stone-100 font-medium">UI engineering</strong>,{' '}
						<strong className="text-stone-100 font-medium">micro-interactions</strong>, and{' '}
						<strong className="text-stone-100 font-medium">motion physics</strong>.
					</p>
				</div>
			</section>

			{/* Floating Contacts Dock */}
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
									Add to Dock
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
						<div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2">
							<span className="text-[11px] text-stone-500 font-medium">Active Dock Platforms:</span>
							<div className="flex flex-wrap gap-1.5">
								{activeItems.map((item) => (
									<span
										key={item.key}
										className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-stone-300 flex items-center gap-1.5 capitalize"
									>
										{item.key}
										{activeItems.length > 1 && (
											<button
												onClick={() => handleRemoveItem(item.key)}
												className="text-stone-500 hover:text-red-400 font-bold text-xs pl-1"
											>
												×
											</button>
										)}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
