import { format, addMinutes } from "date-fns";
import { IEvent } from "src/common/interfaces";
import { envs } from "src/config/envs";

/**
 * get calendar
 * @returns
 */
const getCurrentCalendar = async (): Promise<string> => {
  const dataCalendarApi = await fetch(envs.getCalendarEvents);
  const json: any[] = await dataCalendarApi.json();

  const list = json.reduce((prev, current) => {
    if (!current?.date) {
      return prev;
    }
    return (prev += [
      `Espacio reservado (no disponible): `,
      `Desde ${format(current?.date, "yyyy-MM-dd HH:mm")} `,
      `Hasta ${format(addMinutes(current?.date, 45), "yyyy-MM-dd HH:mm")} \n`,
    ].join(" "));
  }, "");
  return list;
};
/**
 * get current calendar in JSON format
 * @returns
 */
const getCurrentCalendarToJson = async (): Promise<any[]> => {
  const dataCalendarApi = await fetch(envs.getCalendarEvents);
  const json: any[] = await dataCalendarApi.json();

  return json;
};
/**
 * add to calendar
 * @param text
 * @returns
 */
const appToCalendar = async (text: string) => {
  try {
    const payload = JSON.parse(text);
    const dataApi = await fetch(envs.adddEventToCalendar, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return dataApi;
  } catch (err) {
    console.log(`error: `, err);
  }
};

/**
 * Delete calendar event
 * @param event
 * @returns
 */
const deleteCalendarEvent = async (event: IEvent) => {
  try {
    const payload = {
      startDate: event.date,
      name: `Corte: ${event.name} -- ${event["phone number"]}`,
    };
    await fetch(envs.delteEventFromCalendar, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("error:", {
      error: error.message,
      stack: error.stack,
    });
  }
};

export {
  getCurrentCalendar,
  appToCalendar,
  getCurrentCalendarToJson,
  deleteCalendarEvent,
};
