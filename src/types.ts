export type Image = {
  phash: string;
  guild_id: string;
  first_post_user_name: string;
  first_post_channel_id: string;
  first_post_message_id: string;
  first_post_timestamp: number;
  last_post_user_name: string;
  last_post_channel_id: string;
  last_post_message_id: string;
  last_post_timestamp: number;
  count: number;
};

export type ImageUpdate = {
  phash: string;
  guild_id: string;
  user_name: string;
  channel_id: string;
  message_id: string;
  timestamp: number;
  count?: number;
};

export type Link = Omit<ImageUpdate, "phash"> & { url: string };

export type SimilarHashes = {
  exact: string[];
  close: string[];
  similar: string[];
}

export type PopeGet = {
  user_id: string;
  user_name: string;
  total_gets: number;
  get_streak: number;
  last_get_timestamp: number;
}