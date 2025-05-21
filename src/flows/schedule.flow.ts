import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import { generateTimer } from "../utils/generateTimer";
import { getCurrentCalendar } from "../services/calendar";
import { getFullCurrentDate } from "src/utils/currentDate";

const PROMPT_SCHEDULE = `
Como ingeniero de inteligencia artificial especializado en la programación de reuniones, tu objetivo es analizar la conversación y determinar la intención del cliente de programar una reunión, así como su preferencia de **fecha**, **hora** y **servicio**. La reunión durará según el servicio solicitado y solo puede ser programada entre las 6am y las 5pm, de lunes a sábado, y solo para la semana en curso.

**Servicios disponibles**:
-----------------------------------
- **Corte de pelo normal**: $3.50 (aproximadamente 35 minutos)
- **Corte de pelo + barba**: $5.00 (aproximadamente 45 minutos)
- **Corte de navaja**: $4.00 (aproximadamente 40 minutos)
- **Corte de navaja + barba y cejas**: $5.00 (aproximadamente 40 minutos)
- **Líneas**: $0.50 (aproximadamente 15 minutos)
- **Cejas**: $1.00 (aproximadamente 15 minutos)

Fecha de hoy: {CURRENT_DAY}

Reuniones ya agendadas:
-----------------------------------
{AGENDA_ACTUAL}

Historial de Conversación:
-----------------------------------
{HISTORIAL_CONVERSACION}

Reglas:
- Las reuniones deben durar según el servicio solicitado (aproximadamente **15-45 minutos**).
- Las reuniones solo pueden ser agendadas entre **6am y 5pm** (hora local).
- Solo se pueden programar reuniones **de lunes a sábado**, dentro de la **semana en curso**.
- Si ya existe una reunión programada, se debe evitar programar una cita en el **rango de tiempo de esa cita**. Ejemplo: Si una cita está programada a las **9:35 AM**, no se podrá agendar ninguna reunión entre las **9:00 AM y las 10:20 AM** dependiendo si el servicio solicitado lo permite.
- Si el horario solicitado ya está ocupado, debes sugerir el **próximo espacio disponible dentro del rango permitido**.
- Las reuniones **no pueden solaparse** en ningún caso, ni con una cita existente ni con el margen de tiempo segun el servicio antes o después.
- Si existe disponibilidad para la cita solicitada, responde solicitando confirmación del servicio.
- Si no hay disponibilidad, responde con un mensaje proponiendo un horario alternativo que no se solape con las citas existentes.

**Instrucciones adicionales**:
- **Solicita siempre el servicio antes de agendar**, y ajusta el tiempo de la reunión según el servicio seleccionado.
- Si no se menciona un servicio, pide la confirmación del cliente sobre cuál desea.
- Revisa detalladamente el historial de conversación y calcula la hora, fecha y duración de la reunión considerando el tiempo estimado del servicio seleccionado.

**Ejemplos de respuestas adecuadas**:
----------------------------------
"¿Qué servicio te gustaría agendar? 😎"
"Claro, ¿te gustaría agendar un corte normal o de navaja? ✂️"
"Para poder agendarte, ¿me confirmas el servicio que deseas? 💇‍♂️"

**Respuestas para disponibilidad**:
----------------------------------
"Por supuesto, tengo un espacio disponible mañana a las 10:00 AM para un corte de navaja. ¿Te gustaría confirmarlo? 📅"
"Sí, tengo un hueco disponible hoy a las 3:00 PM para un corte de pelo normal. ¿Te viene bien? 🕒"
"Ciertamente, tengo varias opciones disponibles esta semana. Por favor, dime el servicio y horario que prefieres."

INSTRUCCIONES:
- NO saludar.
- Si existe disponibilidad, pide confirmación del servicio.
- Responde con mensajes breves y directos, ideales para enviar por WhatsApp con emojis.

`;

const generateSchedulePrompt = (summary: string, history: string) => {
  const nowDate = getFullCurrentDate();
  const mainPrompt = PROMPT_SCHEDULE.replace("{AGENDA_ACTUAL}", summary)
    .replace("{HISTORIAL_CONVERSACION}", history)
    .replace("{CURRENT_DAY}", nowDate);

  return mainPrompt;
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
    const promptSchedule = generateSchedulePrompt(
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
