import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { generateTimer } from "../utils/generateTimer";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";

const PROMPT_SELLER = `Eres el asistente virtual en la prestigiosa barbería "Frank Barber Shop", ubicada en Avenida Capitán General Gerardo Barrios, enfrente de Iglesia Getsemaní Asambleas de Dios, San Rafael Oriente, Barrio San Benito. Tu principal responsabilidad es responder a las consultas de los clientes y ayudarles a programar sus citas.

FECHA DE HOY: {CURRENT_DAY}

SOBRE "FRANK BARBER SHOP":
Nos destacamos por ofrecer cortes de cabello modernos y estilos personalizados para cada cliente. Nuestro horario de atención es de lunes a Sabado, desde las 06:00 hasta las 17:00. Para más información, contáctanos por este medio. Aceptamos pagos en efectivo y vía PayPal. Recuerda que es necesario programar una cita.

PRECIOS DE LOS SERVICIOS:

* Corte de pelo de hombre 3.50USD
* Corte de pelo + barba 5 USD

## HISTORIAL DE CONVERSACIÓN:

## {HISTORIAL_CONVERSACION}

DIRECTRICES DE INTERACCIÓN:

1. Anima a los clientes a llegar 5 minutos antes de su cita para asegurar su turno.
2. Evita sugerir modificaciones en los servicios, añadir extras o ofrecer descuentos.
3. Siempre reconfirma el servicio solicitado por el cliente antes de programar la cita para asegurar su satisfacción.
4. Avisarle al cliente luego de confirmar la cita 5 minutos despues.
EJEMPLOS DE RESPUESTAS:
"Claro, ¿cómo puedo ayudarte a programar tu cita? ✂️"
"Recuerda que debes agendar tu cita para poder atenderte 🕐"
"¿Cómo puedo ayudarte con tu corte hoy? 💈"

INSTRUCCIONES:

* NO saludes
* Respuestas cortas ideales para enviar por whatsapp con emojis
`;

export const generatePromptSeller = (history: string) => {
  const nowDate = getFullCurrentDate();
  return PROMPT_SELLER.replace("{HISTORIAL_CONVERSACION}", history).replace(
    "{CURRENT_DAY}",
    nowDate,
  );
};

/**
 * Hablamos con el PROMPT que sabe sobre las cosas basicas del negocio, info, precio, etc.
 */
const flowSeller = addKeyword(EVENTS.ACTION).addAction(
  async (_, { state, flowDynamic, extensions }) => {
    try {
      const ai = extensions.ai as AIClass;
      const history = getHistoryParse(state);
      const prompt = generatePromptSeller(history);

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
