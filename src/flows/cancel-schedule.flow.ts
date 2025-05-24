import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "src/services/ai";
import { clearHistory } from "src/utils/handleHistory";
import {
  deleteCalendarEvent,
  getCurrentCalendar,
  getCurrentCalendarToJson,
} from "../services/calendar";
import { getPromptsByName } from "src/services/prompts";
import { PROMPT } from "src/common/enums";
import { IEventCalendar, IPrompt } from "src/common/interfaces";

const generatepromptToFormatDate = async (prevAppointments: string) => {
  const cancelPrompt: IPrompt = await getPromptsByName(PROMPT.Cancel);

  return cancelPrompt.prompt.replaceAll("{RESERVAS_PREVIAS}", prevAppointments);
};

/**
 * Hable sobre todo lo referente a cancelar citas
 */

const flowCancel = addKeyword(EVENTS.ACTION)
  .addAction(async (_, { flowDynamic }) => {
    await flowDynamic("Vamos a cancelar una cita 🗓️❌");
    await flowDynamic("¿Cuál es tu nombre?");
  })
  .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
    await state.update({ name: ctx.body });

    await flowDynamic("¿Cuál es tu numero telefonico?");
  })

  .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
    await state.update({ phone: ctx.body });
    await flowDynamic(
      "Perfecto. ¿Para qué fecha y hora tenías agendada la cita?",
    );
  })
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, extensions }) => {
      await flowDynamic("dame un momento para consultar la agenda...");
      const ai = extensions.ai as AIClass;

      const list = await getCurrentCalendar();
      const stringList = list?.length ? list : "ninguna";
      const promptToCancel = await generatepromptToFormatDate(stringList);

      // Analiza la fecha ingresada
      const formattedDate = await ai.createChat([
        {
          role: "system",
          content: promptToCancel,
        },
        {
          role: "user",
          content: ctx.body,
        },
      ]);

      await state.update({ cancelDate: formattedDate });

      const calendar = await getCurrentCalendarToJson();

      const name = state.get("name");
      const phone = state.get("phone");
      const cancelDate = formattedDate;

      const matchingEvent: IEventCalendar = calendar.find((event) => {
        return (
          event.client?.toLowerCase() === name.toLowerCase() &&
          event.phoneNumber.toLowerCase() === phone.toLowerCase() &&
          event.startDate?.includes(cancelDate)
        );
      });

      if (matchingEvent) {
        await flowDynamic(
          `Encontré tu cita programada para el ${matchingEvent.startDate}. ¿Deseas cancelarla? (sí/no)`,
        );
        await state.update({ eventToCancel: matchingEvent });
      } else {
        await flowDynamic(
          `No encontré ninguna cita a nombre de "${name}" en esa fecha y hora. 😕`,
        );
        return;
      }
    },
  )
  .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
    const confirm = ctx.body.trim().toLowerCase();
    const event: IEventCalendar = state.get("eventToCancel");

    if (
      confirm.toLocaleUpperCase() === "sí" ||
      confirm.toLowerCase() === "si"
    ) {
      await deleteCalendarEvent(event);
      await flowDynamic("✅ Tu cita ha sido cancelada. ¡Gracias por avisar!");
    } else if (confirm.toLowerCase() === "no") {
      await flowDynamic("👍 Entiendo. La cita no se ha cancelado.");
    } else {
      await flowDynamic(
        "Lo siento, no entendí tu respuesta. Por favor, responde con 'sí' o 'no'.",
      );
    }

    clearHistory(state);
  });

export { flowCancel };
