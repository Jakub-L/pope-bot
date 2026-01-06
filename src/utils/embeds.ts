import { Message } from "discord.js";
import { Link } from "../types";

export const makeLinksEmbeddable = async ({
  message,
  links
}: {
  message: Message;
  links: Link[];
}) => {
  if (message.content.includes("wiadomosc testowa prosze zignorowac")) {
    message.edit("Edytowane przez papieza!");
  }
};
