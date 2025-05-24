import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import {
  clearHistory,
  handleHistory,
  getHistoryParse,
} from "../utils/handleHistory";
import { getFullCurrentDate } from "../utils/currentDate";
import { appToCalendar } from "src/services/calendar";
import { PROMPT } from "src/common/enums";
import { IPrompt } from "src/common/interfaces";
import { getPromptsByName } from "src/services/prompts";

const generatePromptToFormatDate = async (history: string) => {
  const prompt: IPrompt = await getPromptsByName(PROMPT.generateFormatDate);
  return prompt.prompt
    .replaceAll("{GET_FULL_CURRENT_DATE}", getFullCurrentDate())
    .replace("{HISTORY}", history);
};

const generateJsonParse = async (info: string) => {
  const prompt: IPrompt = await getPromptsByName(PROMPT.generateJson);
  return prompt.prompt.replace("{INFO}", info);
};

/**
 * Encargado de pedir los datos necesarios para registrar el evento en el calendario
 */
const flowConfirm = addKeyword(EVENTS.ACTION)
  .addAction(async (_, { flowDynamic }) => {
    await flowDynamic("Ok, voy a pedirte unos datos para agendar");
    await flowDynamic("¿Cual es tu nombre?");
  })
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions }) => {
      await state.update({ name: ctx.body });
      const ai = extensions.ai as AIClass;
      const history = getHistoryParse(state);
      const prompt = await generatePromptToFormatDate(history);
      const text = await ai.createChat(
        [
          {
            role: "system",
            content: prompt,
          },
        ],
        "gpt-4",
      );

      await handleHistory({ content: text, role: "assistant" }, state);
      await flowDynamic(`¿Me confirmas fecha y hora?: ${text}`);
      await state.update({ startDate: text });
    },
  )
  .addAction({ capture: true }, async (_ctx, { state, flowDynamic }) => {
    await state.update({ service: _ctx.body });

    await flowDynamic(`¿Cual es tu numero telefonico?`);
  })
  .addAction({ capture: true }, async (_ctx, { state, flowDynamic }) => {
    await state.update({ phoneNumber: _ctx.body });
    const services: IPrompt = await getPromptsByName(PROMPT.services);
    await flowDynamic(`¿Me confirmas el servicio?`);
    await flowDynamic(services.prompt);
  })
  .addAction(
    { capture: true },
    async (ctx, { state, extensions, flowDynamic }) => {
      const infoCustomer = `name: ${state.get("name")}, starteDate: ${state.get("startDate")}, phoneNumber: ${state.get("phoneNumber")},service: ${ctx.body}`;
      const ai = extensions.ai as AIClass;
      const prompt = await generateJsonParse(infoCustomer);
      const text = await ai.createChat([
        {
          role: "system",
          content: prompt,
        },
      ]);

      await appToCalendar(text);
      clearHistory(state);
      await flowDynamic("Listo! agendado Buen dia");
    },
  );

export { flowConfirm };
