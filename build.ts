// 一旦dist内をすべて削除する
const glob = new Bun.Glob("./dist/*");
for await (const file of glob.scan(".")) {
	const target = Bun.file(file);
	await target.delete();
}

// background
const backgroundBuild = Bun.build({
	entrypoints: ["./src/background/background.ts"],
	outdir: "./dist",
	minify: true,
});

// content
const contentBuild = Bun.build({
	entrypoints: ["./src/content/content.ts"],
	outdir: "./dist",
	minify: true,
});

// sidePanel htmlとcssも一緒にビルドされる
const sidePanelBuild = Bun.build({
	entrypoints: ["./src/sidepanel/sidepanel.html"],
	outdir: "./dist",
	minify: true,
});

// 画像ファイルを一括コピー
async function copyImgs() {
	const from = "./src";
	const to = "./dist";
	const imgBlog = new Bun.Glob(`${from}/images/*.png`);
	for await (const img of imgBlog.scan({ onlyFiles: true })) {
		const input = Bun.file(img);
		const output = Bun.file(to + img.slice(from.length));
		await Bun.write(output, input);
	}
}

// manifestファイルをコピー
async function copyManifest() {
	const from = "./src";
	const to = "./dist";
	const manifest = Bun.file(`${from}/manifest.json`);
	const output = Bun.file(`${to}/manifest.json`);
	await Bun.write(output, manifest);
}

Promise.all([
	backgroundBuild,
	contentBuild,
	sidePanelBuild,
	copyImgs(),
	copyManifest(),
]);
