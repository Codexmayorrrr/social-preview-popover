# React Social Preview Popover

An Apple Liquid Glass animated social dock component with dynamic morphing popover cards for GitHub, LinkedIn, Malt, and X (Twitter), built with **React 19**, **Framer Motion**, and **Tailwind CSS v4**.

## Features

- 🍸 **Apple Liquid Glass Aesthetic**: Smooth backdrop blur, subtle borders, glassmorphic sheen, and superellipse squircle rounding.
- ⚡ **Dynamic Spring Morphing**: Popover card smoothly interpolates width, height, and horizontal offset between hovered icons using Framer Motion springs.
- 📊 **Interactive GitHub Heatmap Grid**: 52-week activity grid with hover date tooltips.
- 💼 **Profile Previews**: Rich popover cards displaying bio, location, availability, follower counts, and quick CTA buttons.
- 🚀 **Built for React 19 & Tailwind CSS v4**: Zero bundler conflicts, fully TypeScript typed.

## Getting Started

### Installation

```bash
pnpm install
# or npm install
```

### Development Server

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
```

## Component Usage

```tsx
import Contacts from './components/Contacts';

export default function Page() {
  return (
    <Contacts
      contributions={contributionsData}
      contributionsLabel="142 contributions in 2026"
      githubProfile={{
        name: 'Ali Ayooluwabamidele',
        login: 'Codexmayorrrr',
        bio: 'Design Engineer & Fullstack Developer',
        location: 'Remote'
      }}
      xProfile={{
        name: 'Ali Ayooluwabamidele',
        handle: '@dahdagger',
        followers: 1280,
        following: 412
      }}
    />
  );
}
```
