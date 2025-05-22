import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { clearHistory, getHistoryParse } from "../utils/handleHistory";
import {
  deleteCalendarEvent,
  getCurrentCalendar,
  getCurrentCalendarToJson,
} from "../services/calendar";
import { getFullCurrentDate } from "src/utils/currentDate";
import { getPromptsByName } from "src/services/prompts";
import { PROMPT } from "src/common/enums";
import { IPrompt } from "src/common/interfaces";

// const PROMPT_SCHEDULE = `
// Eres un ingeniero de inteligencia artificial especializado en la programación y cancelación de reuniones. Tu tarea es analizar la conversación para identificar si el cliente desea  **cancelar** una reunión cita o reserva. Debes interpretar la intención del usuario y responder de manera precisa, considerando las reglas y la agenda actual.
//
// Fecha de hoy: {CURRENT_DAY}
//
// Reuniones ya agendadas:
// -----------------------------------
// {AGENDA_ACTUAL}
//
// Historial de Conversación:
// -----------------------------------
// {HISTORIAL_CONVERSACION}
//
// Reglas para cancelar:
// - Verifica si el cliente tiene una cita programada.
// - Si menciona fecha y hora, identifica la cita exacta.
// - Si hay coincidencia, responde pidiendo confirmación para cancelar.
// - Si no se encuentra una cita para cancelar, responde indicando que no hay ninguna reunión agendada en ese horario.
// - Sé claro y directo al indicar el resultado de la solicitud.
//
// INSTRUCCIONES:
// - NO saludes.
// - Detecta si se trata de una solicitud para  cancelar.
// - Responde con mensajes breves y claros, ideales para WhatsApp.
// - Siempre pide confirmación antes de cancelar una cita.
// `;

const generatepromptToFormatDate = async (prevAppointments: string) => {
  const cancelPrompt: IPrompt = await getPromptsByName(PROMPT.Cancel);

  return cancelPrompt.prompt.replace("{RESERVAS_PREVIAS}", prevAppointments);
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
      const calendarFormatted = calendar.map((event) => {
        const [date, time] = event.date.split(" ");
        return {
          ...event,
          date: `${date}T${time}`,
        };
      });
      const name = state.get("name");
      const cancelDate = formattedDate;

      const matchingEvent = calendarFormatted.find((event) => {
        console.log({
          cancelDate,
          event,
        });
        return (
          event.name?.toLowerCase() === name.toLowerCase() &&
          event.date?.includes(cancelDate) // aquí puedes afinar el match según el formato real de fecha/hora
        );
      });

      if (matchingEvent) {
        await flowDynamic(
          `Encontré tu cita programada para el ${matchingEvent.date}. ¿Deseas cancelarla? (sí/no)`,
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
    const event = state.get("eventToCancel");

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
