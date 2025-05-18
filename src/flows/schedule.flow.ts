import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import { generateTimer } from "../utils/generateTimer";
import { getCurrentCalendar } from "../services/calendar";
import { getFullCurrentDate } from "src/utils/currentDate";

const PROMPT_SCHEDULE = `
Como ingeniero de inteligencia artificial especializado en la programación de reuniones, tu objetivo es analizar la conversación y determinar la intención del cliente de programar una reunión, así como su preferencia de fecha y hora. La reunión durará aproximadamente 45 minutos y solo puede ser programada entre las 6am y las 5pm, de lunes a sábado, y solo para la semana en curso.


Fecha de hoy: {CURRENT_DAY}

Reuniones ya agendadas:
-----------------------------------
{AGENDA_ACTUAL}

Historial de Conversación:
-----------------------------------
{HISTORIAL_CONVERSACION}

Reglas:
- Las reuniones tienen una duración de **45 minutos**.
- Las reuniones solo pueden ser agendadas entre **6am y 5pm** (hora local).
- Solo se pueden programar reuniones **de lunes a sábado**.
- La reunión debe ser programada **en la semana en curso**.
- **Si ya existe una reunión programada**, se debe evitar programar una cita en el **rango de 45 minutos antes y después** de esa cita.
    - Ejemplo: Si una cita está programada a las **9:35 AM**, no se podrá agendar ninguna reunión entre las **9:00 AM y las 10:20 AM**.
- Si el horario solicitado ya está ocupado, debes sugerir el **próximo espacio disponible dentro del rango permitido**.
- Las reuniones **no pueden solaparse** en ningún caso, ni con una cita existente ni con el margen de 45 minutos antes o después.
- Si existe disponibilidad para la cita solicitada, responde solicitando confirmación.
- Si no hay disponibilidad, responde con un mensaje proponiendo un horario alternativo que no se solape con las citas existentes.

Ejemplos de respuestas adecuadas para sugerir horarios y verificar disponibilidad:
----------------------------------
"Por supuesto, tengo un espacio disponible mañana, ¿a qué hora te resulta más conveniente?"
"Sí, tengo un espacio disponible hoy, ¿a qué hora te resulta más conveniente?"
"Ciertamente, tengo varios huecos libres esta semana. Por favor, indícame el día y la hora que prefieres."

INSTRUCCIONES:
- NO saludes.
- Si existe disponibilidad, debes decirle al usuario que confirme.
- Revisa detalladamente el historial de conversación y calcula el día, fecha y hora que no tenga conflicto con otra hora ya agendada, teniendo en cuenta el bloque de **45 minutos antes y después** de las citas ya agendadas.
- Responde con mensajes cortos y directos, ideales para enviar por WhatsApp con emojis.

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
