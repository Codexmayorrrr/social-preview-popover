import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTACT } from '../config';
import GithubGraph from './GithubGraph';
import type { Contributions } from '../utils/github-contributions';

export interface ContactsProps {
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
	githubProfile?: {
		name?: string;
		login?: string;
		bio?: string;
		location?: string;
		avatarUrl?: string;
	};
	xProfile?: {
		name?: string;
		handle?: string;
		bio?: string;
		followers?: number;
		following?: number;
		avatarUrl?: string;
		bannerUrl?: string;
	};
}

const items = [
	{ label: 'GitHub', url: CONTACT.github, key: 'github' },
	{ label: 'LinkedIn', url: CONTACT.linkedin, key: 'linkedin' },
	{ label: 'Malt', url: CONTACT.malt, key: 'malt' },
	{ label: 'X', url: CONTACT.x, key: 'x' },
];

export default function Contacts({
	contributions = { total: 0, start: '', levels: '', counts: [] },
	contributionsLabel = '142 contributions in 2026',
	labels = {
		linkedinHeadline: 'Design Engineer',
		linkedinLocation: 'Remote',
		linkedinCta: 'Connect',
		maltAvailability: 'Available for projects',
		maltRate: 'Contact for rates',
		maltLocation: 'Remote',
		xCta: 'Follow',
	},
	githubProfile = {},
	xProfile = {},
}: ContactsProps) {
	const [open, setOpen] = useState(false);
	const [contentIndex, setContentIndex] = useState(0);
	const [prevContentIndex, setPrevContentIndex] = useState(0);
	const [popupDimensions, setPopupDimensions] = useState<{ width: number; height: number; left: number }>({
		width: 0,
		height: 0,
		left: 0,
	});

	const popupElementRef = useRef<HTMLDivElement>(null);
	const direction = useMemo(
		() => Math.max(Math.min(contentIndex - prevContentIndex, 1), -1),
		[contentIndex, prevContentIndex],
	);

	const avatarSrc = useMemo(
		() => xProfile?.avatarUrl || githubProfile?.avatarUrl || 'https://github.com/Codexmayorrrr.png',
		[xProfile, githubProfile],
	);

	function handleHover(event: React.PointerEvent<HTMLAnchorElement>, index: number) {
		if (event.pointerType !== 'mouse') return;
		const node = event.currentTarget;
		if (!node) return;

		const nextLeft = node.offsetLeft + node.offsetWidth / 2;
		setOpen(true);
		setPrevContentIndex(contentIndex);
		setContentIndex(index);
		setPopupDimensions((prev) => ({ ...prev, left: nextLeft }));
	}

	useLayoutEffect(() => {
		if (!open || !popupElementRef.current) return;

		const updateDimensions = () => {
			if (popupElementRef.current) {
				const rect = popupElementRef.current.getBoundingClientRect();
				setPopupDimensions((prev) => ({
					...prev,
					width: Math.round(rect.width),
					height: Math.round(rect.height),
				}));
			}
		};

		updateDimensions();

		const resizeObserver = new ResizeObserver(updateDimensions);
		resizeObserver.observe(popupElementRef.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, [open, contentIndex]);

	return (
		<div
			className="contacts-dock relative flex items-center gap-1 p-1.5 rounded-full bg-white/10 dark:bg-stone-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] transition-all duration-300"
			onMouseLeave={() => setOpen(false)}
			role="presentation"
		>
			{items.map((item, index) => (
				<a
					key={index}
					className="hover:[&_path]:fill-fg [&_path]:fill-muted z-10 p-2.5 rounded-full transition-all duration-200 hover:bg-white/15 dark:hover:bg-white/10 hover:scale-110 active:scale-95"
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={item.label}
					onPointerEnter={(e) => handleHover(e, index)}
				>
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
				</a>
			))}

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{
							opacity: 1,
							left: `${popupDimensions.left}px`,
							width: `${popupDimensions.width}px`,
							height: `${popupDimensions.height}px`,
						}}
						exit={{ opacity: 0 }}
						transition={{ type: 'spring', stiffness: 350, damping: 30 }}
						className="squircle-sm border border-white/15 dark:border-white/10 bg-white/5 dark:bg-stone-900/40 backdrop-blur-3xl absolute bottom-[calc(100%+0.85rem)] flex -translate-x-1/2 items-end overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] z-50 transition-shadow duration-300"
					>
						<div className="absolute inset-x-0 top-0 h-[1px] bg-linear-to-r from-transparent via-white/25 to-transparent z-30 pointer-events-none" />
						<div className="absolute inset-0 bg-linear-to-b from-white/8 via-transparent to-transparent pointer-events-none z-20" />

						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={contentIndex}
								ref={popupElementRef}
								initial={{ x: 220 * direction, opacity: 0, filter: 'blur(4px)' }}
								animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
								exit={{ x: -220 * direction, opacity: 0, filter: 'blur(4px)' }}
								transition={{ type: 'spring', stiffness: 300, damping: 28 }}
								className="relative z-10 w-max h-max"
							>
								{contentIndex === 0 && (
									<div className="flex flex-col gap-3 p-3.5">
										<div className="flex items-center gap-3 [&_img]:rounded-full">
											<img src={avatarSrc} alt={CONTACT.name} className="size-10 rounded-full object-cover" />
											<div className="flex flex-col">
												<span className="font-semibold text-sm tracking-tight text-fg">
													{githubProfile?.name || githubProfile?.login || CONTACT.githubUsername}
												</span>
												<p className="text-muted text-xs">{contributionsLabel}</p>
											</div>
										</div>
										<GithubGraph contributions={contributions} />
									</div>
								)}

								{contentIndex === 1 && (
									<div className="w-[270px] flex flex-col relative overflow-hidden rounded-xl">
										<div className="h-16 w-full bg-linear-to-br from-[#0A66C2] via-[#0A66C2]/80 to-[#0A66C2]/30" />
										<div className="bg-surface absolute left-3.5 top-16 -translate-y-1/2 rounded-full p-0.5 shadow-lg [&_img]:size-14 [&_img]:rounded-full z-20">
											<img src={avatarSrc} alt={CONTACT.name} className="size-14 rounded-full object-cover" />
										</div>
										<div className="flex flex-col gap-1 p-3.5 pt-8">
											<span className="font-semibold text-sm text-fg">
												{githubProfile?.name || xProfile?.name || CONTACT.name}
											</span>
											<div className="mt-1 flex items-end justify-between gap-3">
												<p className="text-muted text-xs leading-relaxed max-w-[140px]">
													{labels?.linkedinHeadline || 'Design Engineer'}
													<br />
													{labels?.linkedinLocation || 'Remote'}
												</p>
												<a
													className="text-bg h-fit rounded-full bg-[#0A66C2] px-3.5 py-1 text-xs font-semibold transition-all hover:brightness-125 dark:bg-[#71B7FB] shadow-md shrink-0"
													href={CONTACT.linkedin}
													target="_blank"
													rel="noopener noreferrer"
												>
													{labels?.linkedinCta || 'Connect'}
												</a>
											</div>
										</div>
									</div>
								)}

								{contentIndex === 2 && (
									<div className="flex flex-col gap-3 p-3.5">
										<div className="flex items-center gap-3 [&_img]:rounded-md">
											<img src={avatarSrc} alt={CONTACT.name} className="size-10 rounded-md object-cover" />
											<div className="flex flex-col">
												<span className="font-semibold text-sm text-fg">
													{githubProfile?.name || xProfile?.name || CONTACT.name}
												</span>
												<p className="text-muted flex items-center gap-1.5 text-xs">
													<span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
													{labels?.maltAvailability || 'Available for projects'}
												</p>
											</div>
										</div>
										<div className="text-muted flex items-baseline justify-between gap-6 text-xs text-nowrap">
											<div className="flex items-center gap-1">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0 text-muted">
													<path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
													<path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
													<path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.2.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
												</svg>
												{labels?.maltRate || 'Contact for rates'}
											</div>
											<div className="flex items-center gap-1">
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0 text-muted">
													<path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
												</svg>
												{labels?.maltLocation || 'Remote'}
											</div>
										</div>
										<div className="text-muted flex flex-wrap gap-2 text-xs">
											{['React', 'TypeScript', 'Node'].map((skill) => (
												<span key={skill} className="ring-white/10 dark:ring-white/10 rounded-md px-2 py-0.5 ring bg-white/5">
													{skill}
												</span>
											))}
										</div>
									</div>
								)}

								{contentIndex === 3 && (
									<div className="w-[270px] flex flex-col relative overflow-hidden rounded-xl">
										<img
											className="h-24 w-full object-cover"
											src={xProfile?.bannerUrl || 'https://pbs.twimg.com/profile_banners/1694851611066044417/1776283207'}
											alt=""
											onLoad={() => {
												if (popupElementRef.current) {
													const rect = popupElementRef.current.getBoundingClientRect();
													setPopupDimensions((prev) => ({
														...prev,
														width: Math.round(rect.width),
														height: Math.round(rect.height),
													}));
												}
											}}
										/>
										<div className="bg-surface absolute left-3.5 top-24 -translate-y-1/2 rounded-full p-0.5 shadow-lg [&_img]:size-14 [&_img]:rounded-full z-20">
											<img src={avatarSrc} alt={CONTACT.name} className="size-14 rounded-full object-cover" />
										</div>
										<div className="flex flex-col p-3.5">
											<div className="flex justify-between items-start">
												<div className="flex flex-col mt-5">
													<span className="font-semibold text-sm text-fg">
														{xProfile?.name || githubProfile?.name || CONTACT.name}
													</span>
													<span className="text-muted text-xs">{xProfile?.handle || CONTACT.twitterHandle}</span>
												</div>
												<a
													className="bg-fg text-bg hover:bg-fg/90 h-fit rounded-full px-3.5 py-1 text-xs font-semibold transition-all mt-5 shadow-md hover:scale-105 shrink-0"
													href={CONTACT.x}
													target="_blank"
													rel="noopener noreferrer"
												>
													{labels?.xCta || 'Follow'}
												</a>
											</div>
											{(xProfile?.bio || githubProfile?.bio) && (
												<p className="text-muted text-xs mt-2.5 max-w-[240px] leading-relaxed">
													{xProfile?.bio || githubProfile?.bio}
												</p>
											)}
											{Boolean(xProfile?.followers) && (
												<div className="flex items-center gap-3.5 mt-2.5 text-xs text-muted">
													<span>
														<strong className="text-fg font-semibold">{xProfile?.following ?? 412}</strong> Following
													</span>
													<span>
														<strong className="text-fg font-semibold">{xProfile?.followers ?? 1280}</strong> Followers
													</span>
												</div>
											)}
										</div>
									</div>
								)}
							</motion.div>
						</AnimatePresence>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="absolute inset-0 -top-3" />
		</div>
	);
}
