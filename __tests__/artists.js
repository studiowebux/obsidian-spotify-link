let input = `
artists:
  - "[[{{ artists_formatted }}]]"
		`;

const track = {
	artists: [{ name: "artist_1" }, { name: "artist_2" }],
};

const track_one_artist = {
	artists: [{ name: "artist_1" }],
};

const output_default = input.replace(
	/{{ artists_formatted }}|{{artist_formatted}}/g,
	track.artists.map((a) => a.name).join(", "),
);

console.log(output_default);

const output_1 = `
artists:
{{ artists_formatted }}
		`.replace(/{{ artists_formatted(:.*?)?(:.*?)? }}/, (_match, ...options) => {
	console.log(_match, options);
	const matches = options
		.slice(0, options.length - 2)
		.filter((m) => m !== undefined);

	console.log(matches);

	return track.artists.map((a) => `${a.name}`).join("\n");
});

console.log(output_1);

const output_2 = `
artists:
{{ artists_formatted:  - [[:]] }}
		`.replace(/{{ artists_formatted(:.*?)?(:.*?)? }}/, (_match, ...options) => {
	const matches = options
		.slice(0, options.length - 2)
		.filter((m) => m !== undefined);

	// console.log(matches);
	const prefix = matches[0]?.substring(1) || "";
	const suffix = matches[1]?.substring(1) || "";

	return track.artists.map((a) => `${prefix}${a.name}${suffix}`).join("\n");
});

console.log(output_2);

const output_3 = `
artists:
{{ artists_formatted:  - [[:]] }}
		`.replace(/{{ artists_formatted(:.*?)?(:.*?)? }}/, (_match, ...options) => {
	const matches = options
		.slice(0, options.length - 2)
		.filter((m) => m !== undefined);

	// console.log(matches);
	const prefix = matches[0]?.substring(1) || "";
	const suffix = matches[1]?.substring(1) || "";

	return track_one_artist.artists
		.map((a) => `${prefix}${a.name}${suffix}`)
		.join("\n");
});

console.log(output_3);

const output_4 = `
artists:
{{ artists_formatted }}
		`.replace(/{{ artists_formatted(:.*?)?(:.*?)? }}/, (_match, ...options) => {
	const matches = options
		.slice(0, options.length - 2)
		.filter((m) => m !== undefined);

	// console.log(matches);
	const prefix = matches[0]?.substring(1) || "";
	const suffix = matches[1]?.substring(1) || "";

	return track.artists.map((a) => `${prefix}${a.name}${suffix}`).join("\n");
});

console.log(output_4);

const output_5 = `
artists:
{{ artists_formatted:  - [[:]] }}
		`.replace(/{{ artists_formatted(:.*?)?(:.*?)? }}/, (_match, ...options) => {
	const matches = options
		.slice(0, options.length - 2)
		.filter((m) => m !== undefined);

	// console.log(matches);
	const prefix = matches[0]?.substring(1) || "";
	const suffix = matches[1]?.substring(1) || "";

	return track_one_artist.artists
		.map((a) => `${prefix}${a.name}${suffix}`)
		.join("\n");
});

console.log(output_5);
