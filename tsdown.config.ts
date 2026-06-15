import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	deps: {
		onlyBundle: false,
	},
});
