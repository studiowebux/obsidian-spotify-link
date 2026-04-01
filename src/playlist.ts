import { PlaylistDetail, TemplateOptions } from "./types";

export function getPlaylistMessage(
	playlist: PlaylistDetail,
	template: string,
	options?: TemplateOptions,
): string {
	const defaultImageSize = options?.defaultImageSize ?? "";
	return template
		.replace(
			/{{ playlist_name }}|{{playlist_name}}/g,
			playlist.name,
		)
		.replace(
			/{{ playlist_link }}|{{playlist_link}}/g,
			`[${playlist.name}](${playlist.external_urls.spotify})`,
		)
		.replace(
			/{{ playlist_url }}|{{playlist_url}}/g,
			playlist.external_urls.spotify,
		)
		.replace(
			/{{ playlist_description }}|{{playlist_description}}/g,
			playlist.description,
		)
		.replace(
			/{{ playlist_track_count }}|{{playlist_track_count}}/g,
			String(playlist.tracks.total),
		)
		.replace(
			/{{ playlist_cover_large(\\?\|[^\s}]*)? }}|{{playlist_cover_large(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				return `![${playlist.name}${sizeStr}](${playlist.images[0]?.url ?? ""})`;
			},
		)
		.replace(
			/{{ playlist_cover_small(\\?\|[^\s}]*)? }}|{{playlist_cover_small(\\?\|[^\s}]*)?}}/g,
			(_match, p1, p2) => {
				const sizeParam = p1 ?? p2;
				const size = sizeParam?.replace(/^\\?\|/, '') || defaultImageSize;
				const sep = sizeParam?.startsWith('\\|') ? '\\|' : '|';
				const sizeStr = size ? `${sep}${size}` : "";
				const img = playlist.images.length > 0
					? playlist.images[playlist.images.length - 1]
					: null;
				return `![${playlist.name}${sizeStr}](${img?.url ?? ""})`;
			},
		)
		.replace(
			/{{ playlist_cover_url }}|{{playlist_cover_url}}/g,
			playlist.images[0]?.url ?? "",
		)
		.replace(
			/{{ playlist_owner }}|{{playlist_owner}}/g,
			playlist.owner.display_name,
		)
		.replace(
			/{{ playlist_public }}|{{playlist_public}}/g,
			String(playlist.public),
		)
		.replace(
			/{{ playlist_collaborative }}|{{playlist_collaborative}}/g,
			String(playlist.collaborative),
		);
}
