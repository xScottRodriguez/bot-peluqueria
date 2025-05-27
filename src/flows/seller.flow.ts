import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { generateTimer } from "../utils/generateTimer";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";
import { getPromptsByName } from "src/services/prompts";
import { PROMPT } from "src/common/enums";
import { IPrompt } from "src/common/interfaces";

export const generatePromptSeller = async (history: string) => {
  const nowDate = getFullCurrentDate();
  const [promptSeller, promptServices] = await Promise.all<
    [Promise<IPrompt>, Promise<IPrompt>]
  >([getPromptsByName(PROMPT.seller), getPromptsByName(PROMPT.services)]);

  return promptSeller.prompt
    .replace("{HISTORIAL_CONVERSACION}", history)
    .replace("{CURRENT_DAY}", nowDate)
    .replace("{SERVICIOS}", promptServices.prompt);
};

/**
 * Hablamos con el PROMPT que sabe sobre las cosas basicas del negocio, info, precio, etc.
 */
const flowSeller = addKeyword(EVENTS.ACTION).addAction(
  async (_, { state, flowDynamic, extensions }) => {
    try {
      const ai = extensions.ai as AIClass;
      const history = getHistoryParse(state);
      const prompt = await generatePromptSeller(history);

      const text = await ai.createChat([
        {
          role: "system",
          content: prompt,
        },
      ]);

      await handleHistory({ content: text, role: "assistant" }, state);

      const chunks = text.split(/(?<!\d)\.\s+/g);
      for (const chunk of chunks) {
        await flowDynamic([
          { body: chunk.trim(), delay: generateTimer(150, 250) },
        ]);
      }
    } catch (err) {
      console.log(`[ERROR]:`, err);
      return;
    }
  },
);

export { flowSeller };
