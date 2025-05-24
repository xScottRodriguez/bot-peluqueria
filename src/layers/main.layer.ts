import { BotContext, BotMethods } from "@bot-whatsapp/bot/dist/types";
import { getHistoryParse } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { flowSeller } from "../flows/seller.flow";
import { flowSchedule } from "../flows/schedule.flow";
import { flowConfirm } from "../flows/confirm.flow";
import { flowCancel } from "src/flows/cancel-schedule.flow";

/**
 * Determina que flujo va a iniciarse basado en el historial que previo entre el bot y el humano
 */
export default async (
  _: BotContext,
  { state, gotoFlow, extensions }: BotMethods,
) => {
  const ai = extensions.ai as AIClass;
  const history = getHistoryParse(state);
  const prompt =
    `Como una inteligencia artificial avanzada, tu tarea es analizar el contexto de una conversación y determinar cuál de las siguientes acciones es más apropiada para realizar:
    --------------------------------------------------------
    Historial de conversación:
    {HISTORY}
    
    Posibles acciones a realizar:
    1. AGENDAR: Esta acción se debe realizar cuando el cliente expresa su deseo de programar una cita.
    2. HABLAR: Esta acción se debe realizar cuando el cliente desea hacer una pregunta o necesita más información o si pregunta por el propietario de la peluqueria(frank,francisco,chico) sera uno de esos 3 nombres ya que son apodos y nombre real.
    3. CONFIRMAR: Esta acción se debe realizar cuando el cliente y el vendedor llegaron a un acuerdo mutuo proporcionando una fecha, dia y hora exacta sin conflictos de hora.
    4. CANCELAR: Esta acción se debe realizar cuando el cliente desea cancelar una cita previamente agendada.
    -----------------------------
    Tu objetivo es comprender la intención del cliente y seleccionar la acción más adecuada en respuesta a su declaración.
    
    Respuesta ideal (AGENDAR|HABLAR|CONFIRMAR|CANCELAR):`.replace(
      "{HISTORY}",
      history,
    );

  const text = await ai.createChat([
    {
      role: "system",
      content: prompt,
    },
  ]);

  if (text.includes("HABLAR")) return gotoFlow(flowSeller);
  if (text.includes("AGENDAR")) return gotoFlow(flowSchedule);
  if (text.includes("CONFIRMAR")) return gotoFlow(flowConfirm);
  if (text.includes("CANCELAR")) return gotoFlow(flowCancel);
};
