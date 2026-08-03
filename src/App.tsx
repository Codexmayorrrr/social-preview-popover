import React, { useState, useEffect } from 'react';
import Contacts, { PlatformItem } from './components/Contacts';
import { CONTACT } from './config';
import { getGithubProfile, getXProfile } from './utils/social-api';
import { getGithubContributions, type Contributions } from './utils/github-contributions';

const allAvailableItems: PlatformItem[] = [
	{ label: 'GitHub', url: CONTACT.github, key: 'github' },
	{ label: 'LinkedIn', url: CONTACT.linkedin, key: 'linkedin' },
	{ label: 'Malt', url: CONTACT.malt, key: 'malt' },
	{ label: 'X', url: CONTACT.x, key: 'x' },
	{ label: 'YouTube', url: 'https://youtube.com', key: 'youtube' },
];

export default function App() {
	const [activeItems, setActiveItems] = useState<PlatformItem[]>(allAvailableItems);
	const [activePreset, setActivePreset] = useState<'developer' | 'creator' | 'all'>('all');
	const [isConfigOpen, setIsConfigOpen] = useState(false);

	const [contributions, setContributions] = useState<Contributions>({
		total: 120,
		start: new Date().toISOString().slice(0, 10),
		levels: '0'.repeat(364),
		counts: Array(364).fill(0),
	});

	const [githubProfile, setGithubProfile] = useState<any>(null);
	const [xProfile, setXProfile] = useState<any>(null);

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

	function applyPreset(preset: 'developer' | 'creator' | 'all') {
		setActivePreset(preset);
		if (preset === 'developer') {
			setActiveItems(allAvailableItems.filter((i) => ['github', 'x', 'linkedin'].includes(i.key)));
		} else if (preset === 'creator') {
			setActiveItems(allAvailableItems.filter((i) => ['youtube', 'x', 'linkedin', 'malt'].includes(i.key)));
		} else {
			setActiveItems(allAvailableItems);
		}
	}

	function togglePlatform(key: PlatformItem['key']) {
		setActivePreset('all');
		if (activeItems.some((i) => i.key === key)) {
			if (activeItems.length > 1) {
				setActiveItems(activeItems.filter((i) => i.key !== key));
			}
		} else {
			const target = allAvailableItems.find((i) => i.key === key);
			if (target) {
				setActiveItems([...activeItems, target]);
			}
		}
	}

	function moveItem(index: number, direction: -1 | 1) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= activeItems.length) return;
		const updated = [...activeItems];
		const temp = updated[index];
		updated[index] = updated[newIndex];
		updated[newIndex] = temp;
		setActiveItems(updated);
	}

	return (
		<main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-4 sm:p-8 font-sans antialiased relative overflow-x-hidden">
			{/* Ambient background glow */}
			<div className="fixed -top-40 -left-40 size-[30rem] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
			<div className="fixed -bottom-40 -right-40 size-[30rem] rounded-full bg-emerald-600/15 blur-[140px] pointer-events-none" />
			<div className="fixed top-1/3 right-1/4 size-[25rem] rounded-full bg-sky-500/10 blur-[130px] pointer-events-none" />

			{/* Interactive Persona & Control Header */}
			<header className="w-full max-w-2xl z-30 flex flex-col gap-3 bg-white/5 dark:bg-stone-900/50 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 shadow-2xl">
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
						<h1 className="font-semibold text-xs tracking-wider uppercase text-stone-400">Liquid Bio Studio Prototype</h1>
					</div>
					<button
						onClick={() => setIsConfigOpen(!isConfigOpen)}
						className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1.5"
					>
						<span>⚙️</span> Edit Dock & Order
					</button>
				</div>

				{/* Persona Presets */}
				<div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
					<span className="text-xs text-stone-400 shrink-0 font-medium">Presets:</span>
					<button
						onClick={() => applyPreset('all')}
						className={`text-xs px-3 py-1 rounded-full transition-all shrink-0 font-medium ${
							activePreset === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-stone-300 hover:bg-white/10'
						}`}
					>
						✨ Full Deck (5)
					</button>
					<button
						onClick={() => applyPreset('developer')}
						className={`text-xs px-3 py-1 rounded-full transition-all shrink-0 font-medium ${
							activePreset === 'developer' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-stone-300 hover:bg-white/10'
						}`}
					>
						🐙 Developer (3)
					</button>
					<button
						onClick={() => applyPreset('creator')}
						className={`text-xs px-3 py-1 rounded-full transition-all shrink-0 font-medium ${
							activePreset === 'creator' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-stone-300 hover:bg-white/10'
						}`}
					>
						🎨 Creator (4)
					</button>
				</div>

				{/* Live Platform Checkbox Toggles */}
				<div className="flex items-center gap-2 pt-1 flex-wrap border-t border-white/5 mt-1">
					<span className="text-xs text-stone-400 font-medium mr-1">Platforms:</span>
					{allAvailableItems.map((item) => {
						const isChecked = activeItems.some((i) => i.key === item.key);
						return (
							<label
								key={item.key}
								className={`text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 select-none ${
									isChecked ? 'bg-white/15 text-white font-medium border border-white/20' : 'bg-white/5 text-stone-500 hover:text-stone-300'
								}`}
							>
								<input
									type="checkbox"
									checked={isChecked}
									onChange={() => togglePlatform(item.key)}
									className="hidden"
								/>
								<span className={`size-1.5 rounded-full ${isChecked ? 'bg-emerald-400' : 'bg-stone-600'}`} />
								{item.label}
							</label>
						);
					})}
				</div>
			</header>

			{/* Center Creator Bio Profile Showcase */}
			<section className="my-auto py-12 flex flex-col items-center text-center z-10 max-w-md px-4">
				<div className="relative group">
					<div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-sky-500 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
					<img
						src="/avatar.jpg"
						alt="Mayowa Ali"
						className="relative size-28 sm:size-32 rounded-full object-cover border-2 border-white/20 shadow-2xl"
					/>
				</div>

				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-5 text-white flex items-center gap-2">
					Mayowa Ali
					<svg viewBox="0 0 24 24" className="size-5 fill-indigo-400 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
				</h2>

				<p className="text-sm font-medium text-stone-300 mt-1">Design Engineer & Fullstack Developer</p>
				<p className="text-xs text-stone-400 mt-0.5">Lagos, Nigeria • Remote</p>

				<p className="text-xs text-stone-300/90 leading-relaxed mt-4 max-w-sm bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-md">
					Building smooth liquid UI components, micro-interactions & scalable web applications.
				</p>

				<div className="text-xs text-stone-500 mt-4 flex items-center gap-2">
					<span>Hover or tap the dock below to preview live profile cards</span>
					<span>↓</span>
				</div>
			</section>

			{/* Floating Dock at Bottom */}
			<footer className="sticky bottom-6 z-40 pb-2">
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

			{/* Studio Reorder Modal Drawer */}
			{isConfigOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
					<div className="bg-stone-900 border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-base text-white">Reorder Dock Icons</h3>
							<button
								onClick={() => setIsConfigOpen(false)}
								className="text-stone-400 hover:text-white text-lg font-bold px-2"
							>
								✕
							</button>
						</div>

						<p className="text-xs text-stone-400">Use ↑ ↓ buttons to reorder how icons appear in your dock:</p>

						<div className="flex flex-col gap-2 my-2">
							{activeItems.map((item, index) => (
								<div
									key={item.key}
									className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl"
								>
									<span className="text-sm font-medium text-stone-200 capitalize flex items-center gap-2">
										<span className="size-2 rounded-full bg-indigo-400" />
										{item.label}
									</span>
									<div className="flex items-center gap-1">
										<button
											disabled={index === 0}
											onClick={() => moveItem(index, -1)}
											className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold"
										>
											↑
										</button>
										<button
											disabled={index === activeItems.length - 1}
											onClick={() => moveItem(index, 1)}
											className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold"
										>
											↓
										</button>
									</div>
								</div>
							))}
						</div>

						<button
							onClick={() => setIsConfigOpen(false)}
							className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all"
						>
							Done Editing
						</button>
					</div>
				</div>
			)}
		</main>
	);
}
