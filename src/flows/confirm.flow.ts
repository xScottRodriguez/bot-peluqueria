import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import {
  clearHistory,
  handleHistory,
  getHistoryParse,
} from "../utils/handleHistory";
import { getFullCurrentDate } from "../utils/currentDate";
import { appToCalendar } from "src/services/calendar";

const generatePromptToFormatDate = (history: string) => {
  const prompt = `Fecha de Hoy:${getFullCurrentDate()}, Basado en el Historial de conversacion: 
    ${history}
    ----------------
    Fecha ideal:...yyyy-MM-dd hh:mm`;

  return prompt;
};

const generateJsonParse = (info: string) => {
  const prompt = `tu tarea principal es analizar la información proporcionada en el contexto y generar un objeto JSON que se adhiera a la estructura especificada a continuación. 

    Contexto: "${info}"
    
    {
        "name": "Leifer",
        "startDate": "2025-05-18T15:31:00",
        "phoneNumber":"+503 72720787"
    }
    
    Objeto JSON a generar:`;

  return prompt;
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
      const text = await ai.createChat(
        [
          {
            role: "system",
            content: generatePromptToFormatDate(history),
          },
        ],
        "gpt-4",
      );

      await handleHistory({ content: text, role: "assistant" }, state);
      await flowDynamic(`¿Me confirmas fecha y hora?: ${text}`);
      await state.update({ startDate: text });
    },
  )
  .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
    await flowDynamic(`Ultima pregunta ¿Cual es tu numero telefonico?`);
  })
  .addAction(
    { capture: true },
    async (ctx, { state, extensions, flowDynamic }) => {
      const infoCustomer = `name: ${state.get("name")}, starteDate: ${state.get("startDate")}, phoneNumber: ${ctx.body}`;
      const ai = extensions.ai as AIClass;

      const text = await ai.createChat([
        {
          role: "system",
          content: generateJsonParse(infoCustomer),
        },
      ]);

      await appToCalendar(text);
      clearHistory(state);
      await flowDynamic("Listo! agendado Buen dia");
    },
  );

export { flowConfirm };
