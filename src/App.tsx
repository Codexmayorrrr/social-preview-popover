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
		<main className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center pt-32 translate-y-12 font-sans antialiased m-0 p-0 overflow-hidden relative">
			{/* Ambient glass background glow */}
			<div className="absolute -top-40 -left-40 size-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
			<div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

			<Contacts
				contributions={contributions}
				contributionsLabel={`${contributions.total} contributions in ${new Date().getFullYear()}`}
				githubProfile={githubProfile || {}}
				xProfile={xProfile || {}}
			/>
		</main>
	);
}
