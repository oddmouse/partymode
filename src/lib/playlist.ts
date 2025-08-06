import api from "./api.js";
import {
  PLAYER_OPEN,
  PLAYLIST_ADD,
  VIDEO_LIBRARY_GET_EPISODES,
  VIDEO_LIBRARY_GET_MOVIES,
  VIDEO_LIBRARY_GET_TV_SHOWS,
} from "./methods.js";

export function createEpisodePlaylist({ count = 10, sameShow = false, tvshowId = -1 }) {
  api.addSessionListener(
    VIDEO_LIBRARY_GET_EPISODES,
    ({ detail }: CustomEventInit) => {
      const { episodes } = detail;

      api.call([
        ...episodes.map(({ episodeid }: { episodeid: number }) => ({
          method: PLAYLIST_ADD,
          params: { item: { episodeid }, playlistid: 1 },
        })),
        {
          method: PLAYER_OPEN,
          params: { item: { playlistid: 1 }, options: { shuffled: false } },
        },
      ]);
    },
    { once: true },
  );

  if (sameShow && !tvshowId) {
    api.addSessionListener(
      VIDEO_LIBRARY_GET_TV_SHOWS,
      ({ detail }: CustomEventInit) => {
        const { tvshows } = detail;
        const { tvshowid } = tvshows[0];

        api.call([
          {
            method: VIDEO_LIBRARY_GET_EPISODES,
            params: { tvshowid },
          },
        ]);
      },
      { once: true },
    );

    api.call([
      {
        method: VIDEO_LIBRARY_GET_TV_SHOWS,
        params: { limits: { end: 1, start: 0 }, sort: { method: "random" } },
      },
    ]);
  } else if (sameShow && tvshowId) {
    if (tvshowId) {
      api.call([
        {
          method: VIDEO_LIBRARY_GET_EPISODES,
          params: { limits: { end: count, start: 0 }, sort: { method: "random" }, tvshowid: tvshowId },
        },
      ]);
    }
  } else {
    api.call([
      {
        method: VIDEO_LIBRARY_GET_EPISODES,
        params: { limits: { end: count, start: 0 }, sort: { method: "random" } },
      },
    ]);
  }
}

export function createMoviePlaylist({ count = 1 }) {
  api.addSessionListener(
    VIDEO_LIBRARY_GET_MOVIES,
    ({ detail }: CustomEventInit) => {
      const { movies } = detail;

      api.call([
        ...movies.map(({ movieid }: { movieid: number }) => ({
          method: PLAYLIST_ADD,
          params: { item: { movieid }, playlistid: 1 },
        })),
        {
          method: PLAYER_OPEN,
          params: { item: { playlistid: 1 }, options: { shuffled: false } },
        },
      ]);
    },
    { once: true },
  );

  api.call([
    {
      method: VIDEO_LIBRARY_GET_MOVIES,
      params: { limits: { end: count, start: 0 }, sort: { method: "random" } },
    },
  ]);
}
