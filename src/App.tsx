import React, { useState, useEffect } from 'react';
import Contacts from './components/Contacts';
import { CONTACT } from './config';
import { getGithubProfile, getXProfile } from './utils/social-api';
import { getGithubContributions, type Contributions } from './utils/github-contributions';

export default function App() {
	const [contributions, setContributions] = useState<Contributions>({
		total: 142,
		start: new Date().toISOString().slice(0, 10),
		levels: '0'.repeat(213),
		counts: Array(213).fill(0),
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

	return (
		<main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
			{/* Background ambient lighting */}
			<div className="absolute -top-40 -left-40 size-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
			<div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

			<div className="max-w-md w-full flex flex-col items-center gap-8 text-center z-10">
				<div className="flex flex-col items-center gap-2">
					<h1 className="text-3xl font-bold tracking-tight text-stone-100 font-serif italic">
						Social Preview Popover
					</h1>
					<p className="text-stone-400 text-sm max-w-xs leading-relaxed">
						Apple Liquid Glass dock popover with spring transitions and interactive preview cards built with React 19 & Framer Motion.
					</p>
				</div>

				<div className="mt-12 flex flex-col items-center gap-4">
					<span className="text-xs text-stone-500 font-mono uppercase tracking-wider">Hover over the icons below</span>
					<Contacts
						contributions={contributions}
						contributionsLabel={`${contributions.total} contributions in ${new Date().getFullYear()}`}
						githubProfile={githubProfile || {}}
						xProfile={xProfile || {}}
					/>
				</div>
			</div>
		</main>
	);
}
