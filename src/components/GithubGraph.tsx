import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toWeeks, type Contributions } from '../utils/github-contributions';

interface GithubGraphProps {
	contributions: Contributions;
}

interface HoveredState {
	count: number;
	date: string;
	left: number;
	top: number;
}

const levels = [
	'bg-fg/10',
	'bg-green-600/20 dark:bg-green-400/20',
	'bg-green-600/40 dark:bg-green-400/40',
	'bg-green-600/65 dark:bg-green-400/65',
	'bg-green-600/90 dark:bg-green-400/90',
];

export default function GithubGraph({ contributions }: GithubGraphProps) {
	const weeks = useMemo(() => toWeeks(contributions), [contributions]);
	const [hovered, setHovered] = useState<HoveredState | null>(null);
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const [tooltipWidth, setTooltipWidth] = useState<number>(0);

	const formatter = useMemo(() => {
		const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'en';
		return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' });
	}, []);

	const label = useMemo(() => {
		if (!hovered) return '';
		return `${hovered.count} contribution${hovered.count > 1 ? 's' : ''} · ${formatter.format(new Date(hovered.date))}`;
	}, [hovered, formatter]);

	const left = useMemo(() => {
		if (!hovered) return 0;
		return Math.min(Math.max(hovered.left, tooltipWidth / 2), containerWidth - tooltipWidth / 2);
	}, [hovered, tooltipWidth, containerWidth]);

	function handlePointerOver(event: React.PointerEvent<HTMLDivElement>) {
		const target = event.target as HTMLElement;
		const { date, count } = target.dataset;
		if (!date) {
			setHovered(null);
			return;
		}
		setHovered({
			count: Number(count),
			date,
			left: target.offsetLeft + target.offsetWidth / 2,
			top: target.offsetTop,
		});
	}

	return (
		<div
			className="github-graph relative flex w-[min(22rem,calc(100vw-6rem))] flex-col gap-2"
			ref={(node) => {
				if (node) setContainerWidth(node.clientWidth);
			}}
			onPointerOver={handlePointerOver}
			onPointerLeave={() => setHovered(null)}
			role="presentation"
		>
			<div
				className="grid grid-flow-col grid-rows-7 gap-[1.5px]"
				style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
			>
				{weeks.map((week, weekIndex) => (
					<React.Fragment key={weekIndex}>
						{week.map((day, dayIndex) => (
							<div
								key={dayIndex}
								className={`aspect-square w-full rounded-[1.5px] ${day ? levels[day.level] : ''}`}
								data-date={day?.date}
								data-count={day?.count}
							/>
						))}
					</React.Fragment>
				))}
			</div>

			<AnimatePresence>
				{hovered && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.1 }}
						className="squircle pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+0.25rem)] bg-stone-900 px-2 py-1 text-xs text-nowrap text-stone-100 shadow-xl/30 dark:bg-stone-950"
						style={{ left: `${left}px`, top: `${hovered.top}px` }}
						ref={(node) => {
							if (node) setTooltipWidth(node.clientWidth);
						}}
					>
						{label}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
