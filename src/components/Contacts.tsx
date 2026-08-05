import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTACT } from '../config';
import GithubGraph from './GithubGraph';
import type { Contributions } from '../utils/github-contributions';
import { getGithubProfile, getXProfile, parseUsernameFromUrl, getSocialAvatarUrl } from '../utils/social-api';
import { getGithubContributions } from '../utils/github-contributions';

export type PlatformKey =
	| 'github'
	| 'linkedin'
	| 'malt'
	| 'x'
	| 'youtube'
	| 'spotify'
	| 'instagram'
	| 'tiktok'
	| 'twitch'
	| 'discord'
	| 'substack'
	| 'medium'
	| 'figma'
	| 'dribbble'
	| 'behance'
	| 'producthunt'
	| 'threads'
	| 'generic';

export interface PlatformItem {
	label: string;
	url: string;
	key: PlatformKey;
}

export function detectPlatformKey(url: string): PlatformKey {
	const lower = url.toLowerCase();
	if (lower.includes('github.com')) return 'github';
	if (lower.includes('linkedin.com')) return 'linkedin';
	if (lower.includes('malt.com')) return 'malt';
	if (lower.includes('x.com') || lower.includes('twitter.com')) return 'x';
	if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
	if (lower.includes('spotify.com')) return 'spotify';
	if (lower.includes('instagram.com')) return 'instagram';
	if (lower.includes('tiktok.com')) return 'tiktok';
	if (lower.includes('twitch.tv')) return 'twitch';
	if (lower.includes('discord.gg') || lower.includes('discord.com')) return 'discord';
	if (lower.includes('substack.com')) return 'substack';
	if (lower.includes('medium.com')) return 'medium';
	if (lower.includes('figma.com')) return 'figma';
	if (lower.includes('dribbble.com')) return 'dribbble';
	if (lower.includes('behance.net')) return 'behance';
	if (lower.includes('producthunt.com')) return 'producthunt';
	if (lower.includes('threads.net')) return 'threads';
	return 'generic';
}

export function extractHandle(url: string, fallback: string = 'user'): string {
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
		const parts = parsed.pathname.split('/').filter(Boolean);
		if (parts.length > 0) {
			const handle = parts[0];
			return handle.startsWith('@') ? handle : `@${handle}`;
		}
		return parsed.hostname.replace('www.', '');
	} catch (e) {
		return `@${fallback}`;
	}
}

export function extractDomain(url: string): string {
	try {
		const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
		return parsed.hostname.replace('www.', '');
	} catch (e) {
		return url;
	}
}

export interface ContactsProps {
	items?: PlatformItem[];
	contributions?: Contributions;
	contributionsLabel?: string;
	labels?: {
		linkedinHeadline?: string;
		linkedinLocation?: string;
		linkedinCta?: string;
		maltAvailability?: string;
		maltRate?: string;
		maltLocation?: string;
		xCta?: string;
	};
	githubProfile?: any;
	xProfile?: any;
	youtubeProfile?: any;
}

const defaultItems: PlatformItem[] = [
	{ label: 'GitHub', url: CONTACT.github, key: 'github' },
	{ label: 'LinkedIn', url: CONTACT.linkedin, key: 'linkedin' },
	{ label: 'Malt', url: CONTACT.malt, key: 'malt' },
	{ label: 'X', url: CONTACT.x, key: 'x' },
	{ label: 'YouTube', url: 'https://youtube.com', key: 'youtube' },
];

export default function Contacts({
	items = defaultItems,
	labels = {
		linkedinHeadline: 'Design Engineer',
		linkedinLocation: 'Remote',
		linkedinCta: 'Connect',
		maltAvailability: 'Available for projects',
		maltRate: 'Contact for rates',
		maltLocation: 'Remote',
		xCta: 'Follow',
	},
}: ContactsProps) {
	const [open, setOpen] = useState(false);
	const [contentIndex, setContentIndex] = useState(0);
	const [prevContentIndex, setPrevContentIndex] = useState(0);
	const [popupLeft, setPopupLeft] = useState(0);

	// Live Profile States fetched directly from active links!
	const [liveGithubProfile, setLiveGithubProfile] = useState<any>(null);
	const [liveGithubContribs, setLiveGithubContribs] = useState<Contributions>({
		total: 120,
		start: new Date().toISOString().slice(0, 10),
		levels: '0'.repeat(364),
		counts: Array(364).fill(0),
	});
	const [liveXProfile, setLiveXProfile] = useState<any>(null);

	const dockRef = useRef<HTMLDivElement>(null);

	const safeIndex = Math.min(contentIndex, items.length - 1);
	const activeItem = items[safeIndex] || items[0];

	const direction = useMemo(
		() => Math.max(Math.min(contentIndex - prevContentIndex, 1), -1),
		[contentIndex, prevContentIndex],
	);

	// Dynamically fetch profile information directly from active link!
	useEffect(() => {
		if (!activeItem) return;

		const handle = parseUsernameFromUrl(activeItem.url, activeItem.key);

		if (activeItem.key === 'github') {
			getGithubProfile(handle).then(setLiveGithubProfile);
			getGithubContributions(handle).then(setLiveGithubContribs);
		} else if (activeItem.key === 'x') {
			getXProfile(handle).then(setLiveXProfile);
		}
	}, [activeItem]);

	const avatarSrc = useMemo(() => {
		if (!activeItem) return '/avatar.jpg';
		const handle = parseUsernameFromUrl(activeItem.url, activeItem.key);
		if (activeItem.key === 'github' && liveGithubProfile?.avatarUrl) return liveGithubProfile.avatarUrl;
		if (activeItem.key === 'x' && liveXProfile?.avatarUrl) return liveXProfile.avatarUrl;
		return getSocialAvatarUrl(activeItem.key, handle, activeItem.url);
	}, [activeItem, liveGithubProfile, liveXProfile]);

	function calculateClampedLeft(rawLeft: number, cardWidth: number = 280) {
		if (!dockRef.current) return rawLeft;
		const dockRect = dockRef.current.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const margin = 12;

		const halfWidth = cardWidth / 2;
		const minDockLeft = margin + halfWidth - dockRect.left;
		const maxDockLeft = viewportWidth - margin - halfWidth - dockRect.left;

		if (minDockLeft > maxDockLeft) {
			return dockRect.width / 2;
		}

		return Math.max(minDockLeft, Math.min(maxDockLeft, rawLeft));
	}

	function openForIndex(node: HTMLElement, index: number) {
		const nextLeft = node.offsetLeft + node.offsetWidth / 2;
		const clampedLeft = calculateClampedLeft(nextLeft, 280);
		setPopupLeft(clampedLeft);
		setPrevContentIndex(contentIndex);
		setContentIndex(index);
		setOpen(true);
	}

	useEffect(() => {
		function handleClickOutside(e: PointerEvent) {
			if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}

		if (open) {
			document.addEventListener('pointerdown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('pointerdown', handleClickOutside);
		};
	}, [open]);

	const domainHost = activeItem ? extractDomain(activeItem.url) : '';
	const itemHandle = activeItem ? extractHandle(activeItem.url) : '';

	return (
		<motion.div
			ref={dockRef}
			layout
			className="contacts-dock relative flex items-center gap-1.5 p-1.5 rounded-full bg-white/10 dark:bg-stone-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.35)] transition-colors duration-300 select-none"
			onMouseLeave={() => setOpen(false)}
			role="presentation"
		>
			{items.map((item, index) => {
				const isActive = open && safeIndex === index;
				const domain = extractDomain(item.url);
				const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

				return (
					<motion.a
						key={`${item.key}-${index}`}
						href={item.url}
						target="_blank"
						rel="noopener noreferrer"
						className={`relative flex size-11 items-center justify-center rounded-full transition-colors ${
							isActive ? 'text-fg' : 'text-muted hover:text-fg'
						}`}
						aria-label={item.label}
						onMouseEnter={(e) => openForIndex(e.currentTarget, index)}
					>
						{isActive && (
							<motion.div
								layoutId="dock-active-pill"
								className="absolute inset-0 rounded-full bg-white/25 dark:bg-white/15 backdrop-blur-xl shadow-[0_4px_16px_rgba(255,255,255,0.2)] border border-white/30 dark:border-white/20 -z-10"
								transition={{ type: 'spring', stiffness: 400, damping: 30 }}
							/>
						)}

						{item.key === 'github' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
							</svg>
						)}
						{item.key === 'linkedin' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
							</svg>
						)}
						{item.key === 'malt' && (
							<svg viewBox="0 0 32 32" className="size-6 fill-current transition-colors">
								<path d="M27.3892 4.61825C24.9683 2.20484 22.3911 3.76909 20.7747 5.37803L5.51955 20.6331C3.90317 22.2495 2.21229 24.7076 4.75978 27.2477C7.29981 29.7877 9.75047 28.0968 11.3669 26.4804L26.622 11.2253C28.2384 9.61639 29.8026 7.03166 27.3892 4.61825ZM12.8119 3.99255L16.0447 7.22533L19.3296 3.93296C19.5531 3.7095 19.7765 3.50093 20.0074 3.30726C19.6648 1.57169 18.6741 0 16.0372 0C13.4004 0 12.4097 1.57914 12.0745 3.31471C12.3203 3.53073 12.5661 3.74674 12.8119 3.99255ZM19.3296 27.9851L16.0447 24.7002L12.8119 27.9255C12.5661 28.1713 12.3277 28.4022 12.0819 28.6108C12.4544 30.3836 13.4972 32 16.0372 32C18.5847 32 19.635 30.3687 20 28.5959C19.7765 28.4022 19.5531 28.2086 19.3296 27.9851ZM11.4413 11.8212H5.21415C2.92737 11.8212 0 12.5438 0 15.9553C0 18.5102 1.63129 19.5531 3.41155 19.9181C3.62011 19.6797 11.4413 11.8212 11.4413 11.8212ZM28.6853 11.9926C28.4916 12.216 20.648 20.0968 20.648 20.0968H26.7858C29.0726 20.0968 32 19.5531 32 15.9553C32 13.3259 30.4283 12.3352 28.6853 11.9926ZM13.4823 9.78026L14.5922 8.67039L11.3669 5.43762C9.75047 3.82123 7.29981 2.13035 4.75233 4.67784C2.89013 6.54004 3.30726 8.35754 4.2905 9.82495C4.5959 9.80261 13.4823 9.78026 13.4823 9.78026ZM18.5996 22.1378L17.4823 23.2551L20.7747 26.54C22.3911 28.1564 24.9683 29.7207 27.3818 27.3073C29.1844 25.5047 28.7747 23.6052 27.7765 22.0931C27.4562 22.1155 18.5996 22.1378 18.5996 22.1378Z" />
							</svg>
						)}
						{item.key === 'x' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
							</svg>
						)}
						{item.key === 'youtube' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
							</svg>
						)}
						{item.key === 'spotify' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.48-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.281 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.62.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
							</svg>
						)}
						{item.key === 'instagram' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
							</svg>
						)}
						{item.key === 'tiktok' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.5-1.28 2.5.01.78.38 1.54.97 2.03.8.67 1.94.84 2.9.46.91-.35 1.59-1.18 1.74-2.15.06-1.05.02-2.1.02-3.15V.02z" />
							</svg>
						)}
						{item.key === 'twitch' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
							</svg>
						)}
						{item.key === 'discord' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
							</svg>
						)}
						{item.key === 'substack' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
							</svg>
						)}
						{item.key === 'medium' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
							</svg>
						)}
						{item.key === 'figma' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4zM4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4zm0-8c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4zm8-4h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0zm0 8h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V8z" />
							</svg>
						)}
						{item.key === 'dribbble' && (
							<svg viewBox="0 0 24 24" className="size-6 fill-current transition-colors">
								<path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm9.84 10.86c-2.8-.2-5.45.3-7.85 1.34 1.05 2.68 1.83 5.48 2.24 8.35 3.32-1.76 5.61-5.18 5.61-9.69zM12 21.84c-.39 0-.77-.03-1.15-.08-.34-2.61-1.07-5.17-2.06-7.62 2.63-1.12 5.51-1.63 8.52-1.39-.37 3.86-2.58 7.15-5.31 9.09zm-5.46-3.13c-2.83-1.89-4.7-5.07-4.7-8.71 0-.6.06-1.19.16-1.77 3.54 1.34 6.94 3.34 9.77 5.86-1.42 2.92-2.65 5.92-3.6 9.02-1.03-.43-1.91-1.12-1.63-4.4zm-4.38-12.7c2.47-1.34 5.32-2.01 8.34-1.84 2.87 2.11 5.32 4.67 7.15 7.55-2.8-.24-5.5.21-7.98 1.25C7.03 10.45 4.3 8.5 2.16 6.01z" />
							</svg>
						)}
						{!['github', 'linkedin', 'malt', 'x', 'youtube', 'spotify', 'instagram', 'tiktok', 'twitch', 'discord', 'substack', 'medium', 'figma', 'dribbble'].includes(item.key) && (
							<img src={faviconUrl} alt={item.label} className="size-5 rounded-full object-cover" />
						)}
					</motion.a>
				);
			})}

			<AnimatePresence>
				{open && activeItem && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.96 }}
						animate={{
							opacity: 1,
							y: 0,
							scale: 1,
						}}
						exit={{ opacity: 0, y: 8, scale: 0.96 }}
						transition={{ type: 'spring', stiffness: 450, damping: 32 }}
						style={{ left: `${popupLeft}px` }}
						className="squircle-sm border border-white/20 dark:border-white/15 bg-white/10 dark:bg-stone-900/50 backdrop-blur-3xl absolute bottom-[calc(100%+0.85rem)] flex -translate-x-1/2 items-end overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] z-50 select-none pointer-events-auto"
					>
						<div className="absolute inset-x-0 top-0 h-[1px] bg-linear-to-r from-transparent via-white/40 to-transparent z-30 pointer-events-none" />
						<div className="absolute inset-0 bg-linear-to-b from-white/12 via-white/4 to-transparent pointer-events-none z-20" />

						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={`${activeItem.key}-${activeItem.url}`}
								initial={{ x: 180 * direction, opacity: 0, filter: 'blur(4px)' }}
								animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
								exit={{ x: -180 * direction, opacity: 0, filter: 'blur(4px)' }}
								transition={{ type: 'spring', stiffness: 350, damping: 30 }}
								className="relative z-10 w-max h-max max-w-[calc(100vw-2rem)] min-w-[240px]"
							>
								{activeItem.key === 'github' && (
									<div className="flex flex-col gap-3 p-3.5 max-w-full overflow-hidden">
										<div className="flex items-center gap-3 [&_img]:rounded-full">
											<img src={avatarSrc} alt={CONTACT.name} className="size-10 rounded-full object-cover shadow-sm" />
											<div className="flex flex-col min-w-0">
												<span className="font-semibold text-sm tracking-tight text-fg truncate">
													{liveGithubProfile?.name || itemHandle}
												</span>
												<p className="text-muted text-xs truncate">
													{liveGithubContribs?.total || 120} contributions in 2026
												</p>
											</div>
										</div>
										<GithubGraph contributions={liveGithubContribs} />
									</div>
								)}

								{activeItem.key === 'linkedin' && (
									<div className="w-[min(270px,calc(100vw-3rem))] flex flex-col relative overflow-hidden rounded-xl">
										<div className="h-16 w-full bg-linear-to-br from-[#0A66C2] via-[#0A66C2]/80 to-[#0A66C2]/30" />
										<div className="bg-surface absolute left-3.5 top-16 -translate-y-1/2 rounded-full p-0.5 shadow-lg [&_img]:size-14 [&_img]:rounded-full z-20">
											<img src={avatarSrc} alt={CONTACT.name} className="size-14 rounded-full object-cover shadow-md" />
										</div>
										<div className="flex flex-col gap-1 p-3.5 pt-8">
											<span className="font-semibold text-sm text-fg">
												{itemHandle}
											</span>
											<div className="mt-1 flex items-end justify-between gap-3">
												<p className="text-muted text-xs leading-relaxed max-w-[140px]">
													{labels?.linkedinHeadline || 'LinkedIn Profile'}
													<br />
													{labels?.linkedinLocation || 'Remote'}
												</p>
												<a
													className="text-bg h-fit rounded-full bg-[#0A66C2] px-3.5 py-1 text-xs font-semibold transition-all hover:brightness-125 dark:bg-[#71B7FB] shadow-md shrink-0"
													href={activeItem.url}
													target="_blank"
													rel="noopener noreferrer"
												>
													{labels?.linkedinCta || 'Connect'}
												</a>
											</div>
										</div>
									</div>
								)}

								{activeItem.key === 'x' && (
									<div className="w-[min(270px,calc(100vw-3rem))] flex flex-col relative overflow-hidden rounded-xl">
										<div className="h-24 w-full relative bg-linear-to-r from-stone-900 via-stone-800 to-black overflow-hidden">
											<img
												className="h-24 w-full object-cover"
												src={liveXProfile?.bannerUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
												alt="X Banner"
												onError={(e) => {
													(e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
												}}
											/>
										</div>
										<div className="bg-surface absolute left-3.5 top-24 -translate-y-1/2 rounded-full p-0.5 shadow-lg [&_img]:size-14 [&_img]:rounded-full z-20">
											<img
												src={avatarSrc}
												alt={liveXProfile?.name || CONTACT.name}
												className="size-14 rounded-full object-cover shadow-md ring-2 ring-white/10"
												onError={(e) => {
													(e.target as HTMLImageElement).src = '/avatar.jpg';
												}}
											/>
										</div>
										<div className="flex flex-col p-3.5">
											<div className="flex justify-between items-start">
												<div className="flex flex-col mt-5 min-w-0 pr-2">
													<span className="font-semibold text-sm text-fg truncate">
														{liveXProfile?.name || itemHandle}
													</span>
													<span className="text-muted text-xs truncate">{liveXProfile?.handle || itemHandle}</span>
												</div>
												<a
													className="bg-fg text-bg hover:bg-fg/90 h-fit rounded-full px-3.5 py-1 text-xs font-semibold transition-all mt-5 shadow-md hover:scale-105 shrink-0"
													href={activeItem.url}
													target="_blank"
													rel="noopener noreferrer"
												>
													{labels?.xCta || 'Follow'}
												</a>
											</div>
											<p className="text-muted text-xs mt-2.5 max-w-[240px] leading-relaxed">
												{liveXProfile?.bio || 'Creator & Builder'}
											</p>
										</div>
									</div>
								)}

								{/* Dynamic Popover Card for ALL other platform links (TikTok, Twitch, Substack, Medium, Figma, Dribbble, Generic, etc.) */}
								{activeItem.key !== 'github' && activeItem.key !== 'linkedin' && activeItem.key !== 'x' && (
									<div className="flex flex-col gap-3 p-4 w-[min(280px,calc(100vw-3rem))]">
										<div className="flex items-center gap-3">
											<div className="size-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center p-0.5 shrink-0 shadow-inner overflow-hidden">
												<img
													src={avatarSrc}
													alt={activeItem.label}
													className="size-10 rounded-full object-cover"
													onError={(e) => {
														(e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${domainHost}&sz=64`;
													}}
												/>
											</div>
											<div className="flex flex-col min-w-0">
												<span className="font-semibold text-sm text-fg truncate capitalize">
													{activeItem.label || activeItem.key}
												</span>
												<span className="text-muted text-xs truncate">
													{itemHandle || domainHost}
												</span>
											</div>
										</div>

										<div className="flex items-center justify-between pt-1 border-t border-white/10">
											<span className="text-[11px] text-muted font-mono truncate max-w-[150px]">
												{domainHost}
											</span>
											<a
												href={activeItem.url}
												target="_blank"
												rel="noopener noreferrer"
												className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-fg font-medium text-xs transition-all shadow-sm hover:scale-105 shrink-0"
											>
												Visit Link ↗
											</a>
										</div>
									</div>
								)}
							</motion.div>
						</AnimatePresence>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="absolute inset-0 -top-3 pointer-events-none" />
		</motion.div>
	);
}
