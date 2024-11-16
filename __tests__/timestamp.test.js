const inputs = [
  "{{ timestamp }}",
  "{{ timestamp(YYYY-MM-DD) }}",
  "{{ timestamp(YYYY-MM-DD HH:mm) }}",
  "{{ timestamp(HH:mm) }}",
  "{{ timestampz }}",
  "{{ timestampz(YYYY-MM-DD) }}",
  "{{ timestampz(YYYY-MM-DD HH:mm) }}",
  "{{ timestampz(HH:mm) }}",
];

const input = [
  "{{ timestamp }}",
  "{{ timestamp(YYYY-MM-DD) }}",
  "{{ timestamp(YYYY-MM-DD HH:mm) }}",
  "{{ timestamp(HH:mm) }}",
  "{{ timestampz }}",
  "{{ timestampz(YYYY-MM-DD) }}",
  "{{ timestampz(YYYY-MM-DD HH:mm) }}",
  "{{ timestampz(HH:mm) }}",
].join("\n");

function padZero(date) {
  return ("0" + date).slice(-2);
}

for (const i of inputs) {
  i.replace(
    /{{ timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}|{{timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}/g,
    (_match, ...options) => {
      const matches = options
        .slice(0, options.length - 2)
        .filter((m) => m !== undefined);

      // console.log(matches);

      let timestamp = "";
      const hasYearMonthDate = matches.includes("YYYY-MM-DD");
      const hasHourMinutes =
        matches.includes(" HH:mm") || matches.includes("HH:mm");
      if (matches.includes("z")) {
        if (hasYearMonthDate) {
          timestamp += `${new Date().getUTCFullYear()}-${padZero(new Date().getUTCMonth() + 1)}-${padZero(new Date().getUTCDate())}`;
        }
        if (hasHourMinutes) {
          if (timestamp.length > 0) {
            timestamp += " ";
          }
          timestamp += `${padZero(new Date().getUTCHours())}:${padZero(new Date().getUTCMinutes())}`;
        }

        if (matches.length === 1) {
          timestamp = `${new Date().toISOString()}`;
        }
      } else {
        if (hasYearMonthDate) {
          timestamp += `${new Date().getFullYear()}-${padZero(new Date().getMonth() + 1)}-${padZero(new Date().getDate())}`;
        }
        if (hasHourMinutes) {
          if (timestamp.length > 0) {
            timestamp += " ";
          }
          timestamp += `${padZero(new Date().getHours())}:${padZero(new Date().getMinutes())}`;
        }

        if (matches.length === 1) {
          timestamp = `${new Date().toDateString()} - ${new Date().toLocaleTimeString()}`;
        }
      }

      console.log(i, ":", timestamp);
      return timestamp;
    },
  );
}

const output = input.replace(
  /{{ timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}|{{timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}/g,
  (_match, ...options) => {
    console.debug(_match, options);
    const matches = options
      .slice(0, options.length - 2)
      .filter((m) => m !== undefined);

    // console.log(matches);

    let timestamp = "";
    const hasYearMonthDate = matches.includes("YYYY-MM-DD");
    const hasHourMinutes =
      matches.includes(" HH:mm") || matches.includes("HH:mm");
    if (matches.includes("z")) {
      if (hasYearMonthDate) {
        timestamp += `${new Date().getUTCFullYear()}-${padZero(new Date().getUTCMonth() + 1)}-${padZero(new Date().getUTCDate())}`;
      }
      if (hasHourMinutes) {
        if (timestamp.length > 0) {
          timestamp += " ";
        }
        timestamp += `${padZero(new Date().getUTCHours())}:${padZero(new Date().getUTCMinutes())}`;
      }

      if (matches.length === 1) {
        timestamp = `${new Date().toISOString()}`;
      }
    } else {
      if (hasYearMonthDate) {
        timestamp += `${new Date().getFullYear()}-${padZero(new Date().getMonth() + 1)}-${padZero(new Date().getDate())}`;
      }
      if (hasHourMinutes) {
        if (timestamp.length > 0) {
          timestamp += " ";
        }
        timestamp += `${padZero(new Date().getHours())}:${padZero(new Date().getMinutes())}`;
      }

      if (matches.length === 1) {
        timestamp = `${new Date().toDateString()} - ${new Date().toLocaleTimeString()}`;
      }
    }

    console.log("Input:", timestamp);
    return timestamp;
  },
);

console.log("output", output);

const template = `
Template **Song Name:** {{ song_name }}
**Song URL:** {{ song_link }}
**Album Name:** {{ album }}
**Album Release Date:** {{ album_release }}
**Album URL:** {{ album_link }}
**Cover:** {{ album_cover_medium }}
**Cover URL:** {{ album_cover_link_medium }}
**Artists:** {{ artists }}
**Added at:** *{{ timestamp }}*

**Timestamp tests:**

timestamp : {{ timestamp }}
timestampz : {{ timestampz }}
timestamp(HH:mm) : {{ timestamp(HH:mm) }}
timestampz(HH:mm) : {{ timestampz(HH:mm) }}
timestamp(YYYY-MM-DD) : {{ timestamp(YYYY-MM-DD) }}
timestampz(YYYY-MM-DD) : {{ timestampz(YYYY-MM-DD) }}
timestamp(YYYY-MM-DD HH:mm) : {{ timestamp(YYYY-MM-DD HH:mm) }}
timestampz(YYYY-MM-DD HH:mm) : {{ timestampz(YYYY-MM-DD HH:mm) }}

Genres Tests:

Genres: {{ genres }}
Genres Array: {{ genres_array }}
Genres hashatg: {{ genres_hashtag }}

Artists values:

artist_name: {{ artist_name }}
Popularity: {{ popularity }}
Followers: {{ followers }}
Artist images: {{ artist_image }}`.replace(
  /{{ timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}|{{timestamp(z?)(\(((YYYY-MM-DD)?( ?HH:mm)?)\))? }}/g,
  (_match, ...options) => {
    console.debug(_match, options);
    const matches = options
      .slice(0, options.length - 2)
      .filter((m) => m !== undefined);

    // console.log(matches);

    let timestamp = "";
    const hasYearMonthDate = matches.includes("YYYY-MM-DD");
    const hasHourMinutes =
      matches.includes(" HH:mm") || matches.includes("HH:mm");
    if (matches.includes("z")) {
      if (hasYearMonthDate) {
        timestamp += `${new Date().getUTCFullYear()}-${padZero(new Date().getUTCMonth() + 1)}-${padZero(new Date().getUTCDate())}`;
      }
      if (hasHourMinutes) {
        if (timestamp.length > 0) {
          timestamp += " ";
        }
        timestamp += `${padZero(new Date().getUTCHours())}:${padZero(new Date().getUTCMinutes())}`;
      }

      if (matches.length === 1) {
        timestamp = `${new Date().toISOString()}`;
      }
    } else {
      if (hasYearMonthDate) {
        timestamp += `${new Date().getFullYear()}-${padZero(new Date().getMonth() + 1)}-${padZero(new Date().getDate())}`;
      }
      if (hasHourMinutes) {
        if (timestamp.length > 0) {
          timestamp += " ";
        }
        timestamp += `${padZero(new Date().getHours())}:${padZero(new Date().getMinutes())}`;
      }

      if (matches.length === 1) {
        timestamp = `${new Date().toDateString()} - ${new Date().toLocaleTimeString()}`;
      }
    }

    console.log("Input:", timestamp);
    return timestamp;
  },
);

console.log("template", template);
