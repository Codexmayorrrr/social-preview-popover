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
	const [activePreset, setActivePreset] = useState<'all' | 'dev' | 'creator'>('all');

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

	function applyPreset(preset: 'all' | 'dev' | 'creator') {
		setActivePreset(preset);
		if (preset === 'dev') {
			setActiveItems(allAvailableItems.filter((i) => ['github', 'x', 'linkedin'].includes(i.key)));
		} else if (preset === 'creator') {
			setActiveItems(allAvailableItems.filter((i) => ['youtube', 'x', 'linkedin', 'malt'].includes(i.key)));
		} else {
			setActiveItems(allAvailableItems);
		}
	}

	return (
		<main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-between p-6 sm:p-12 font-sans antialiased relative">
			{/* Muted Preset Filter Bar */}
			<header className="w-full max-w-xl flex items-center justify-between z-20">
				<span className="text-xs font-serif italic text-stone-500 tracking-wider">mayowa ali</span>
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

			{/* Original Floating Contacts Dock */}
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
		</main>
	);
}
