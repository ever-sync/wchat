import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Build separado e leve do widget público de formulários.
// Sai em dist/embed (servido em <origin>/embed/), sem o bundle do app principal.
// Roda DEPOIS do `vite build` principal (o build principal limpa dist/).
export default defineConfig({
  base: "/embed/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist/embed",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "embed.html"),
    },
  },
});
