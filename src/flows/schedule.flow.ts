import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "src/services/ai";
import { getHistoryParse, handleHistory } from "src/utils/handleHistory";
import { generateTimer } from "../utils/generateTimer";
import { getCurrentCalendar } from "src/services/calendar";
import { getFullCurrentDate } from "src/utils/currentDate";
import { IPrompt } from "src/common/interfaces";
import { PROMPT } from "src/common/enums";
import { getPromptsByName } from "src/services/prompts";

const generateSchedulePrompt = async (summary: string, history: string) => {
  const nowDate = getFullCurrentDate();
  const mainPrompt: IPrompt = await getPromptsByName(PROMPT.schedule);

  return mainPrompt.prompt
    .replace("{AGENDA_ACTUAL}", summary)
    .replace("{HISTORIAL_CONVERSACION}", history)
    .replace("{CURRENT_DAY}", nowDate);
};

/**
 * Hable sobre todo lo referente a agendar citas, revisar historial saber si existe huecos disponibles
 */
const flowSchedule = addKeyword(EVENTS.ACTION).addAction(
  async (ctx, { extensions, state, flowDynamic }) => {
    await flowDynamic("dame un momento para consultar la agenda...");
    const ai = extensions.ai as AIClass;
    const history = getHistoryParse(state);
    const list = await getCurrentCalendar();
    const promptSchedule = await generateSchedulePrompt(
      list?.length ? list : "ninguna",
      history,
    );

    const text = await ai.createChat(
      [
        {
          role: "system",
          content: promptSchedule,
        },
        {
          role: "user",
          content: `Cliente pregunta: ${ctx.body}`,
        },
      ],
      "gpt-4",
    );

    await handleHistory({ content: text, role: "assistant" }, state);

    const chunks = text.split(/(?<!\d)\.\s+/g);
    for (const chunk of chunks) {
      await flowDynamic([
        { body: chunk.trim(), delay: generateTimer(150, 250) },
      ]);
    }
  },
);

export { flowSchedule };
