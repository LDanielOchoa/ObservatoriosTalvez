// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),

	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'hover',
	},
	integrations: [react()],

	vite: {
		plugins: [tailwindcss()],
		build: {
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes('node_modules')) {
							if (id.includes('react') || id.includes('react-dom')) {
								return 'vendor-react';
							}
							if (id.includes('@heroui') || id.includes('@react-aria') || id.includes('@react-stately')) {
								return 'vendor-heroui';
							}
							if (id.includes('@solar-icons')) {
								return 'vendor-icons';
							}
						}
					},
				},
			},
		},
	},
});

