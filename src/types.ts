export type Image = {
  id: string;
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
};
