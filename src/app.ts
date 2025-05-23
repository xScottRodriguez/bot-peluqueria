import "dotenv/config";
import { createBot, MemoryDB, createProvider } from "@bot-whatsapp/bot";
import { BaileysProvider } from "@bot-whatsapp/provider-baileys";

import AIClass from "./services/ai";
import flows from "./flows";
import { envs } from "./config/envs";

const ai = new AIClass(process.env.OPEN_API_KEY, "gpt-3.5-turbo");

const main = async () => {
  const provider = createProvider(BaileysProvider);

  await createBot(
    {
      database: new MemoryDB(),
      provider,
      flow: flows,
    },
    { extensions: { ai } },
  );
  provider.initHttpServer(envs.port ?? 4000);
  console.log(`Server Running on port ${envs.port}`);
};

main();
