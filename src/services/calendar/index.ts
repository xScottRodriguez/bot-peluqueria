import { format, addMinutes } from "date-fns";
import { IEvent, IEventCalendar } from "src/common/interfaces";
import { envs } from "src/config/envs";

/**
 * get calendar
 * @returns
 */
const getCurrentCalendar = async (): Promise<string> => {
  const dataCalendarApi = await fetch(envs.getCalendarEvents);
  const json: IEventCalendar[] = await dataCalendarApi.json();

  const list = json.reduce((prev, current) => {
    if (!current?.startDate) {
      return prev;
    }
    return (prev += [
      `Espacio reservado (no disponible): `,
      `Desde ${format(current?.startDate, "yyyy-MM-dd HH:mm")} `,
      `Hasta ${format(current?.endDate, "yyyy-MM-dd HH:mm")} \n`,
    ].join(" "));
  }, "");
  return list;
};
/**
 * get current calendar in JSON format
 * @returns
 */
const getCurrentCalendarToJson = async (): Promise<IEventCalendar[]> => {
  const dataCalendarApi = await fetch(envs.getCalendarEvents);
  const json: IEventCalendar[] = await dataCalendarApi.json();

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
const deleteCalendarEvent = async (event: IEventCalendar) => {
  try {
    const payload = {
      startDate: event.startDate,
      name: `${event.service}: ${event.client} -- ${event.phoneNumber}`,
    };
    await fetch(envs.deleteEventFromCalendar, {
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
