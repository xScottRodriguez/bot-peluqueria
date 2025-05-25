import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "src/services/ai";
import { getHistoryParse, handleHistory } from "src/utils/handleHistory";
import { generateTimer } from "../utils/generateTimer";
import { getCurrentCalendar } from "src/services/calendar";
import { getFullCurrentDate } from "src/utils/currentDate";
import { IPrompt } from "src/common/interfaces";
import { PROMPT } from "src/common/enums";
import { getPromptsByName } from "src/services/prompts";
import { normalizeDate } from "src/utils/date-normalizer";

const generateSpecialSchedule = async () => {
  const specialSchedule = await getPromptsByName(PROMPT.specialSchedule);

  const from = normalizeDate(specialSchedule.from);
  const to = normalizeDate(specialSchedule.to);
  return specialSchedule.prompt.replace(`{FROM}`, from).replace(`{TO}`, to);
};
const generateSchedulePrompt = async (summary: string, history: string) => {
  const nowDate = getFullCurrentDate();
  const [mainPrompt, specialSchedule] = await Promise.all<
    [Promise<IPrompt>, Promise<string>]
  >([getPromptsByName(PROMPT.schedule), generateSpecialSchedule()]);

  return mainPrompt.prompt
    .replace("{AGENDA_ACTUAL}", summary)
    .replace("{HISTORIAL_CONVERSACION}", history)
    .replace("{CURRENT_DAY}", nowDate)
    .replace("{HORARIO_ESPECIAL}", specialSchedule);
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
